<?php
/**
 * Plugin bootstrap.
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

/**
 * Wires the plugin together.
 */
final class Fixpass_Plugin {

	const PRUNE = 'fixpass_prune';

	/**
	 * Cron hook: deactivate and delete Fixpass after access ended, when the owner asked.
	 */
	const SELF_REMOVE = 'fixpass_self_remove';

	/**
	 * Transient set on activation, so the next admin page opens Fixpass.
	 */
	const REDIRECT = 'fixpass_activation_redirect';

	/**
	 * Singleton.
	 *
	 * @var Fixpass_Plugin|null
	 */
	private static $instance = null;

	/**
	 * Get the instance.
	 *
	 * @return Fixpass_Plugin
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		add_filter( 'cron_schedules', array( __CLASS__, 'schedules' ) ); // phpcs:ignore WordPress.WP.CronInterval.CronSchedulesInterval -- access must end within minutes of its end time.
		add_action( 'init', array( 'Fixpass_DB', 'maybe_install' ), 1 );
		add_action( 'init', array( __CLASS__, 'ensure_cron' ) );

		Fixpass_Monitor::init();
		Fixpass_Access::init();
		Fixpass_Activity::init();
		Fixpass_Safe_Mode::init();
		Fixpass_Spotlight::init();
		Fixpass_Admin::init();

		add_action( 'rest_api_init', array( 'Fixpass_REST', 'register' ) );
		add_action( self::PRUNE, array( 'Fixpass_Monitor', 'prune' ) );
		add_action( self::SELF_REMOVE, array( __CLASS__, 'self_remove' ) );
		add_action( 'admin_init', array( __CLASS__, 'activation_redirect' ) );
	}

	/**
	 * Right after activation, open Fixpass's page (the welcome tour, the first time).
	 * Not for bulk activation, AJAX or WP-CLI.
	 */
	public static function activation_redirect() {
		if ( ! get_transient( self::REDIRECT ) ) {
			return;
		}
		delete_transient( self::REDIRECT );
		if ( isset( $_GET['activate-multi'] ) || wp_doing_ajax() || ( defined( 'WP_CLI' ) && WP_CLI ) || ! current_user_can( Fixpass_Access::CAP ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- only checks whether this was a bulk activation.
			return;
		}
		wp_safe_redirect( admin_url( 'admin.php?page=' . Fixpass_Admin::SLUG ) );
		exit;
	}

	/**
	 * After access ended, when the owner ticked "Remove Fixpass when access ends":
	 * deactivate, then delete the plugin (which runs uninstall.php). Hosts that need FTP details
	 * to change files can't delete it here, so there it stays installed but deactivated.
	 */
	public static function self_remove() {
		if ( Fixpass_Access::active() ) {
			return; // New access was created in the meantime.
		}
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		$file = plugin_basename( FIXPASS_FILE );
		self::deactivate();
		deactivate_plugins( $file, true );
		// Never delete a source checkout (a developer's copy): only real installs are deleted.
		if ( file_exists( FIXPASS_DIR . '.git' ) || file_exists( FIXPASS_DIR . 'package.json' ) ) {
			return;
		}
		delete_plugins( array( $file ) );
	}

	/**
	 * A 5-minute schedule, to end access on time.
	 *
	 * @param array $schedules Schedules.
	 * @return array
	 */
	public static function schedules( $schedules ) {
		$schedules['fixpass_5min'] = array(
			'interval' => 5 * MINUTE_IN_SECONDS,
			'display'  => __( 'Every 5 minutes (Fixpass)', 'fixpass' ),
		);
		return $schedules;
	}

	/**
	 * Re-create scheduled jobs that went missing (for example after a migration).
	 */
	public static function ensure_cron() {
		if ( ! wp_next_scheduled( self::PRUNE ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::PRUNE );
		}
		if ( ! wp_next_scheduled( Fixpass_Access::CRON ) ) {
			wp_schedule_event( time() + 5 * MINUTE_IN_SECONDS, 'fixpass_5min', Fixpass_Access::CRON );
		}
	}

	/**
	 * Activation.
	 */
	public static function activate() {
		set_transient( self::REDIRECT, 1, 30 );
		Fixpass_DB::install();
		add_filter( 'cron_schedules', array( __CLASS__, 'schedules' ) ); // phpcs:ignore WordPress.WP.CronInterval.CronSchedulesInterval
		self::ensure_cron();
	}

	/**
	 * Deactivation: end all support access (its accounts depend on this plugin to expire), stop
	 * scheduled jobs and remove troubleshooting mode. Logs are kept.
	 */
	public static function deactivate() {
		foreach ( Fixpass_Access::all( true, 500 ) as $grant ) {
			Fixpass_Access::revoke( (int) $grant['id'], 'deactivated' );
		}
		delete_option( Fixpass_Safe_Mode::OPTION );
		Fixpass_Safe_Mode::remove_mu();
		foreach ( array( self::PRUNE, Fixpass_Access::CRON, self::SELF_REMOVE ) as $hook ) {
			wp_clear_scheduled_hook( $hook );
		}
	}
}
