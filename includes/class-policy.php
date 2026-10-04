<?php
/**
 * The fixed rules for remote login.
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

/**
 * Remote login follows one set of rules, with nothing to configure: support gets full
 * administrator access (including plugin installs) for 1 to 7 days, 3 by default, and
 * troubleshooting mode is always available to them.
 */
final class Fixpass_Policy {

	/**
	 * "Hours" meaning no end date. Fixpass never offers it; the access code still knows it.
	 */
	const PERMANENT = 999999;

	const ROLE          = 'administrator';
	const DEFAULT_HOURS = 72;
	const MIN_HOURS     = 24;
	const MAX_HOURS     = 168;

	/**
	 * Extending (+24 hours at a time) stops at this many days from when access was created.
	 */
	const MAX_TOTAL_DAYS = 30;

	/**
	 * One section of the rules, in the shape the access code reads.
	 *
	 * @param string $section access | pinpoint.
	 * @return array
	 */
	public static function section( $section ) {
		if ( 'pinpoint' === $section ) {
			return array( 'mode' => 'customer' );
		}
		if ( 'access' !== $section ) {
			return array();
		}
		return array(
			'mode'              => 'ask',
			'roles'             => array( self::ROLE ),
			'default_role'      => self::ROLE,
			'customer_role'     => false,
			'default_hours'     => self::DEFAULT_HOURS,
			'max_hours'         => self::MAX_HOURS,
			'customer_duration' => true,
			'plugin_installs'   => true,
			'extension'         => 'approve',
			'customer_extend'   => false,
			'log_page_views'    => false,
			'troubleshooting'   => true,
			'end_on_close'      => false,
			'permanent'         => false,
		);
	}

	/**
	 * Lengths the owner can pick.
	 *
	 * @return array Hours => label.
	 */
	public static function durations() {
		return array(
			24  => __( '1 day', 'fixpass' ),
			48  => __( '2 days', 'fixpass' ),
			72  => __( '3 days', 'fixpass' ),
			120 => __( '5 days', 'fixpass' ),
			168 => __( '1 week', 'fixpass' ),
		);
	}

	/**
	 * Access settings for a new grant.
	 *
	 * @param array $asked hours.
	 * @return array hours, role, allow_plugins.
	 */
	public static function resolve_access( array $asked ) {
		$hours = ! empty( $asked['hours'] ) ? (int) $asked['hours'] : self::DEFAULT_HOURS;
		return array(
			'hours'         => max( self::MIN_HOURS, min( self::MAX_HOURS, $hours ) ),
			'role'          => self::ROLE,
			'allow_plugins' => true,
		);
	}
}
