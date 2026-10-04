<?php
/**
 * Fixpass live demo: sample content for WordPress Playground (run once by the blueprint).
 *
 * @package Fixpass
 */

defined( 'ABSPATH' ) || exit;

// A page with a problem to spotlight: the order button goes nowhere.
if ( ! get_page_by_path( 'order-a-cake' ) ) {
	wp_insert_post(
		array(
			'post_type'    => 'page',
			'post_status'  => 'publish',
			'post_title'   => 'Order a cake',
			'post_name'    => 'order-a-cake',
			'post_content' => '<!-- wp:paragraph --><p>Celebration cakes, baked to order. Choose a size and flavour, and collect it from the shop two days later.</p><!-- /wp:paragraph -->'
				. '<!-- wp:list --><ul class="wp-block-list"><!-- wp:list-item --><li>Small (serves 8): £24</li><!-- /wp:list-item --><!-- wp:list-item --><li>Medium (serves 14): £0.00</li><!-- /wp:list-item --><!-- wp:list-item --><li>Large (serves 20): £46</li><!-- /wp:list-item --></ul><!-- /wp:list -->'
				. '<!-- wp:buttons --><div class="wp-block-buttons"><!-- wp:button --><div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Place your order</a></div><!-- /wp:button --></div><!-- /wp:buttons -->',
		)
	);
}

// A few lines in the debug log for the support tools.
error_log( 'PHP Warning:  Undefined variable $cart in /wordpress/wp-content/themes/twentytwentyfive/functions.php on line 42' );
error_log( 'PHP Notice:  Function wp_enqueue_script was called incorrectly. Scripts and styles should not be registered or enqueued until the wp_enqueue_scripts hook.' );
error_log( 'PHP Fatal error:  Uncaught Error: Call to undefined function bakery_price() in /wordpress/wp-content/plugins/order-form/order-form.php:118' );
