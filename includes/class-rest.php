<?php
/**
 * REST API for the plugin's two screens.
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

/**
 * Two audiences, kept apart:
 * - The site owner (administrators): create a support link, end access, turn Spotlight on or off.
 * - Support, while logged in with a link: the session, site details, debugging tools and
 *   troubleshooting mode. Administrators of the site don't get these.
 */
final class Fixpass_REST {

	const NS = 'fixpass/v1';

	/**
	 * Register routes.
	 */
	public static function register() {
		$owner   = static function () {
			return current_user_can( Fixpass_Access::CAP ) && ! Fixpass_Access::current_grant_id();
		};
		$support = static function () {
			return Fixpass_Access::current_grant_id() > 0;
		};
		$routes  = array(
			array( '/admin/state', 'GET', 'state', $owner ),
			array( '/admin/link', 'POST', 'link', $owner ),
			array( '/admin/end', 'POST', 'end', $owner ),
			array( '/admin/copy', 'POST', 'copy', $owner ),
			array( '/admin/extend', 'POST', 'extend', $owner ),
			array( '/admin/spotlight', 'POST', 'spotlight', $owner ),
			array( '/admin/onboarding', 'POST', 'onboarding', $owner ),
			array( '/admin/session', 'GET', 'session', $support ),
			array( '/admin/session/leave', 'POST', 'leave_session', $support ),
			array( '/admin/session/end', 'POST', 'end_session', $support ),
			array( '/admin/health', 'GET', 'health', $support ),
			array( '/admin/debug', 'GET', 'debug', $support ),
			array( '/admin/troubleshoot', 'GET', 'troubleshoot', $support ),
			array( '/admin/troubleshoot', 'POST', 'troubleshoot_set', $support ),
		);
		foreach ( $routes as $r ) {
			register_rest_route(
				self::NS,
				$r[0],
				array(
					'methods'             => $r[1],
					'callback'            => array( __CLASS__, $r[2] ),
					'permission_callback' => $r[3],
				)
			);
		}
	}

	/**
	 * What the site owner's screen shows.
	 *
	 * @return array
	 */
	public static function state() {
		$durations = array();
		foreach ( Fixpass_Policy::durations() as $hours => $label ) {
			$durations[] = array(
				'hours' => $hours,
				'label' => $label,
			);
		}
		// The latest access, active or not: its status is what the owner sees.
		$latest = Fixpass_Access::all( false, 1 );
		$g      = $latest ? $latest[0] : null;
		return array(
			'spotlight'     => Fixpass_Settings::spotlight_enabled(),
			// The welcome tour stays hidden once dismissed, until Fixpass is reinstalled.
			'onboarded'     => (bool) get_option( 'fixpass_onboarded' ),
			'durations'     => $durations,
			'default_hours' => Fixpass_Policy::DEFAULT_HOURS,
			'now'           => gmdate( 'c' ),
			'access'        => $g ? array(
				'active'     => Fixpass_Access::is_active( $g ),
				'status'     => Fixpass_Access::status( $g ),
				'granted_at' => self::iso( $g['created_at'] ),
				'expires_at' => self::iso( $g['expires_at'] ),
				'ended_at'   => self::iso( $g['revoked_at'] ),
				'copied'     => ! empty( $g['copied_at'] ),
				'cleanup'    => ! empty( $g['cleanup'] ),
				'reusable'   => ! empty( $g['reusable'] ),
				// Extending stops 30 days after access was created.
				'can_extend' => strtotime( $g['expires_at'] . ' UTC' ) < strtotime( $g['created_at'] . ' UTC' ) + Fixpass_Policy::MAX_TOTAL_DAYS * DAY_IN_SECONDS,
			) : null,
			'removing'      => ! ( $g && Fixpass_Access::is_active( $g ) ) && wp_next_scheduled( Fixpass_Plugin::SELF_REMOVE ),
		);
	}

	/**
	 * Create a support link (new access, or renew the current one with a fresh link).
	 *
	 * @param WP_REST_Request $request hours, pins (comma-separated).
	 * @return array|WP_Error
	 */
	public static function link( WP_REST_Request $request ) {
		$out = Fixpass_Share::create( absint( $request->get_param( 'hours' ) ), explode( ',', (string) $request->get_param( 'pins' ) ), rest_sanitize_boolean( $request->get_param( 'cleanup' ) ), null === $request->get_param( 'reusable' ) || rest_sanitize_boolean( $request->get_param( 'reusable' ) ) );
		return is_wp_error( $out ) ? self::bad( $out ) : $out;
	}

	/**
	 * Step 2: the details were copied. With fresh=1 (after a reload, when the page no longer has
	 * the link), a new link is made and the message returned.
	 *
	 * @param WP_REST_Request $request fresh.
	 * @return array|WP_Error
	 */
	public static function copy( WP_REST_Request $request ) {
		$out = array();
		if ( rest_sanitize_boolean( $request->get_param( 'fresh' ) ) ) {
			$out = Fixpass_Share::fresh();
			if ( is_wp_error( $out ) ) {
				return self::bad( $out );
			}
		}
		Fixpass_Share::mark_copied();
		return $out;
	}

