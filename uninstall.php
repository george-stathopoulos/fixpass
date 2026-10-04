<?php
/**
 * Uninstall: delete support accounts, tables and options.
 *
 * @package Fixpass
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

global $wpdb;

// Any remaining support accounts (deactivation normally removed them already).
$fixpass_users = get_users(
	array(
		'meta_key' => 'fixpass_grant', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
		'fields'   => 'ID',
	)
);
if ( $fixpass_users ) {
	require_once ABSPATH . 'wp-admin/includes/user.php';
	foreach ( $fixpass_users as $fixpass_user ) {
		wp_delete_user( (int) $fixpass_user );
	}
}

foreach ( array( 'grants', 'log' ) as $fixpass_table ) {
	$wpdb->query( $wpdb->prepare( 'DROP TABLE IF EXISTS %i', $wpdb->prefix . 'fixpass_' . $fixpass_table ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.DirectDatabaseQuery.SchemaChange, WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
}

foreach ( array( 'fixpass_settings', 'fixpass_db', 'fixpass_troubleshoot', 'fixpass_pins', 'fixpass_shared', 'fixpass_last_shared', 'fixpass_onboarded', 'fixpass_creating' ) as $fixpass_option ) {
	delete_option( $fixpass_option );
}

$fixpass_mu = WPMU_PLUGIN_DIR . '/fixpass-troubleshoot.php';
if ( file_exists( $fixpass_mu ) ) {
	wp_delete_file( $fixpass_mu );
}

foreach ( array( 'fixpass_prune', 'fixpass_expire_access', 'fixpass_self_remove' ) as $fixpass_hook ) {
	wp_clear_scheduled_hook( $fixpass_hook );
}
