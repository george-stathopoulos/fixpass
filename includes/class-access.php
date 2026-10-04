<?php
/**
 * Temporary support access: the support user, one-time login links, expiry and limits.
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

/**
 * A "grant" is one period of support access. It owns a temporary user account that is deleted
 * when the grant expires or is revoked. Login links are single-use: a link opens a confirmation
 * page and only the button press (a POST) uses it up, so email security scanners that open links
 * automatically cannot burn it.
 */
final class Fixpass_Access {

	const META         = 'fixpass_grant';
	const SUPPORTER    = 'fixpass_supporter';
	const SUPPORTER_NAME = 'fixpass_supporter_name';
	const CRON         = 'fixpass_expire_access';
	const LOGIN_ACTION = 'fixpass';
	const CAP          = 'fixpass_manage';

	/**
	 * End time stored for access with no end date.
	 */
	const FOREVER = '9999-12-31 23:59:59';

	/**
	 * True while revoke() deletes accounts, so their deletion doesn't start another revoke.
	 *
	 * @var bool
	 */
	private static $ending = false;

	/**
	 * The account being deleted that caused a revoke: WordPress is already deleting it.
	 *
	 * @var int
	 */
	private static $deleting = 0;

	/**
	 * The status a grant is left in, by why it ended.
	 */
	const END_STATUS = array(
		'revoked'       => 'revoked',
		'expired'       => 'expired',
		'support_ended' => 'support_revoked',
		'deleted'       => 'deleted',
		'deactivated'   => 'deactivated',
	);

	/**
	 * Cached grant for the current user.
	 *
	 * @var array|null|false
	 */
	private static $current = false;

	/**
	 * Register hooks.
	 */
	public static function init() {
		add_action( 'login_form_' . self::LOGIN_ACTION, array( __CLASS__, 'login_screen' ) );
		add_filter( 'authenticate', array( __CLASS__, 'block_password_login' ), 100, 2 );
		add_filter( 'determine_current_user', array( __CLASS__, 'enforce_expiry' ), 100 );
		add_filter( 'auth_cookie_expiration', array( __CLASS__, 'cookie_expiration' ), 100, 2 );
		add_filter( 'user_has_cap', array( __CLASS__, 'limit_caps' ), 100, 4 );
		add_filter( 'map_meta_cap', array( __CLASS__, 'protect' ), 100, 4 );
		add_action( self::CRON, array( __CLASS__, 'expire_due' ) );
		add_action( 'wp_login', array( __CLASS__, 'on_login' ), 10, 2 );
		add_action( 'wp_logout', array( __CLASS__, 'on_logout' ) );
		add_action( 'delete_user', array( __CLASS__, 'on_user_deleted' ) );
		add_action( 'wpmu_delete_user', array( __CLASS__, 'on_user_deleted' ) );
		add_action( 'remove_user_from_blog', array( __CLASS__, 'on_user_deleted' ) );
	}

	/**
	 * Roles a grant can use.
	 *
	 * @return array Key => label.
	 */
	public static function roles() {
		$roles = array(
			'restricted_admin' => __( 'Administrator, without user management or code editing (recommended)', 'fixpass' ),
			'administrator'    => __( 'Full administrator', 'fixpass' ),
			'editor'           => __( 'Editor (content only)', 'fixpass' ),
		);
		if ( get_role( 'shop_manager' ) ) {
			$roles['shop_manager'] = __( 'Shop manager (WooCommerce)', 'fixpass' );
		}
		/**
		 * Filters the roles that can be given to support.
		 *
		 * @param array $roles Key => label. Keys are WordPress roles, plus "restricted_admin".
		 */
		return (array) apply_filters( 'fixpass_access_roles', $roles );
	}

	/**
	 * Durations offered, in hours.
	 *
	 * @return array Hours => label.
	 */
	public static function durations() {
		return array(
			1   => __( '1 hour', 'fixpass' ),
			4   => __( '4 hours', 'fixpass' ),
			24  => __( '24 hours', 'fixpass' ),
			72  => __( '3 days', 'fixpass' ),
			168 => __( '7 days', 'fixpass' ),
			336 => __( '14 days', 'fixpass' ),
		);
	}

	/**
	 * Capabilities a restricted administrator never gets.
	 *
	 * @return string[]
	 */
	public static function restricted_caps() {
		return (array) apply_filters(
			'fixpass_restricted_caps',
			array( 'create_users', 'delete_users', 'edit_users', 'promote_users', 'remove_users', 'add_users', 'edit_plugins', 'edit_themes', 'edit_files', 'install_plugins', 'delete_plugins', 'install_themes', 'delete_themes', 'update_core', 'export', 'manage_network', 'manage_sites', 'manage_network_users', 'manage_network_plugins' )
		);
	}