	/**
	 * Extend the access by 24 hours (up to 30 days from when it was created).
	 *
	 * @return array|WP_Error
	 */
	public static function extend() {
		$g = Fixpass_Access::active();
		if ( ! $g || ! Fixpass_Access::extend( (int) $g['id'], 24 ) ) {
			return self::bad( new WP_Error( 'fixpass_extend', __( 'This access can’t be extended: it has ended, or it already reaches 30 days from when it was created.', 'fixpass' ) ) );
		}
		return self::state();
	}

	/**
	 * The site owner ends access now.
	 *
	 * @return array
	 */
	public static function end() {
		$g = Fixpass_Access::active();
		if ( $g ) {
			Fixpass_Access::revoke( (int) $g['id'] );
		}
		return self::state();
	}

	/**
	 * Don't show the welcome tour again (or show it again, with done=false).
	 *
	 * @param WP_REST_Request $request done.
	 * @return array
	 */
	public static function onboarding( WP_REST_Request $request ) {
		update_option( 'fixpass_onboarded', rest_sanitize_boolean( $request->get_param( 'done' ) ), false );
		return self::state();
	}

	/**
	 * Turn Spotlight (the toolbar button) on or off.
	 *
	 * @param WP_REST_Request $request enabled.
	 * @return array
	 */
	public static function spotlight( WP_REST_Request $request ) {
		Fixpass_Settings::set_spotlight( rest_sanitize_boolean( $request->get_param( 'enabled' ) ) );
		return self::state();
	}

	/**
	 * The support session: until when, and what the site owner flagged.
	 *
	 * @return array
	 */
	public static function session() {
		$grant = Fixpass_Access::current_grant();
		return array(
			'site'    => wp_specialchars_decode( get_bloginfo( 'name' ), ENT_QUOTES ),
			'user'    => wp_get_current_user()->display_name,
			'expires' => self::iso( $grant['expires_at'] ),
			'shared'  => Fixpass_Share::last(),
		);
	}

	/**
	 * Support ends the session: logged out, access stays open until it expires or is ended.
	 *
	 * @return array
	 */
	public static function leave_session() {
		$grant_id = Fixpass_Access::current_grant_id();
		wp_logout();
		Fixpass_Access::set_status( $grant_id, 'left' );
		return array( 'redirect' => home_url( '/' ) );
	}

	/**
	 * Support ends their own access: the grant is revoked and the support account deleted.
	 *
	 * @return array
	 */
	public static function end_session() {
		Fixpass_Access::revoke( Fixpass_Access::current_grant_id(), 'support_ended', wp_get_current_user()->display_name );
		return array(
			'ended'    => true,
			'redirect' => home_url( '/' ),
		);
	}

	/**
	 * Site details and the problems they point at.
	 *
	 * @return array
	 */
	public static function health() {
		$data  = Fixpass_Diagnostics::collect();
		$flags = Fixpass_Health_Flags::evaluate( $data );
		return array(
			'data'  => $data,
			'flags' => $flags,
			'text'  => Fixpass_Diagnostics::to_text( $data, $flags ),
		);
	}

	/**
	 * Debugging tools.
	 *
	 * @param WP_REST_Request $request lines, search.
	 * @return array
	 */
	public static function debug( WP_REST_Request $request ) {
		return Fixpass_Debug::state( absint( $request->get_param( 'lines' ) ) ?: 200, sanitize_text_field( (string) $request->get_param( 'search' ) ) ); // phpcs:ignore Universal.Operators.DisallowShortTernary.Found
	}

	/**
	 * Troubleshooting mode state.
	 *
	 * @return array
	 */
	public static function troubleshoot() {
		return Fixpass_Safe_Mode::state();
	}

	/**
	 * Start or stop troubleshooting mode.
	 *
	 * @param WP_REST_Request $request op, keep, theme.
	 * @return array|WP_Error
	 */
	public static function troubleshoot_set( WP_REST_Request $request ) {
		if ( 'stop' === $request->get_param( 'op' ) ) {
			return Fixpass_Safe_Mode::stop();
		}
		return Fixpass_Safe_Mode::start( array_map( 'sanitize_text_field', (array) $request->get_param( 'keep' ) ), (bool) $request->get_param( 'theme' ) );
	}

	/**
	 * ISO 8601 from a UTC MySQL date.
	 *
	 * @param string|null $mysql Date.
	 * @return string|null
	 */
	private static function iso( $mysql ) {
		return $mysql ? gmdate( 'c', strtotime( $mysql . ' UTC' ) ) : null;
	}

	/**
	 * Error with an HTTP 400 status.
	 *
	 * @param WP_Error $error Error.
	 * @return WP_Error
	 */
	private static function bad( WP_Error $error ) {
		$error->add_data( array( 'status' => 400 ) );
		return $error;
	}
}
