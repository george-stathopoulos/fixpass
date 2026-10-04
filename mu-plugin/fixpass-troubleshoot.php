<?php
/**
 * Plugin Name: Fixpass troubleshooting mode
 * Description: Disables chosen plugins for one browser session only, so support can test for conflicts without affecting visitors. Added by Fixpass and removed automatically when troubleshooting ends.
 * Version:     1.0.0
 * License:     GPL-2.0-or-later
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

if ( empty( $_COOKIE['fixpass_troubleshoot'] ) ) {
	return;
}

$fixpass_sessions = get_option( 'fixpass_troubleshoot', array() );
$fixpass_key      = hash( 'sha256', (string) wp_unslash( $_COOKIE['fixpass_troubleshoot'] ) ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- hashed, never output.

if ( ! is_array( $fixpass_sessions ) || empty( $fixpass_sessions[ $fixpass_key ] ) || (int) $fixpass_sessions[ $fixpass_key ]['expires'] < time() ) {
	unset( $fixpass_sessions, $fixpass_key );
	return;
}

define( 'FIXPASS_TROUBLESHOOTING', true );

$fixpass_session = $fixpass_sessions[ $fixpass_key ];
$fixpass_keep    = array_merge( (array) $fixpass_session['keep'], array( 'fixpass/fixpass.php' ) );

add_filter(
	'option_active_plugins',
	static function ( $plugins ) use ( $fixpass_keep ) {
		return array_values( array_intersect( (array) $plugins, $fixpass_keep ) );
	},
	1
);
add_filter(
	'site_option_active_sitewide_plugins',
	static function ( $plugins ) use ( $fixpass_keep ) {
		return array_intersect_key( (array) $plugins, array_flip( $fixpass_keep ) );
	},
	1
);

if ( ! empty( $fixpass_session['theme'] ) ) {
	$fixpass_theme = (string) $fixpass_session['theme'];
	add_filter(
		'pre_option_template',
		static function () use ( $fixpass_theme ) {
			return $fixpass_theme;
		}
	);
	add_filter(
		'pre_option_stylesheet',
		static function () use ( $fixpass_theme ) {
			return $fixpass_theme;
		}
	);
}
unset( $fixpass_sessions, $fixpass_key, $fixpass_session, $fixpass_keep );