	/**
	 * Create a grant with its temporary user and first login link.
	 *
	 * @param array $args hours, role, ticket_id, note, allow_plugins.
	 * @return array|WP_Error { grant: array, url: string }
	 */
	public static function create( array $args ) {
		global $wpdb;
		if ( 'off' === Fixpass_Policy::section( 'access' )['mode'] ) {
			return new WP_Error( 'fixpass_policy', __( 'Your support team does not use site access.', 'fixpass' ) );
		}
		// The support team's policy decides the role, the length and plugin installs.
		$resolved = Fixpass_Policy::resolve_access( $args );
		$hours    = $resolved['hours'];
		$role     = $resolved['role'];
		if ( 'shop_manager' === $role && ! get_role( 'shop_manager' ) ) {
			$role = 'restricted_admin';
		}

		// Two "create" clicks landing at the same instant must not make two accounts. add_option()
		// is atomic (option names are unique), so only one request gets the lock.
		$lock = 'fixpass_creating';
		$held = (int) get_option( $lock, 0 );
		if ( $held && $held < time() - 30 ) {
			delete_option( $lock ); // Left behind by a request that died.
		}
		if ( ! add_option( $lock, time(), '', false ) ) {
			return new WP_Error( 'fixpass_busy', __( 'Support access is already being created. Wait a moment, then reload the page.', 'fixpass' ) );
		}
		try {
			return self::create_locked( $args, $resolved, $hours, $role );
		} finally {
			delete_option( $lock );
		}
	}

	/**
	 * create(), once it holds the lock.
	 *
	 * @param array  $args     Arguments.
	 * @param array  $resolved Resolved access.
	 * @param int    $hours    Hours.
	 * @param string $role     Role.
	 * @return array|WP_Error
	 */
	private static function create_locked( array $args, array $resolved, $hours, $role ) {
		global $wpdb;
		// One access per site: while it is active, granting again changes it instead.
		$active = self::active();
		if ( $active ) {
			$changed = self::change( (int) $active['id'], $hours, $role, $resolved['allow_plugins'] );
			if ( is_wp_error( $changed ) ) {
				return $changed;
			}
			$url = self::new_link( (int) $active['id'] );
			do_action( 'fixpass_access_changed', (int) $active['id'], 'changed' );
			return array(
				'grant'    => self::get( (int) $active['id'] ),
				'url'      => is_wp_error( $url ) ? '' : $url,
				'existing' => true,
			);
		}

		$user_id = self::create_user( $role, sprintf( /* translators: %s: support team name */ __( '%s (temporary access)', 'fixpass' ), Fixpass_Settings::support_name() ) );
		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}
		$suffix = substr( get_userdata( $user_id )->user_login, 8 );

