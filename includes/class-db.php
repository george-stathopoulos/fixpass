<?php
/**
 * Database tables.
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

/**
 * Two tables: support access grants, and the log (what support did, errors, changes).
 */
final class Fixpass_DB {

	const VERSION = '4';
	const OPTION  = 'fixpass_db';

	/**
	 * Full table name.
	 *
	 * @param string $name grants | log.
	 * @return string
	 */
	public static function table( $name ) {
		global $wpdb;
		return $wpdb->prefix . 'fixpass_' . $name;
	}

	/**
	 * Create or update the tables when the version changes.
	 */
	public static function maybe_install() {
		if ( get_option( self::OPTION ) !== self::VERSION ) {
			self::install();
		}
	}

	/**
	 * Create the tables.
	 */
	public static function install() {
		global $wpdb;
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';
		$charset = $wpdb->get_charset_collate();
		dbDelta(
			'CREATE TABLE ' . self::table( 'grants' ) . " (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			user_id bigint(20) unsigned NOT NULL DEFAULT 0,
			ticket_id bigint(20) unsigned NOT NULL DEFAULT 0,
			role varchar(40) NOT NULL DEFAULT '',
			allow_plugins tinyint(1) NOT NULL DEFAULT 0,
			token_hash varchar(64) NOT NULL DEFAULT '',
			token_created_at datetime NULL,
			token_used_at datetime NULL,
			token_user_id bigint(20) unsigned NOT NULL DEFAULT 0,
			expires_at datetime NOT NULL,
			created_by bigint(20) unsigned NOT NULL DEFAULT 0,
			created_at datetime NOT NULL,
			revoked_at datetime NULL,
			extension_request longtext NULL,
			note varchar(255) NOT NULL DEFAULT '',
			status varchar(20) NOT NULL DEFAULT '',
			cleanup tinyint(1) NOT NULL DEFAULT 0,
			copied_at datetime NULL,
			reusable tinyint(1) NOT NULL DEFAULT 0,
			link_nonce varchar(64) NOT NULL DEFAULT '',
			PRIMARY KEY  (id),
			KEY user_id (user_id),
			KEY token_hash (token_hash)
			) $charset;"
		);
		dbDelta(
			'CREATE TABLE ' . self::table( 'log' ) . " (
			id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
			type varchar(20) NOT NULL DEFAULT 'activity',
			grant_id bigint(20) unsigned NOT NULL DEFAULT 0,
			actor_id bigint(20) unsigned NOT NULL DEFAULT 0,
			action varchar(64) NOT NULL DEFAULT '',
			object varchar(255) NOT NULL DEFAULT '',
			details longtext NULL,
			ip varchar(45) NOT NULL DEFAULT '',
			created_at datetime NOT NULL,
			PRIMARY KEY  (id),
			KEY type_created (type,created_at),
			KEY grant_id (grant_id)
			) $charset;"
		);
		update_option( self::OPTION, self::VERSION, false );
	}

	/**
	 * Current UTC time in MySQL format.
	 *
	 * @param int $offset Seconds to add.
	 * @return string
	 */
	public static function now( $offset = 0 ) {
		return gmdate( 'Y-m-d H:i:s', time() + $offset );
	}
}
