<?php
/**
 * Admin screens.
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

/**
 * The Fixpass menu and app, the support session banner, and the admin bar item support
 * sees while logged in.
 */
final class Fixpass_Admin {

	const SLUG = 'fixpass';

	/**
	 * Page hook suffix.
	 *
	 * @var string
	 */
	private static $hook = '';

	/**
	 * Register hooks.
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
		add_action( 'admin_notices', array( __CLASS__, 'support_notice' ) );
		add_action( 'admin_bar_menu', array( __CLASS__, 'admin_bar' ), 80 );
		add_filter( 'plugin_action_links_' . plugin_basename( FIXPASS_FILE ), array( __CLASS__, 'action_links' ) );
		add_filter( 'manage_users_columns', array( __CLASS__, 'users_column' ) );
		add_filter( 'manage_users_custom_column', array( __CLASS__, 'users_column_value' ), 10, 3 );
	}

	/**
	 * Menu: the app for the site owner; the session page for support.
	 */
	public static function menu() {
		if ( Fixpass_Access::current_grant_id() ) {
			self::$hook = add_menu_page( __( 'Support session', 'fixpass' ), __( 'Support session', 'fixpass' ), 'read', self::SLUG, array( __CLASS__, 'render' ), 'dashicons-sos', 3 );
			return;
		}
		self::$hook = add_menu_page( __( 'Fixpass', 'fixpass' ), __( 'Fixpass', 'fixpass' ), Fixpass_Access::CAP, self::SLUG, array( __CLASS__, 'render' ), 'dashicons-sos', 80 );
	}

	/**
	 * Mount point for the app.
	 */
	public static function render() {
		echo '<div id="fxp-root" class="hdh-root"><div class="hdh-boot" role="status">' . esc_html__( 'Loading…', 'fixpass' ) . '</div></div>';
	}

	/**
	 * Users screen: a column that labels the support account, so other admins know what it is.
	 *
	 * @param array $columns Columns.
	 * @return array
	 */
	public static function users_column( $columns ) {
		$columns['fixpass'] = __( 'Fixpass', 'fixpass' );
		return $columns;
	}

	/**
	 * The column's value for a user.
	 *
	 * @param string $value   Value.
	 * @param string $column  Column.
	 * @param int    $user_id User.
	 * @return string
	 */
	public static function users_column_value( $value, $column, $user_id ) {
		if ( 'fixpass' !== $column ) {
			return $value;
		}
		$grant_id = (int) get_user_meta( (int) $user_id, Fixpass_Access::META, true );
		if ( ! $grant_id ) {
			return $value;
		}
		$grant = Fixpass_Access::get( $grant_id );
		if ( Fixpass_Access::is_active( $grant ) ) {
			return '<span style="color:#b32d2e;font-weight:600">' . esc_html(
				sprintf(
					/* translators: %s: date and time */
					__( 'Temporary support account: expires %s', 'fixpass' ),
					wp_date( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $grant['expires_at'] . ' UTC' ) )
				)
			) . '</span>';
		}
		return '<span style="color:#787c82">' . esc_html__( 'Temporary support account (access ended)', 'fixpass' ) . '</span>';
	}

	/**
	 * Enqueue the app on Fixpass's page.
	 *
	 * @param string $hook Hook suffix.
	 */
	public static function assets( $hook ) {
		if ( $hook !== self::$hook ) {
			return;
		}
		$asset_file = FIXPASS_DIR . 'build/index.asset.php';
		if ( ! file_exists( $asset_file ) ) {
			return;
		}
		$asset = require $asset_file;
		wp_enqueue_script( 'fixpass-admin', FIXPASS_URL . 'build/index.js', $asset['dependencies'], $asset['version'], true );
		wp_enqueue_style( 'fixpass-admin', FIXPASS_URL . 'build/style-index.css', array(), $asset['version'] );
		wp_style_add_data( 'fixpass-admin', 'rtl', 'replace' );
		wp_set_script_translations( 'fixpass-admin', 'fixpass' );
		$user = wp_get_current_user();
		wp_add_inline_script(
			'fixpass-admin',
			'window.hdhBoot = ' . wp_json_encode(
				array(
					'version'   => FIXPASS_VERSION,
					'siteName'  => wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
					'homeUrl'   => home_url( '/' ),
					'userName'  => $user->display_name,
					'isSupport' => Fixpass_Access::current_grant_id() > 0,
					'gmtOffset' => (float) get_option( 'gmt_offset' ),
					'pinpoint'  => Fixpass_Spotlight::available(),
				)
			) . ';',
			'before'
		);
	}

	/**
	 * Tell support, on every admin screen, that they're in a recorded session.
	 */
	public static function support_notice() {
		$grant = Fixpass_Access::current_grant();
		if ( ! $grant ) {
			return;
		}
		echo '<div class="notice notice-info"><p><strong>';
		echo esc_html(
			sprintf(
				/* translators: %s: site name */
				__( 'You are logged in to %s with Fixpass.', 'fixpass' ),
				wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES )
			)
		);
		echo '</strong> ';
		echo esc_html(
			Fixpass_Access::is_permanent( $grant )
				? __( 'This access has no end date.', 'fixpass' )
				: sprintf(
					/* translators: %s: time left */
					__( 'Access ends in %s.', 'fixpass' ),
					human_time_diff( time(), strtotime( $grant['expires_at'] . ' UTC' ) )
				)
		);
		echo ' <a href="' . esc_url( admin_url( 'admin.php?page=' . self::SLUG ) ) . '">' . esc_html__( 'Session details', 'fixpass' ) . '</a></p></div>';
	}

	/**
	 * Admin bar item for support.
	 *
	 * @param WP_Admin_Bar $bar Bar.
	 */
	public static function admin_bar( $bar ) {
		$grant = Fixpass_Access::current_grant();
		if ( ! $grant ) {
			return;
		}
		$bar->add_node(
			array(
				'id'    => 'fixpass-session',
				'title' => esc_html(
					Fixpass_Access::is_permanent( $grant )
						? __( 'Support session', 'fixpass' )
						: sprintf(
							/* translators: %s: time left */
							__( 'Support session · %s left', 'fixpass' ),
							human_time_diff( time(), strtotime( $grant['expires_at'] . ' UTC' ) )
						)
				),
				'href'  => admin_url( 'admin.php?page=' . self::SLUG ),
				'meta'  => array( 'title' => __( 'Your session, site details and debugging tools', 'fixpass' ) ),
			)
		);
	}

	/**
	 * Plugins screen link.
	 *
	 * @param string[] $links Links.
	 * @return string[]
	 */
	public static function action_links( $links ) {
		array_unshift( $links, '<a href="' . esc_url( admin_url( 'admin.php?page=' . self::SLUG ) ) . '">' . esc_html__( 'Open', 'fixpass' ) . '</a>' );
		return $links;
	}
}