		$wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
			Fixpass_DB::table( 'grants' ),
			array(
				'user_id'       => $user_id,
				'ticket_id'     => (int) ( $args['ticket_id'] ?? 0 ),
				'role'          => $role,
				'allow_plugins' => $resolved['allow_plugins'] ? 1 : 0,
				'expires_at'    => self::expiry( $hours ),
				'created_by'    => get_current_user_id(),
				'created_at'    => Fixpass_DB::now(),
				'note'          => substr( sanitize_text_field( (string) ( $args['note'] ?? '' ) ), 0, 255 ),
				'status'        => 'waiting',
				'cleanup'       => empty( $args['cleanup'] ) ? 0 : 1,
				'reusable'      => empty( $args['reusable'] ) ? 0 : 1,
			)
		);
		$grant_id = (int) $wpdb->insert_id;
		update_user_meta( $user_id, self::META, $grant_id );

		Fixpass_Monitor::record(
			'access',
			'access_granted',
			'support-' . $suffix,
			array(
				'hours' => $hours,
				'role'  => $role,
			),
			$grant_id
		);

		$url = self::new_link( $grant_id );

		/**
		 * Fires after support access is granted.
		 *
		 * @param int   $grant_id Grant ID.
		 * @param array $args     Arguments.
		 */
		do_action( 'fixpass_access_granted', $grant_id, $args );

		return array(
			'grant'    => self::get( $grant_id ),
			'url'      => $url,
			'existing' => false,
		);
	}

	/**
	 * Change the active access: a new end time counted from now, and possibly a different role or
	 * plugin permission. Every account under the access gets the new role.
	 *
	 * @param int    $grant_id      Grant.
	 * @param int    $hours         Hours from now.
	 * @param string $role          Role.
	 * @param bool   $allow_plugins Plugin installs.
	 * @return true|WP_Error
	 */
	public static function change( $grant_id, $hours, $role, $allow_plugins ) {
		global $wpdb;
		$grant = self::get( $grant_id );
		if ( ! self::is_active( $grant ) ) {
			return new WP_Error( 'fixpass_inactive', __( 'Support access is not active.', 'fixpass' ) );
		}
		if ( Fixpass_Policy::PERMANENT === (int) $hours ) {
			$expires_at = self::FOREVER;
		} else {
			$ceiling    = time() + (int) Fixpass_Policy::section( 'access' )['max_hours'] * HOUR_IN_SECONDS;
			$expires_at = gmdate( 'Y-m-d H:i:s', min( $ceiling, time() + max( 1, (int) $hours ) * HOUR_IN_SECONDS ) );
		}
		$wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			Fixpass_DB::table( 'grants' ),
			array(
				'expires_at'        => $expires_at,
				'role'              => $role,
				'allow_plugins'     => $allow_plugins ? 1 : 0,
				'extension_request' => null,
			),
			array( 'id' => (int) $grant_id )
		);
		if ( $role !== $grant['role'] ) {
			$wp_role = 'restricted_admin' === $role ? 'administrator' : $role;
			foreach ( array_unique( array_filter( array_merge( array( (int) $grant['user_id'] ), self::users_for_grant( (int) $grant_id ) ) ) ) as $user_id ) {
				$user = get_userdata( $user_id );
				if ( $user ) {
					$user->set_role( $wp_role );
				}
			}
		}
		Fixpass_Monitor::record(
			'access',
			'access_changed',
			'',
			array(
				'hours' => (int) $hours,
				'role'  => $role,
			),
			(int) $grant_id
		);
		self::$current = false;
		return true;
	}

	/**
	 * The site's active access, if any. There is at most one; it serves every open ticket.
	 *
	 * @return array|null
	 */
	public static function active() {
		$rows = self::all( true, 1 );
		return $rows ? $rows[0] : null;
	}

	/**
	 * Create a temporary support user.
	 *
	 * @param string $role         Grant role (restricted_admin becomes an administrator limited by user_has_cap).
	 * @param string $display_name Display name.
	 * @param string $login_hint   Optional readable part of the login name (e.g. the supporter's name).
	 * @return int|WP_Error User ID.
	 */
	private static function create_user( $role, $display_name, $login_hint = '' ) {
		$suffix  = strtolower( wp_generate_password( 6, false ) );
		$hint    = substr( sanitize_user( strtolower( remove_accents( str_replace( ' ', '-', $login_hint ) ) ), true ), 0, 20 );
		$login   = 'support-' . ( '' !== $hint ? $hint . '-' : '' ) . $suffix;
		$host    = wp_parse_url( home_url(), PHP_URL_HOST );
		$host    = $host && false !== strpos( $host, '.' ) ? $host : 'example.invalid';
		$user_id = wp_insert_user(
			array(
				'user_login'   => $login,
				'user_pass'    => wp_generate_password( 64, true, true ),
				'user_email'   => 'fixpass-' . $suffix . '@' . $host,
				'display_name' => $display_name,
				'first_name'   => Fixpass_Settings::support_name(),
				'role'         => 'restricted_admin' === $role ? 'administrator' : $role,
				'description'  => __( 'Temporary support account created by Fixpass. It is deleted automatically when access ends.', 'fixpass' ),
			)
		);
		if ( ! is_wp_error( $user_id ) ) {
			update_user_meta( $user_id, 'show_admin_bar_front', 'true' );
		}
		return $user_id;
	}

	/**
	 * Every account created under a grant: the team account and supporters' personal accounts.
	 *
	 * @param int $grant_id Grant.
	 * @return int[]
	 */
	public static function users_for_grant( $grant_id ) {
		return array_map(
			'intval',
			get_users(
				array(
					'meta_key'   => self::META, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
					'meta_value' => (int) $grant_id, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
					'fields'     => 'ID',
					'blog_id'    => get_current_blog_id(),
				)
			)
		);
	}

	/**
	 * Issue a fresh single-use login link. Any earlier unused link stops working.
	 *
	 * @param int $grant_id Grant.
	 * @param int $user_id  Account the link logs in to (a supporter's); 0 for the grant's own account.
	 * @return string|WP_Error URL.
	 */
	public static function new_link( $grant_id, $user_id = 0 ) {
		global $wpdb;
		$grant = self::get( $grant_id );
		if ( ! $grant || ! self::is_active( $grant ) ) {
			return new WP_Error( 'fixpass_inactive', __( 'Support access is not active.', 'fixpass' ) );
		}
		if ( ! empty( $grant['reusable'] ) ) {
			// A reusable link is the same every time it's asked for, so it can be copied again
			// all week without being stored: it's rebuilt from a random value kept with the access
			// and the site's secret keys (wp-config.php). Only its hash is stored.
			$nonce = (string) $grant['link_nonce'];
			if ( '' === $nonce ) {
				$nonce = bin2hex( random_bytes( 32 ) );
			}
			$secret = hash_hmac( 'sha256', 'fixpass-link|' . (int) $grant_id . '|' . $nonce, wp_salt( 'auth' ) );
			$wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				Fixpass_DB::table( 'grants' ),
				array(
					'token_hash' => hash( 'sha256', $secret ),
					'link_nonce' => $nonce,
				),
				array( 'id' => $grant_id )
			);
		} else {
			$secret = bin2hex( random_bytes( 32 ) ); // 256 bits.
			$wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				Fixpass_DB::table( 'grants' ),
				array(
					'token_hash'       => hash( 'sha256', $secret ),
					'token_created_at' => Fixpass_DB::now(),
					'token_used_at'    => null,
					'token_user_id'    => (int) $user_id,
				),
				array( 'id' => $grant_id )
			);
		}
		return add_query_arg(
			array(
				'action' => self::LOGIN_ACTION,
				'token'  => $grant_id . '.' . $secret,
			),
			wp_login_url()
		);
	}

	/**
	 * A grant row.
	 *
	 * @param int $grant_id ID.
	 * @return array|null
	 */
	public static function get( $grant_id ) {
		global $wpdb;
		$row = $wpdb->get_row( $wpdb->prepare( 'SELECT * FROM %i WHERE id = %d', Fixpass_DB::table( 'grants' ), $grant_id ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		if ( $row && $row['extension_request'] ) {
			$row['extension_request'] = json_decode( $row['extension_request'], true );
		}
		return $row ? $row : null;
	}

	/**
	 * Grants, newest first.
	 *
	 * @param bool $active_only Only active ones.
	 * @param int  $limit       Limit.
	 * @return array[]
	 */
	public static function all( $active_only = false, $limit = 50 ) {
		global $wpdb;
		if ( $active_only ) {
			$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM %i WHERE revoked_at IS NULL AND expires_at > %s ORDER BY id DESC LIMIT %d', Fixpass_DB::table( 'grants' ), Fixpass_DB::now(), $limit ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		} else {
			$rows = $wpdb->get_results( $wpdb->prepare( 'SELECT * FROM %i ORDER BY id DESC LIMIT %d', Fixpass_DB::table( 'grants' ), $limit ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		}
		foreach ( $rows as &$row ) {
			$row['extension_request'] = $row['extension_request'] ? json_decode( $row['extension_request'], true ) : null;
		}
		return $rows;
	}

	/**
	 * Whether a grant is usable now.
	 *
	 * @param array $grant Grant.
	 * @return bool
	 */
	public static function is_active( $grant ) {
		return $grant && empty( $grant['revoked_at'] ) && strtotime( $grant['expires_at'] . ' UTC' ) > time();
	}

	/**
	 * Whether a grant has no end date (it lasts until someone ends it).
	 *
	 * @param array|null $grant Grant.
	 * @return bool
	 */
	public static function is_permanent( $grant ) {
		return $grant && self::FOREVER === (string) $grant['expires_at'];
	}

	/**
	 * End time for a new grant.
	 *
	 * @param int $hours Hours, or Fixpass_Policy::PERMANENT.
	 * @return string GMT datetime.
	 */
	private static function expiry( $hours ) {
		return Fixpass_Policy::PERMANENT === (int) $hours ? self::FOREVER : Fixpass_DB::now( (int) $hours * HOUR_IN_SECONDS );
	}

	/**
	 * Grant ID of the current user, or 0.
	 *
	 * @return int
	 */
	public static function current_grant_id() {
		$grant = self::current_grant();
		return $grant ? (int) $grant['id'] : 0;
	}

	/**
	 * Grant of the current user.
	 *
	 * @return array|null
	 */
	public static function current_grant() {
		static $for_user = null;
		if ( false === self::$current || get_current_user_id() !== $for_user ) {
			$for_user       = get_current_user_id();
			$user_id        = $for_user;
			$grant_id       = $user_id ? (int) get_user_meta( $user_id, self::META, true ) : 0;
			self::$current  = $grant_id ? self::get( $grant_id ) : null;
		}
		return self::$current;
	}

	/**
	 * Whether a user is a temporary support user.
	 *
	 * @param int $user_id User.
	 * @return bool
	 */
	public static function is_support_user( $user_id ) {
		return $user_id && (int) get_user_meta( $user_id, self::META, true ) > 0;
	}

	/**
	 * Extend a grant.
	 *
	 * @param int $grant_id Grant.
	 * @param int $hours    Hours to add (from now, or from the current expiry if later).
	 * @return bool
	 */
	public static function extend( $grant_id, $hours ) {
		global $wpdb;
		$grant = self::get( $grant_id );
		if ( ! $grant || ! empty( $grant['revoked_at'] ) || self::is_permanent( $grant ) ) {
			return false;
		}
		$base    = max( time(), strtotime( $grant['expires_at'] . ' UTC' ) );
		// However often it's extended, one access lasts at most 30 days from when it was created.
		$ceiling = strtotime( $grant['created_at'] . ' UTC' ) + Fixpass_Policy::MAX_TOTAL_DAYS * DAY_IN_SECONDS;
		$new     = min( $ceiling, $base + max( 1, (int) $hours ) * HOUR_IN_SECONDS );
		if ( $new <= strtotime( $grant['expires_at'] . ' UTC' ) ) {
			return false;
		}
		$wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			Fixpass_DB::table( 'grants' ),
			array(
				'expires_at'        => gmdate( 'Y-m-d H:i:s', $new ),
				'extension_request' => null,
			),
			array( 'id' => $grant_id )
		);
		Fixpass_Monitor::record( 'access', 'access_extended', '', array( 'hours' => (int) $hours ), $grant_id );
		do_action( 'fixpass_access_changed', $grant_id, 'extended' );
		return true;
	}

	/**
	 * End a grant now and delete its user. Content the user created is given to the person who granted access.
	 *
	 * @param int    $grant_id Grant.
	 * @param string $reason   revoked (site owner) | expired | support_ended | closed (no open tickets left).
	 * @param string $by       Who ended it, when support did.
	 */
	public static function revoke( $grant_id, $reason = 'revoked', $by = '' ) {
		global $wpdb;
		$grant = self::get( $grant_id );
		if ( ! $grant ) {
			return;
		}
		if ( empty( $grant['revoked_at'] ) ) {
			$wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
				Fixpass_DB::table( 'grants' ),
				array(
					'revoked_at'        => Fixpass_DB::now(),
					'status'            => self::END_STATUS[ $reason ] ?? 'revoked',
					'token_hash'        => '',
					'extension_request' => null,
				),
				array( 'id' => $grant_id )
			);
			$actions = array(
				'expired'       => 'access_expired',
				'support_ended' => 'access_ended_support',
				'closed'        => 'access_ended_closed',
				'deleted'       => 'access_ended_deleted',
			);
			Fixpass_Monitor::record( 'access', $actions[ $reason ] ?? 'access_revoked', '', array_filter( array( 'by' => $by ) ), $grant_id );
		}
		// Every account created for this access goes: the team account and each supporter's own.
		$user_ids = array_unique( array_filter( array_merge( array( (int) $grant['user_id'] ), self::users_for_grant( (int) $grant_id ) ) ) );
		require_once ABSPATH . 'wp-admin/includes/user.php';
		$reassign = (int) $grant['created_by'] && get_userdata( (int) $grant['created_by'] ) ? (int) $grant['created_by'] : null;
		self::$ending = true;
		foreach ( $user_ids as $user_id ) {
			if ( self::$deleting === $user_id || ! get_userdata( $user_id ) ) {
				continue;
			}
			WP_Session_Tokens::get_instance( $user_id )->destroy_all();
			if ( is_multisite() ) {
				require_once ABSPATH . 'wp-admin/includes/ms.php';
				// Reassign content first: wpmu_delete_user() would otherwise delete it.
				if ( $reassign ) {
					remove_user_from_blog( $user_id, get_current_blog_id(), $reassign );
				}
				wpmu_delete_user( $user_id );
			} else {
				wp_delete_user( $user_id, $reassign );
			}
		}
		self::$ending  = false;
		self::$current = false;
		// The owner asked for Fixpass to remove itself once this access ended.
		if ( ! empty( $grant['cleanup'] ) && 'deactivated' !== $reason && ! wp_next_scheduled( Fixpass_Plugin::SELF_REMOVE ) ) {
			wp_schedule_single_event( time() + MINUTE_IN_SECONDS, Fixpass_Plugin::SELF_REMOVE );
		}
		do_action( 'fixpass_access_changed', $grant_id, $reason );
	}

	/**
	 * Support logged out (the WordPress Log out link, or their session ended).
	 *
	 * @param int $user_id User.
	 */
	public static function on_logout( $user_id = 0 ) {
		$grant_id = (int) get_user_meta( (int) $user_id, self::META, true );
		$grant    = $grant_id ? self::get( $grant_id ) : null;
		if ( self::is_active( $grant ) && 'active' === $grant['status'] ) {
			self::set_status( $grant_id, 'logged_out' );
		}
	}

	/**
	 * Record where a grant stands.
	 *
	 * @param int    $grant_id Grant.
	 * @param string $status   waiting | active | logged_out | left (ended the session).
	 */
	public static function set_status( $grant_id, $status ) {
		global $wpdb;
		$wpdb->update( Fixpass_DB::table( 'grants' ), array( 'status' => $status ), array( 'id' => (int) $grant_id ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
	}

	/**
	 * Where a grant stands, for the site owner: waiting, active (support is logged in),
	 * logged_out, left (support ended the session), or how it ended (support_revoked, revoked,
	 * expired, deleted).
	 *
	 * @param array $grant Grant.
	 * @return string
	 */
	public static function status( array $grant ) {
		$status = (string) $grant['status'];
		if ( ! empty( $grant['revoked_at'] ) ) {
			return '' !== $status ? $status : 'revoked';
		}
		if ( ! self::is_active( $grant ) ) {
			return 'expired';
		}
		if ( 'active' === $status ) {
			// Logged in means a live session; one that timed out counts as logged out.
			return WP_Session_Tokens::get_instance( (int) $grant['user_id'] )->get_all() ? 'active' : 'logged_out';
		}
		return '' !== $status ? $status : 'waiting';
	}

	/**
	 * A support account was deleted (by the site owner on the Users screen, or by anyone else):
	 * the access it belongs to ends too, and its other support accounts are deleted.
	 *
	 * @param int $user_id User being deleted or removed from this site.
	 */
	public static function on_user_deleted( $user_id ) {
		if ( self::$ending ) {
			return;
		}
		$grant_id = (int) get_user_meta( (int) $user_id, self::META, true );
		$grant    = $grant_id ? self::get( $grant_id ) : null;
		if ( ! $grant || ! empty( $grant['revoked_at'] ) ) {
			return;
		}
		self::$deleting = (int) $user_id;
		self::revoke( $grant_id, 'deleted' );
		self::$deleting = 0;
	}

	/**
	 * Cron: end grants that ran out.
	 */
	public static function expire_due() {
		global $wpdb;
		$ids = $wpdb->get_col( $wpdb->prepare( 'SELECT id FROM %i WHERE revoked_at IS NULL AND expires_at <= %s', Fixpass_DB::table( 'grants' ), Fixpass_DB::now() ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		foreach ( $ids as $id ) {
			self::revoke( (int) $id, 'expired' );
		}
	}

	/**
	 * Login link screen: GET shows a confirmation button, POST uses up the link and logs in.
	 */
	public static function login_screen() {
		$token = isset( $_REQUEST['token'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['token'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- the single-use token is the credential.
		$error = null;
		// Slow down guessing: 10 wrong links per address per hour.
		$ip       = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
		$tries    = 'fixpass_login_fail_' . md5( (string) $ip );
		$failures = (int) get_transient( $tries );
		$grant    = $failures >= 10 ? new WP_Error( 'fixpass_rate', __( 'Too many invalid support login links from your address. Try again in an hour, or ask the site owner for a new link.', 'fixpass' ) ) : self::grant_for_token( $token );
		if ( is_wp_error( $grant ) && 'fixpass_link' === $grant->get_error_code() ) {
			set_transient( $tries, $failures + 1, HOUR_IN_SECONDS );
		}

		if ( is_wp_error( $grant ) ) {
			$error = $grant;
		} elseif ( isset( $_SERVER['REQUEST_METHOD'] ) && 'POST' === $_SERVER['REQUEST_METHOD'] ) {
			if ( ! isset( $_POST['fixpass_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['fixpass_nonce'] ) ), 'fixpass_login_' . $grant['id'] ) ) {
				$error = new WP_Error( 'fixpass_nonce', __( 'This page expired. Open the link again.', 'fixpass' ) );
			} else {
				self::consume_and_login( $grant );
			}
		}

		nocache_headers();
		header( 'Referrer-Policy: no-referrer' );
		login_header( __( 'Support login', 'fixpass' ), '', $error );

		if ( ! $error ) {
			$expires = strtotime( $grant['expires_at'] . ' UTC' );
			echo '<form method="post" action="' . esc_url( add_query_arg( array( 'action' => self::LOGIN_ACTION ), wp_login_url() ) ) . '">';
			echo '<p>' . esc_html(
				self::is_permanent( $grant )
					? sprintf(
						/* translators: %s: site name */
						__( 'Log in to %s with support access. This access has no end date; the site owner can end it at any time.', 'fixpass' ),
						wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES )
					)
					: sprintf(
						/* translators: 1: site name, 2: time left */
						__( 'Log in to %1$s with temporary support access. Access ends in %2$s.', 'fixpass' ),
						wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
						human_time_diff( time(), $expires )
					)
			) . '</p>';
			echo '<p style="margin:12px 0">' . esc_html(
				empty( $grant['reusable'] )
					? __( 'This link works once. The site owner can end access at any time.', 'fixpass' )
					: __( 'This link works until access ends. The site owner can end access at any time.', 'fixpass' )
			) . '</p>';
			echo '<input type="hidden" name="token" value="' . esc_attr( $token ) . '">';
			wp_nonce_field( 'fixpass_login_' . $grant['id'], 'fixpass_nonce' );
			echo '<p class="submit"><button type="submit" class="button button-primary button-large">' . esc_html__( 'Log in as support', 'fixpass' ) . '</button></p>';
			echo '</form>';
		}
		login_footer();
		exit;
	}

	/**
	 * Validate a login token.
	 *
	 * @param string $token "{grant_id}.{secret}".
	 * @return array|WP_Error Grant.
	 */
	public static function grant_for_token( $token ) {
		$invalid = new WP_Error( 'fixpass_link', __( 'This support login link is not valid. It may have been used already, replaced by a newer link, or access may have ended. Ask the site owner for a new link.', 'fixpass' ) );
		if ( ! preg_match( '/^(\d+)\.([a-f0-9]{64})$/', (string) $token, $m ) ) {
			return $invalid;
		}
		$grant = self::get( (int) $m[1] );
		if ( ! $grant || '' === $grant['token_hash'] || ( empty( $grant['reusable'] ) && ! empty( $grant['token_used_at'] ) ) || ! hash_equals( $grant['token_hash'], hash( 'sha256', $m[2] ) ) ) {
			return $invalid;
		}
		if ( ! self::is_active( $grant ) || ! get_userdata( self::login_user_id( $grant ) ) ) {
			return new WP_Error( 'fixpass_expired', __( 'Support access to this site has ended.', 'fixpass' ) );
		}
		return $grant;
	}

	/**
	 * The account a grant's current link logs in to.
	 *
	 * @param array $grant Grant.
	 * @return int User ID.
	 */
	private static function login_user_id( array $grant ) {
		$user_id = (int) ( $grant['token_user_id'] ?? 0 );
		return $user_id && (int) get_user_meta( $user_id, self::META, true ) === (int) $grant['id'] ? $user_id : (int) $grant['user_id'];
	}

	/**
	 * Mark the link used and log in.
	 *
	 * @param array $grant Grant.
	 */
	private static function consume_and_login( array $grant ) {
		global $wpdb;
		if ( ! empty( $grant['reusable'] ) ) {
			// Reusable: works until access ends; just note when it was last used.
			$wpdb->update( Fixpass_DB::table( 'grants' ), array( 'token_used_at' => Fixpass_DB::now() ), array( 'id' => (int) $grant['id'] ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			$updated = 1;
		} else {
			// One-time: atomic, so only one request can flip token_used_at from NULL.
			$updated = $wpdb->query( $wpdb->prepare( 'UPDATE %i SET token_used_at = %s WHERE id = %d AND token_used_at IS NULL AND token_hash = %s', Fixpass_DB::table( 'grants' ), Fixpass_DB::now(), $grant['id'], $grant['token_hash'] ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		}
		if ( 1 !== (int) $updated ) {
			wp_die( esc_html__( 'This support login link was already used.', 'fixpass' ), '', array( 'response' => 403 ) );
		}
		$user = get_userdata( self::login_user_id( $grant ) );
		wp_clear_auth_cookie();
		wp_set_current_user( $user->ID );
		wp_set_auth_cookie( $user->ID, false, is_ssl() );
		Fixpass_Monitor::record( 'access', 'support_login', $user->user_login, array( 'user_agent' => isset( $_SERVER['HTTP_USER_AGENT'] ) ? substr( sanitize_text_field( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) ), 0, 200 ) : '' ), (int) $grant['id'] );
		do_action( 'wp_login', $user->user_login, $user ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- core's login hook, fired as wp_signon() does.
		// Straight to the Support session page: the tickets, their problem spots and troubleshooting.
		wp_safe_redirect( admin_url( 'admin.php?page=' . Fixpass_Admin::SLUG ) );
		exit;
	}

	/**
	 * Tell the site owner that support logged in.
	 *
	 * @param string  $login User login.
	 * @param WP_User $user  User.
	 */
	public static function on_login( $login, $user ) {
		if ( ! self::is_support_user( $user->ID ) ) {
			return;
		}
		$grant_id = (int) get_user_meta( $user->ID, self::META, true );
		self::set_status( $grant_id, 'active' );
		do_action( 'fixpass_access_changed', $grant_id, 'login' );
		wp_mail(
			Fixpass_Settings::notify_email(),
			/* translators: %s: site name */
			sprintf( __( '[%s] Support logged in to your site', 'fixpass' ), wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ) ),
			sprintf(
				/* translators: 1: support name, 2: IP, 3: URL */
				__( "%1\$s just logged in using the support link you created (IP %2\$s).\n\nYou can end access at any time: %3\$s", 'fixpass' ),
				Fixpass_Settings::support_name(),
				Fixpass_Monitor::ip(),
				admin_url( 'admin.php?page=fixpass' )
			)
		);
	}

	/**
	 * Support users can only log in with a link, never a password.
	 *
	 * @param WP_User|WP_Error|null $user     User.
	 * @param string                $username Username.
	 * @return WP_User|WP_Error|null
	 */
	public static function block_password_login( $user, $username ) {
		if ( $user instanceof WP_User && self::is_support_user( $user->ID ) && '' !== (string) $username ) {
			return new WP_Error( 'fixpass_password', __( 'Temporary support accounts can only log in with a support login link.', 'fixpass' ) );
		}
		return $user;
	}

	/**
	 * Treat expired or revoked support users as logged out, even before cron deletes them.
	 *
	 * @param int|false $user_id User.
	 * @return int|false
	 */
	public static function enforce_expiry( $user_id ) {
		if ( ! $user_id ) {
			return $user_id;
		}
		$grant_id = (int) get_user_meta( $user_id, self::META, true );
		if ( ! $grant_id ) {
			return $user_id;
		}
		$grant = self::get( $grant_id );
		if ( ! self::is_active( $grant ) ) {
			if ( $grant && empty( $grant['revoked_at'] ) ) {
				wp_schedule_single_event( time(), self::CRON ); // Duplicates within 10 minutes are ignored by WordPress.
			}
			return false;
		}
		return $user_id;
	}

	/**
	 * Login cookies for support users never outlive the grant.
	 *
	 * @param int $length  Seconds.
	 * @param int $user_id User.
	 * @return int
	 */
	public static function cookie_expiration( $length, $user_id ) {
		$grant_id = (int) get_user_meta( $user_id, self::META, true );
		if ( $grant_id ) {
			$grant = self::get( $grant_id );
			if ( $grant ) {
				return max( 60, min( (int) $length, strtotime( $grant['expires_at'] . ' UTC' ) - time() ) );
			}
		}
		return $length;
	}

	/**
	 * Remove restricted capabilities from restricted administrators.
	 *
	 * @param array   $allcaps All caps.
	 * @param array   $caps    Required caps.
	 * @param array   $args    Args.
	 * @param WP_User $user    User.
	 * @return array
	 */
	public static function limit_caps( $allcaps, $caps, $args, $user ) {
		if ( ! $user instanceof WP_User || ! $user->ID ) {
			return $allcaps;
		}
		$grant_id = (int) get_user_meta( $user->ID, self::META, true );
		if ( ! $grant_id ) {
			return $allcaps;
		}
		static $grants = array();
		if ( ! array_key_exists( $grant_id, $grants ) ) {
			$grants[ $grant_id ] = self::get( $grant_id );
		}
		$grant = $grants[ $grant_id ];
		if ( ! $grant ) {
			return $allcaps;
		}
		// Whatever the role, support never manages users: an account they created or promoted
		// would outlive their access.
		foreach ( array( 'create_users', 'promote_users', 'add_users', 'edit_users', 'delete_users', 'remove_users', 'manage_network_users' ) as $cap ) {
			$allcaps[ $cap ] = false;
		}
		if ( 'restricted_admin' !== $grant['role'] ) {
			return $allcaps;
		}
		foreach ( self::restricted_caps() as $cap ) {
			if ( $grant['allow_plugins'] && in_array( $cap, array( 'install_plugins', 'delete_plugins' ), true ) ) {
				continue;
			}
			$allcaps[ $cap ] = false;
		}
		return $allcaps;
	}

	/**
	 * Support users cannot deactivate or delete Fixpass (that would stop the activity log),
	 * edit other users, or change support access.
	 *
	 * @param string[] $caps    Primitive caps.
	 * @param string   $cap     Meta cap.
	 * @param int      $user_id User.
	 * @param array    $args    Args.
	 * @return string[]
	 */
	public static function protect( $caps, $cap, $user_id, $args ) {
		if ( ! self::is_support_user( $user_id ) ) {
			return 'fixpass_manage' === $cap ? array( 'manage_options' ) : $caps;
		}
		$own = plugin_basename( FIXPASS_FILE );
		if ( in_array( $cap, array( 'deactivate_plugin', 'delete_plugin' ), true ) && isset( $args[0] ) && $own === $args[0] ) {
			return array( 'do_not_allow' );
		}
		if ( in_array( $cap, array( 'delete_plugins', 'deactivate_plugins' ), true ) && isset( $_REQUEST['checked'] ) && in_array( $own, (array) wp_unslash( $_REQUEST['checked'] ), true ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			return array( 'do_not_allow' );
		}
		if ( in_array( $cap, array( 'edit_user', 'delete_user', 'promote_user', 'remove_user' ), true ) ) {
			return array( 'do_not_allow' );
		}
		if ( 'fixpass_manage' === $cap ) {
			return array( 'do_not_allow' );
		}
		return $caps;
	}
}
