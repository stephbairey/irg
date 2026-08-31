<?php
/**
 * Calgary Local — child of The Bulletin Local. Visual overrides only.
 *
 * @package calgary-local
 */
function cgl_enqueue_child_styles(): void {
	wp_enqueue_style(
		'cgl-overrides',
		get_stylesheet_directory_uri() . '/assets/css/overrides.css',
		[ 'tbl-styles' ],
		wp_get_theme()->get( 'Version' )
	);
}
add_action( 'wp_enqueue_scripts', 'cgl_enqueue_child_styles', 20 );
