<?php
/**
 * The few settings: Spotlight on or off, and how long the access history is kept.
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

/**
 * Fixpass keeps choices to a minimum. The site owner can change whether Spotlight a problem is in
 * the toolbar (on by default) and how long the access history is kept (90 days by default).
 */
final class Fixpass_Settings {

	const OPTION = 'fixpass_settings';

	/**
	 * How long the error and activity log is kept, in days.
	 */
	const RETENTION_DAYS = 90;

	/**
	 * The retention periods the site owner can choose from, in days.
	 */
	const RETENTION_CHOICES = array( 30, 90, 365 );

	/**
	 * A setting.
	 *
	 * @param string $key spotlight | retention_days.
	 * @return mixed
	 */
	public static function get( $key ) {
		if ( 'retention_days' === $key ) {
			$stored = get_option( self::OPTION, array() );
			$days   = is_array( $stored ) && isset( $stored['retention_days'] ) ? (int) $stored['retention_days'] : self::RETENTION_DAYS;
			return in_array( $days, self::RETENTION_CHOICES, true ) ? $days : self::RETENTION_DAYS;
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
		$stored             = get_option( self::OPTION, array() );
		$stored             = is_array( $stored ) ? $stored : array();
		$stored['pinpoint'] = (bool) $on;
		update_option( self::OPTION, $stored );
	}

	/**
	 * Choose how long the access history is kept.
	 *
	 * @param int $days One of RETENTION_CHOICES.
	 * @return bool Whether it was a valid choice.
	 */
	public static function set_retention( $days ) {
		$days = (int) $days;
		if ( ! in_array( $days, self::RETENTION_CHOICES, true ) ) {
			return false;
		}
		$stored                   = get_option( self::OPTION, array() );
		$stored                   = is_array( $stored ) ? $stored : array();
		$stored['retention_days'] = $days;
		update_option( self::OPTION, $stored );
		return true;
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
