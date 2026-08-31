<?php
/**
 * Western Mass Local — child of The Bulletin Local.
 *
 * The parent theme's functions.php still runs (constants, seeder,
 * Gaggle Settings, contact endpoint). This file only layers the
 * gaggle's visual overrides on top of the parent stylesheet.
 *
 * @package western-mass-local
 */

function wml_enqueue_child_styles(): void {
	wp_enqueue_style(
		'wml-overrides',
		get_stylesheet_directory_uri() . '/assets/css/western-mass.css',
		[ 'tbl-styles' ],
		wp_get_theme()->get( 'Version' )
	);
}
add_action( 'wp_enqueue_scripts', 'wml_enqueue_child_styles', 20 );
