<?php
/**
 * The one setting: Spotlight on or off.
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

/**
 * Fixpass keeps choices to a minimum. The only thing the site owner can change is whether
 * Spotlight a problem is in the toolbar; it's on by default.
 */
final class Fixpass_Settings {

	const OPTION = 'fixpass_settings';

	/**
	 * How long the error and activity log is kept, in days.
	 */
	const RETENTION_DAYS = 90;

	/**
	 * A setting.
	 *
	 * @param string $key spotlight | retention_days.
	 * @return mixed
	 */
	public static function get( $key ) {
		if ( 'retention_days' === $key ) {
			return self::RETENTION_DAYS;
		}
		if ( 'spotlight' === $key ) {
			return array( 'enabled' => self::spotlight_enabled() );
		}
		return null;
	}

	/**
	 * Whether Spotlight a problem is in the toolbar.
	 *
	 * @return bool
	 */
	public static function spotlight_enabled() {
		$stored = get_option( self::OPTION, array() );
		return ! is_array( $stored ) || ! isset( $stored['pinpoint'] ) || ! empty( $stored['pinpoint'] );
	}

	/**
	 * Turn Spotlight a problem on or off.
	 *
	 * @param bool $on On.
	 */
	public static function set_spotlight( $on ) {
		update_option( self::OPTION, array( 'pinpoint' => (bool) $on ) );
	}

	/**
	 * Name used for the support account.
	 *
	 * @return string
	 */
	public static function support_name() {
		return __( 'Support', 'fixpass' );
	}

	/**
	 * Who hears about access: the site's admin email.
	 *
	 * @return string
	 */
	public static function notify_email() {
		return (string) get_option( 'admin_email' );
	}
}
