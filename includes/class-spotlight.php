<?php
/**
 * Spotlight: mark the exact spot of a problem.
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

/**
 * "Report a problem" in the admin bar, on the front end and in wp-admin. The site owner clicks
 * the broken part of a page (or drags a box around it), up to 5 spots, with a note each. The
 * spots then go into the message for support (Fixpass_Share): each with its page, a link
 * that opens the page with the spot highlighted, the screen size and browser, and the JavaScript
 * errors and failed requests on that page.
 */
final class Fixpass_Spotlight {

	const OPTION = 'fixpass_pins';
	const KEEP   = 90; // Days a spot stays highlightable.

	/**
	 * The toolbar icon: a spotlight casting its beam (static markup, nothing from users).
	 */
	const ICON = '<svg class="fxp-ab-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 3l6 3.5-2.5 4.3-6-3.5z" fill="currentColor"/><path d="M13.6 9.2L4 21h10.5l2.6-9.8z" fill="currentColor" opacity=".45"/><circle cx="18.6" cy="3.6" r="1.2" fill="currentColor"/></svg>';

	/**
	 * Register hooks.
	 */
	public static function init() {
		add_action( 'admin_bar_menu', array( __CLASS__, 'admin_bar' ), 99 );
		add_action( 'wp_head', array( __CLASS__, 'collector' ), 1 );
		add_action( 'admin_head', array( __CLASS__, 'collector' ), 1 );
		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'assets' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'assets' ) );
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
	}

	/**
	 * Whether the current person can report with Pinpoint: an administrator of the site (not a
	 * support account), with Pinpoint turned on.
	 *
	 * @return bool
	 */
	public static function available() {
		$on = ! empty( ( (array) Fixpass_Settings::get( 'spotlight' ) )['enabled'] );
		/**
		 * Filters whether Spotlight ("Spotlight a problem" in the toolbar) is offered.
		 *
		 * @param bool $on On.
		 */
		return (bool) apply_filters( 'fixpass_spotlight', $on )
			&& is_user_logged_in()
			&& current_user_can( Fixpass_Access::CAP )
			&& ! Fixpass_Access::current_grant_id()
			// While support has access, the status is all the owner needs.
			&& ! Fixpass_Access::active();
	}

	/**
	 * Admin bar button.
	 *
	 * @param WP_Admin_Bar $bar Bar.
	 */
	public static function admin_bar( $bar ) {
		if ( ! self::available() ) {
			return;
		}
		$bar->add_node(
			array(
				'id'     => 'fixpass-spotlight',
				'parent' => 'top-secondary',
				'title'  => self::ICON . '<span class="ab-label">' . esc_html__( 'Spotlight a problem', 'fixpass' ) . '</span>',
				'href'   => '#fixpass-spotlight',
				'meta'   => array( 'title' => __( 'Click the part of this page that has the problem, and send it to your support', 'fixpass' ) ),
			)
		);
	}

	/**
	 * Load the reporting overlay (for those who can report) or the highlighter (a link from a
	 * report, with ?fxp_spot=).
	 */
	public static function assets() {
		$pin = isset( $_GET['fxp_spot'] ) ? sanitize_key( wp_unslash( $_GET['fxp_spot'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only: highlights a spot.
		if ( ! self::available() && '' === $pin ) {
			return;
		}
		// Versioned by file time, so an update never leaves an old copy in the browser's cache.
		wp_enqueue_script( 'fixpass-spotlight', FIXPASS_URL . 'assets/spotlight.js', array(), (string) filemtime( FIXPASS_DIR . 'assets/spotlight.js' ), true );
		wp_enqueue_style( 'fixpass-spotlight', FIXPASS_URL . 'assets/spotlight.css', array(), (string) filemtime( FIXPASS_DIR . 'assets/spotlight.css' ) );
		wp_localize_script(
			'fixpass-spotlight',
			'fixpassSpotlight',
			array(
				'can'       => self::available(),
				'pin'       => $pin,
				'api'       => esc_url_raw( rest_url( Fixpass_REST::NS . '/' ) ),
				'nonce'     => self::available() ? wp_create_nonce( 'wp_rest' ) : '',
				'back'      => self::available() ? admin_url( 'admin.php?page=' . Fixpass_Admin::SLUG . '#/?spot=' ) : '',
				'area'      => is_admin() ? 'admin' : 'front',
				'i18n'      => array(
					'pick'      => __( 'Click the part of the page that has the problem, or drag a box around it. Links are paused while Spotlight is on. Press Esc to cancel.', 'fixpass' ),
					'cancel'    => __( 'Cancel', 'fixpass' ),
					'introTitle'   => __( 'How Spotlight works', 'fixpass' ),
					'intro1'       => __( 'Click the part of the page that has the problem, or drag a box around an area.', 'fixpass' ),
					'intro2'       => __( 'Add a short note if you like. You can mark up to 5 spots, all on this page.', 'fixpass' ),
					'intro3'       => __( 'Click Continue to create your support link: your spots go with it.', 'fixpass' ),
					'introPause'   => __( 'While Spotlight is on, the page is paused: links, buttons and menus don’t work, so you can’t go to another page. Press Esc or Cancel to stop.', 'fixpass' ),
					'introPrivacy' => __( 'Nothing on your screen is recorded. Support opens the page itself, with your spots highlighted.', 'fixpass' ),
					'introHide'    => __( 'Don’t show this again', 'fixpass' ),
					'introStart'   => __( 'Start', 'fixpass' ),
					'title'     => __( 'Spotlight this spot', 'fixpass' ),
					'what'      => __( 'Next you create a support link. Your support gets the page, the spot, your screen size and browser, and any errors on this page.', 'fixpass' ),
					'next'      => __( 'Continue', 'fixpass' ),
					'another'   => __( 'Add another spot', 'fixpass' ),
					'label'     => __( 'What’s wrong here? (optional)', 'fixpass' ),
					'labelHint' => __( 'For example: wrong price, button does nothing', 'fixpass' ),
					/* translators: %d: number of spots */
					'count'     => __( 'Spots: %d of 5', 'fixpass' ),
					'working'   => __( 'Preparing…', 'fixpass' ),
					'failed'    => __( 'Something went wrong. Try again.', 'fixpass' ),
					'here'      => __( 'The reported spot', 'fixpass' ),
					'notFound'  => __( 'The exact element isn’t on the page any more; the box shows where it was.', 'fixpass' ),
					'pinGone'   => __( 'This highlight link has expired.', 'fixpass' ),
					'close'     => __( 'Close', 'fixpass' ),
				),
			)
		);
	}

	/**
	 * REST routes.
	 */
	public static function routes() {
		$owner = static function () {
			return current_user_can( Fixpass_Access::CAP );
		};
		$routes = array(
			array( '/admin/spot', 'POST', 'create', $owner ),
			array( '/admin/spot/(?P<id>[a-z0-9]{32})', 'GET', 'read', $owner ),
			// Public on purpose: the 32-character random ID is the key, and only the spot is returned.
			array( '/spot/(?P<id>[a-z0-9]{32})', 'GET', 'spot', '__return_true' ),
		);
		foreach ( $routes as $r ) {
			register_rest_route(
				Fixpass_REST::NS,
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
	 * Save picked spots (from the overlay).
	 *
	 * @param WP_REST_Request $request Request.
	 * @return array|WP_Error { id, ids }
	 */
	public static function create( WP_REST_Request $request ) {
		$params = (array) $request->get_json_params();
		$spots  = isset( $params['spots'] ) && is_array( $params['spots'] ) ? array_slice( $params['spots'], 0, 5 ) : array( $params );
		if ( ! $spots ) {
			return new WP_Error( 'fixpass_pin', __( 'Pick a spot first.', 'fixpass' ), array( 'status' => 400 ) );
		}
		$ids = array();
		foreach ( $spots as $spot ) {
			$ids[] = self::store( (array) $spot );
		}
		return array(
			'id'  => $ids[0],
			'ids' => $ids,
		);
	}

	/**
	 * Early in the page: remember JavaScript errors and failed requests, so a report made later
	 * on this page includes them. Nothing is sent unless the person reports a problem.
	 */
	public static function collector() {
		if ( ! self::available() ) {
			return;
		}
		wp_print_inline_script_tag(
			'(function(){var w=window,l=w.rspPinLog={errors:[],requests:[]};function add(a,x){if(a.length<20){a.push(x);}}' .
			'w.addEventListener("error",function(e){if(e&&e.message){add(l.errors,{message:String(e.message).slice(0,300),source:String(e.filename||"").slice(0,300),line:e.lineno||0});}else if(e&&e.target&&(e.target.src||e.target.href)){add(l.requests,{url:String(e.target.src||e.target.href).slice(0,300),status:0,method:"GET"});}},true);' .
			'w.addEventListener("unhandledrejection",function(e){add(l.errors,{message:String(e&&e.reason&&(e.reason.message||e.reason)||"Unhandled promise rejection").slice(0,300),source:"",line:0});});' .
			'if(w.fetch){var f=w.fetch;w.fetch=function(i,o){var u=String(i&&i.url||i),m=(o&&o.method)||(i&&i.method)||"GET";return f.apply(this,arguments).then(function(r){if(!r.ok){add(l.requests,{url:u.slice(0,300),status:r.status,method:m});}return r;},function(e){add(l.requests,{url:u.slice(0,300),status:0,method:m});throw e;});};}' .
			'var X=w.XMLHttpRequest&&w.XMLHttpRequest.prototype;if(X){var op=X.open,se=X.send;X.open=function(m,u){this._hdh=[m,String(u)];return op.apply(this,arguments);};X.send=function(){var x=this;x.addEventListener("loadend",function(){if(x._hdh&&(x.status===0||x.status>=400)){add(l.requests,{url:x._hdh[1].slice(0,300),status:x.status,method:x._hdh[0]});}});return se.apply(this,arguments);};}})();'
		);
	}
	/**
	 * The spot to highlight (nothing else).
	 *
	 * @param WP_REST_Request $request Request.
	 * @return array|WP_Error
	 */
	public static function spot( WP_REST_Request $request ) {
		$pin = self::all()[ (string) $request['id'] ] ?? null;
		if ( ! $pin ) {
			return new WP_Error( 'fixpass_pin', __( 'This highlight link has expired.', 'fixpass' ), array( 'status' => 404 ) );
		}
		return array(
			'selector' => $pin['selector'],
			'kind'     => $pin['kind'] ?? 'element',
			'box'      => $pin['box'] ?? null,
			'path'     => $pin['path'] ?? array(),
			'rect'     => $pin['rect'],
			'viewport' => $pin['viewport'],
		);
	}
	/**
	 * A spot, for the report screen.
	 *
	 * @param WP_REST_Request $request Request.
	 * @return array|WP_Error
	 */
	public static function read( WP_REST_Request $request ) {
		$pin = self::all()[ (string) $request['id'] ] ?? null;
		return $pin ? $pin : new WP_Error( 'fixpass_pin', __( 'This report wasn’t found. Try again.', 'fixpass' ), array( 'status' => 404 ) );
	}
	/**
	 * Keep one spot.
	 *
	 * @param array $raw Spot from the browser.
	 * @return string Pin ID.
	 */
	private static function store( array $raw ) {
		$pin       = self::clean( $raw );
		$pin['id'] = strtolower( wp_generate_password( 32, false ) );
		$pins = array_filter(
			self::all(),
			static function ( $p ) {
				return strtotime( $p['created_at'] . ' UTC' ) > time() - self::KEEP * DAY_IN_SECONDS;
			}
		);
		$pins[ $pin['id'] ] = array_merge(
			$pin,
			array(
				'created_at' => Fixpass_DB::now(),
				'created_by' => get_current_user_id(),
				'ticket_id'  => 0,
			)
		);
		update_option( self::OPTION, array_slice( $pins, -200, null, true ), false );
		return $pin['id'];
	}
	/**
	 * Everything about a spot that goes into a report.
	 *
	 * @param string $id Pin.
	 * @return array|null
	 */
	public static function spot_data( $id ) {
		$pin = self::all()[ sanitize_key( (string) $id ) ] ?? null;
		if ( ! $pin ) {
			return null;
		}
		unset( $pin['created_by'], $pin['ticket_id'], $pin['attachment'] ); // ticket_id: 1 once sent with a link.
		return $pin;
	}
	/**
	 * Remember that a spot was reported (for clean-up).
	 *
	 * @param string $id   Pin.
	 * @param int    $sent 1 once the spot went out with a support link.
	 */
	public static function mark_sent( $id, $sent = 1 ) {
		$pins = self::all();
		if ( isset( $pins[ $id ] ) ) {
			$pins[ $id ]['ticket_id'] = (int) $sent;
			update_option( self::OPTION, $pins, false );
		}
	}
	/**
	 * All pins by ID.
	 *
	 * @return array
	 */
	private static function all() {
		$pins = get_option( self::OPTION, array() );
		return is_array( $pins ) ? $pins : array();
	}
	/**
	 * Clean a report from the browser.
	 *
	 * @param array $in Raw.
	 * @return array
	 */
	public static function clean( array $in ) {
		$num  = static function ( $v ) {
			return (int) round( (float) $v );
		};
		$rect = (array) ( $in['rect'] ?? array() );
		$view = (array) ( $in['viewport'] ?? array() );
		$list = static function ( $items, array $keys ) {
			$out = array();
			foreach ( array_slice( (array) $items, 0, 20 ) as $item ) {
				$row = array();
				foreach ( $keys as $k => $type ) {
					$v         = ( (array) $item )[ $k ] ?? '';
					$row[ $k ] = 'int' === $type ? (int) $v : substr( Fixpass_Redactor::text( sanitize_text_field( (string) $v ) ), 0, 300 );
				}
				$out[] = $row;
			}
			return $out;
		};
		return array(
			'url'      => esc_url_raw( (string) ( $in['url'] ?? '' ) ),
			'title'    => substr( sanitize_text_field( (string) ( $in['title'] ?? '' ) ), 0, 200 ),
			'selector' => substr( sanitize_text_field( (string) ( $in['selector'] ?? '' ) ), 0, 500 ),
			// element: the element itself · area: a box drawn on the element (fractions of its size).
			'kind'     => 'area' === ( $in['kind'] ?? '' ) ? 'area' : 'element',
			'box'      => 'area' === ( $in['kind'] ?? '' ) && is_array( $in['box'] ?? null ) ? self::clean_box( $in['box'] ) : null,
			// How to find the element again, step by step from <body> (see spotlight.js).
			'path'     => self::clean_path( $in['path'] ?? array() ),
			'text'     => substr( sanitize_text_field( (string) ( $in['text'] ?? '' ) ), 0, 200 ),
			// The customer's own words for this spot ("this button", "wrong price").
			'label'    => substr( sanitize_text_field( (string) ( $in['label'] ?? '' ) ), 0, 80 ),
			'rect'     => array(
				'x' => $num( $rect['x'] ?? 0 ),
				'y' => $num( $rect['y'] ?? 0 ),
				'w' => max( 0, $num( $rect['w'] ?? 0 ) ),
				'h' => max( 0, $num( $rect['h'] ?? 0 ) ),
			),
			'viewport' => array(
				'w'   => max( 0, $num( $view['w'] ?? 0 ) ),
				'h'   => max( 0, $num( $view['h'] ?? 0 ) ),
				'dpr' => round( max( 0, min( 8, (float) ( $view['dpr'] ?? 1 ) ) ), 2 ),
			),
			'browser'  => substr( sanitize_text_field( (string) ( $in['browser'] ?? '' ) ), 0, 300 ),
			'area'     => 'admin' === ( $in['area'] ?? '' ) ? 'admin' : 'front',
			'errors'   => $list( $in['errors'] ?? array(), array( 'message' => 'text', 'source' => 'text', 'line' => 'int' ) ),
			'requests' => $list( $in['requests'] ?? array(), array( 'url' => 'text', 'status' => 'int', 'method' => 'text' ) ),
		);
	}
	/**
	 * Steps to an element: { id } or { t: tag, c: classes, i: position }.
	 *
	 * @param mixed $path Raw.
	 * @return array[]
	 */
	private static function clean_path( $path ) {
		$out = array();
		foreach ( array_slice( (array) $path, 0, 10 ) as $step ) {
			$step = (array) $step;
			if ( ! empty( $step['id'] ) && preg_match( '/^[A-Za-z][\w-]{0,99}$/', (string) $step['id'] ) ) {
				$out[] = array( 'id' => (string) $step['id'] );
				continue;
			}
			if ( empty( $step['t'] ) || ! preg_match( '/^[a-z][a-z0-9-]{0,30}$/', (string) $step['t'] ) ) {
				return array();
			}
			$out[] = array(
				't' => (string) $step['t'],
				'c' => array_values(
					array_filter(
						array_slice( (array) ( $step['c'] ?? array() ), 0, 2 ),
						static function ( $c ) {
							return is_string( $c ) && preg_match( '/^[A-Za-z][\w-]{0,99}$/', $c );
						}
					)
				),
				'i' => max( 0, min( 500, (int) ( $step['i'] ?? 0 ) ) ),
			);
		}
		return $out;
	}
	/**
	 * An area box: pixel offsets from an element, or (older spots) fractions of it.
	 *
	 * @param array $box Raw { x, y, w, h }.
	 * @return array
	 */
	private static function clean_box( array $box ) {
		$out = array();
		if ( ! empty( $box['px'] ) ) {
			// Pixels from the element under the box's centre.
			$out['px'] = true;
			foreach ( array( 'x', 'y', 'w', 'h' ) as $k ) {
				$out[ $k ] = max( -20000, min( 20000, (int) ( $box[ $k ] ?? 0 ) ) );
			}
			return $out;
		}
		// Fractions of the element (spots from before 2.1.1).
		foreach ( array( 'x', 'y', 'w', 'h' ) as $k ) {
			$out[ $k ] = round( max( 0, min( 1, (float) ( $box[ $k ] ?? 0 ) ) ), 4 );
		}
		return $out;
	}
}
