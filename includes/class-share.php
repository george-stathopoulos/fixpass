<?php
/**
 * The access details: what the site owner copies into their support ticket.
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

/**
 * Builds the access details the site owner pastes into a reply on their support ticket: the
 * one-time login link, the spots they picked with Spotlight, site health, recent fatal errors,
 * and the plugins and themes installed. It comes as HTML (pastes formatted
 * into an email) and plain text (pastes anywhere).
 *
 * Login links are never stored. A reusable link is rebuilt the same each time; a one-time link is
 * replaced by each copy after a page reload, and the previous one stops working. Only which spots were sent is kept, so support sees them after logging in.
 */
final class Fixpass_Share {

	const LAST = 'fixpass_last_shared';

	/**
	 * Step 1: create access, remembering the spots picked.
	 *
	 * @param int      $hours   Access length.
	 * @param string[] $ids      Spot IDs.
	 * @param bool     $cleanup  Remove Fixpass when access ends.
	 * @param bool     $reusable The link works until access ends (otherwise once).
	 * @return array|WP_Error Message, as for copy().
	 */
	public static function create( $hours, array $ids, $cleanup, $reusable = true ) {
		$ids     = array_slice( array_filter( array_map( 'sanitize_key', $ids ) ), 0, 5 );
		$created = Fixpass_Access::create(
			array(
				'hours'   => (int) $hours,
				'note'    => __( 'Support link', 'fixpass' ),
				'cleanup'  => (bool) $cleanup,
				'reusable' => (bool) $reusable,
			)
		);
		if ( is_wp_error( $created ) ) {
			return $created;
		}
		// New access: a removal still waiting from the last one no longer applies.
		wp_clear_scheduled_hook( Fixpass_Plugin::SELF_REMOVE );
		if ( is_wp_error( $created['url'] ) || '' === $created['url'] ) {
			return new WP_Error( 'fixpass_link', __( 'The login link couldn’t be created. Try again.', 'fixpass' ) );
		}
		$spots = array_values( array_filter( array_map( array( 'Fixpass_Spotlight', 'spot_data' ), $ids ) ) );
		foreach ( wp_list_pluck( $spots, 'id' ) as $pid ) {
			Fixpass_Spotlight::mark_sent( $pid, 1 );
		}
		update_option(
			self::LAST,
			array(
				'pins'       => wp_list_pluck( $spots, 'id' ),
				'created_at' => gmdate( 'c' ),
			),
			false
		);
		return self::build( $created['grant'], $created['url'], $spots );
	}

	/**
	 * Step 2 after a reload (the link from step 1 is gone): a fresh link for the active access.
	 *
	 * @return array|WP_Error { subject, html, text }
	 */
	public static function fresh() {
		$grant = Fixpass_Access::active();
		if ( ! $grant ) {
			return new WP_Error( 'fixpass_inactive', __( 'Support access is not active.', 'fixpass' ) );
		}
		$url = Fixpass_Access::new_link( (int) $grant['id'] );
		if ( is_wp_error( $url ) ) {
			return $url;
		}
		$spots = array();
		foreach ( (array) ( get_option( self::LAST, array() )['pins'] ?? array() ) as $pid ) {
			$pin = Fixpass_Spotlight::spot_data( $pid );
			if ( $pin ) {
				$spots[] = $pin;
			}
		}
		return self::build( $grant, $url, $spots );
	}

