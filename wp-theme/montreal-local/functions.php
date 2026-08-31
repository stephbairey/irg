<?php
/**
 * Montreal Local — child of The Bulletin Local. Visual overrides plus the
 * Open Sans face the old site used.
 *
 * @package montreal-local
 */
function mtl_enqueue_child_styles(): void {
	wp_enqueue_style(
		'mtl-fonts',
		'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&display=swap',
		[],
		null
	);
	wp_enqueue_style(
		'mtl-overrides',
		get_stylesheet_directory_uri() . '/assets/css/overrides.css',
		[ 'tbl-styles', 'mtl-fonts' ],
		wp_get_theme()->get( 'Version' )
	);
}
add_action( 'wp_enqueue_scripts', 'mtl_enqueue_child_styles', 20 );