	/**
	 * Record that the owner copied the details (the step 1 button turns green).
	 */
	public static function mark_copied() {
		global $wpdb;
		$grant = Fixpass_Access::active();
		if ( $grant ) {
			$wpdb->update( Fixpass_DB::table( 'grants' ), array( 'copied_at' => Fixpass_DB::now() ), array( 'id' => (int) $grant['id'] ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
			Fixpass_Monitor::record( 'activity', 'shared_copied', '', array(), (int) $grant['id'] );
		}
	}

	/**
	 * The spots sent with the latest link, for support.
	 *
	 * @return array { time, spots[] }
	 */
	public static function last() {
		$last  = get_option( self::LAST, array() );
		$spots = array();
		foreach ( (array) ( $last['pins'] ?? array() ) as $pid ) {
			$pin = Fixpass_Spotlight::spot_data( $pid );
			if ( $pin ) {
				$spots[] = array(
					'id'        => $pin['id'],
					'title'     => $pin['title'],
					'label'     => $pin['label'],
					'kind'      => $pin['kind'],
					'url'       => $pin['url'],
					'browser'   => $pin['browser'],
					'viewport'  => $pin['viewport'],
					'errors'    => $pin['errors'],
					'requests'  => $pin['requests'],
					'highlight' => add_query_arg( 'fxp_spot', $pin['id'], $pin['url'] ),
				);
			}
		}
		return array(
			'time'  => $last['created_at'] ?? null,
			'spots' => $spots,
		);
	}

	/**
	 * The message, as HTML and plain text.
	 *
	 * @param array   $grant Grant.
	 * @param string  $url   Login link.
	 * @param array[] $spots Spots.
	 * @return array { subject, html, text }
	 */
	private static function build( array $grant, $url, array $spots ) {
		$site     = wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES );
		$format   = get_option( 'date_format' ) . ' ' . get_option( 'time_format' );
		$sections = array(
			array(
				__( 'Access', 'fixpass' ),
				array(
					( empty( $grant['reusable'] ) ? __( 'Secure login link (works once, no password needed)', 'fixpass' ) : __( 'Secure login link (works until access ends, no password needed)', 'fixpass' ) ) => $url,
					__( 'Granted', 'fixpass' )      => wp_date( $format, strtotime( $grant['created_at'] . ' UTC' ) ),
					__( 'Expires', 'fixpass' )      => wp_date( $format, strtotime( $grant['expires_at'] . ' UTC' ) ),
					__( 'Access level', 'fixpass' ) => __( 'Full administrator', 'fixpass' ),
				),
			),
		);
		foreach ( $spots as $n => $pin ) {
			$rows = array(
				__( 'Open highlighted', 'fixpass' ) => add_query_arg( 'fxp_spot', $pin['id'], $pin['url'] ),
				__( 'Page', 'fixpass' )             => $pin['title'] . ' (' . $pin['url'] . ')',
				__( 'Screen', 'fixpass' )           => (int) $pin['viewport']['w'] . '×' . (int) $pin['viewport']['h'] . ' · ' . $pin['browser'],
			);
			foreach ( $pin['errors'] as $i => $e ) {
				$rows[ __( 'Error', 'fixpass' ) . ' ' . ( $i + 1 ) ] = $e['message'] . ( '' !== $e['source'] ? ' (' . $e['source'] . ':' . $e['line'] . ')' : '' );
			}
			foreach ( $pin['requests'] as $i => $r ) {
				$rows[ __( 'Failed request', 'fixpass' ) . ' ' . ( $i + 1 ) ] = $r['method'] . ' ' . $r['url'] . ' → ' . ( $r['status'] ? $r['status'] : 'no response' );
			}
			/* translators: %d: spot number */
			$sections[] = array( sprintf( __( 'Spot %d', 'fixpass' ), $n + 1 ) . ( '' !== $pin['label'] ? ': ' . $pin['label'] : '' ), $rows );
		}
		$sections[] = array( __( 'Site health', 'fixpass' ), self::health() );
		$fatal      = self::fatal_errors();
		if ( $fatal ) {
			$sections[] = array( __( 'Recent fatal errors', 'fixpass' ), $fatal );
		}
		$env        = self::plugins_and_themes();
		$sections[] = array( __( 'Active plugins', 'fixpass' ), $env['active_plugins'] );
		$sections[] = array( __( 'Inactive plugins', 'fixpass' ), $env['inactive_plugins'] );
		$sections[] = array( __( 'Active theme', 'fixpass' ), $env['active_theme'] );
		$sections[] = array( __( 'Other installed themes', 'fixpass' ), $env['other_themes'] );

		/* translators: %s: site name */
		$intro = sprintf( __( 'Support access details for %s. Please share this with your support team.', 'fixpass' ), $site );
		$after = __( 'After logging in, the Support session page has more site details, the debug log and troubleshooting mode.', 'fixpass' );
		return array(
			/* translators: %s: site name */
			'subject' => sprintf( __( 'Support access for %s', 'fixpass' ), $site ),
			'html'    => self::html( $intro, $url, $sections, $after ),
			'text'    => self::text( $intro, $sections, $after ),
		);
	}

	/**
	 * HTML, styled inline so it survives being pasted into an email.
	 *
	 * @param string $intro    First line.
	 * @param string $url      Login link.
	 * @param array  $sections [ title, rows (label => value) or list ].
	 * @param string $after    Last line.
	 * @return string
	 */
	private static function html( $intro, $url, array $sections, $after ) {
		$h2  = 'style="font:600 15px/1.3 Arial,sans-serif;margin:20px 0 6px;color:#1a1a1a"';
		$p   = 'style="font:14px/1.5 Arial,sans-serif;margin:0 0 8px;color:#1a1a1a"';
		$td  = 'style="font:13px/1.5 Arial,sans-serif;padding:2px 12px 2px 0;vertical-align:top;color:#1a1a1a;word-break:break-word"';
		$th  = 'style="font:13px/1.5 Arial,sans-serif;padding:2px 12px 2px 0;vertical-align:top;color:#666;text-align:left;white-space:nowrap"';
		$out = '<div><p ' . $p . '>' . esc_html( $intro ) . '</p>';
		$out .= '<p ' . $p . '><a href="' . esc_url( $url ) . '" style="display:inline-block;padding:9px 18px;background:#4a3aa7;color:#fff;border-radius:6px;text-decoration:none;font:600 14px Arial,sans-serif">' . esc_html__( 'Log in to the site', 'fixpass' ) . '</a></p>';
		foreach ( $sections as $section ) {
			$out .= '<h2 ' . $h2 . '>' . esc_html( $section[0] ) . '</h2>';
			$rows = $section[1];
			if ( ! $rows ) {
				$out .= '<p ' . $p . '>' . esc_html__( 'none', 'fixpass' ) . '</p>';
			} elseif ( array_keys( $rows ) === range( 0, count( $rows ) - 1 ) ) {
				$out .= '<ul style="margin:0;padding-left:18px">';
				foreach ( $rows as $item ) {
					$out .= '<li style="font:13px/1.5 Arial,sans-serif;color:#1a1a1a">' . esc_html( $item ) . '</li>';
				}
				$out .= '</ul>';
			} else {
				$out .= '<table role="presentation" style="border-collapse:collapse">';
				foreach ( $rows as $label => $value ) {
					$value = '' === (string) $value ? __( 'not available', 'fixpass' ) : (string) $value;
					$cell  = 0 === strpos( $value, 'http' ) ? '<a href="' . esc_url( $value ) . '">' . esc_html( $value ) . '</a>' : esc_html( $value );
					$out  .= '<tr><th ' . $th . '>' . esc_html( $label ) . '</th><td ' . $td . '>' . $cell . '</td></tr>';
				}
				$out .= '</table>';
			}
		}
		$out .= '<p style="font:12px/1.5 Arial,sans-serif;color:#888;margin-top:20px">' . esc_html( $after ) . '</p>';
		return $out . '</div>';
	}

	/**
	 * Plain text.
	 *
	 * @param string $intro    First line.
	 * @param array  $sections Sections.
	 * @param string $after    Last line.
	 * @return string
	 */
	private static function text( $intro, array $sections, $after ) {
		$l = array( $intro );
		foreach ( $sections as $section ) {
			$l[]  = '';
			$l[]  = '== ' . $section[0] . ' ==';
			$rows = $section[1];
			if ( ! $rows ) {
				$l[] = '- ' . __( 'none', 'fixpass' );
			} elseif ( array_keys( $rows ) === range( 0, count( $rows ) - 1 ) ) {
				foreach ( $rows as $item ) {
					$l[] = '- ' . $item;
				}
			} else {
				foreach ( $rows as $label => $value ) {
					$l[] = $label . ': ' . ( '' === (string) $value ? __( 'not available', 'fixpass' ) : $value );
				}
			}
		}
		$l[] = '';
		$l[] = $after;
		return implode( "\n", $l );
	}

	/**
	 * Basic site health.
	 *
	 * @return array Label => value.
	 */
	private static function health() {
		global $wp_version;
		// Some hosts disable disk_free_space() entirely; calling it then is a fatal error.
		$free = function_exists( 'disk_free_space' ) ? @disk_free_space( ABSPATH ) : false; // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- open_basedir can still make it warn.
		return array(
			__( 'WordPress version', 'fixpass' ) => (string) $wp_version,
			__( 'PHP version', 'fixpass' )       => PHP_VERSION,
			__( 'PHP memory limit', 'fixpass' )  => (string) ini_get( 'memory_limit' ),
			__( 'Free disk space', 'fixpass' )   => $free ? size_format( (float) $free ) : '',
		);
	}

	/**
	 * The last few fatal errors in debug.log, newest first (secrets removed).
	 *
	 * @return string[]
	 */
	private static function fatal_errors() {
		$lines = Fixpass_Debug::log_tail( 2000 )['lines'];
		$fatal = array_filter(
			$lines,
			static function ( $line ) {
				return false !== stripos( $line, 'fatal error' ) || false !== stripos( $line, 'uncaught' );
			}
		);
		return array_slice( array_reverse( array_values( $fatal ) ), 0, 5 );
	}

	/**
	 * Installed plugins and themes, with versions.
	 *
	 * @return array
	 */
	private static function plugins_and_themes() {
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		$out = array(
			'active_plugins'   => array(),
			'inactive_plugins' => array(),
			'active_theme'     => array(),
			'other_themes'     => array(),
		);
		foreach ( get_plugins() as $file => $p ) {
			$out[ is_plugin_active( $file ) ? 'active_plugins' : 'inactive_plugins' ][] = trim( $p['Name'] . ' ' . $p['Version'] );
		}
		$current = get_stylesheet();
		foreach ( wp_get_themes() as $slug => $theme ) {
			$out[ $slug === $current ? 'active_theme' : 'other_themes' ][] = trim( $theme->get( 'Name' ) . ' ' . $theme->get( 'Version' ) );
		}
		return $out;
	}
}
