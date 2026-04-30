<?php
/**
 * The Bulletin Local — theme bootstrap.
 *
 * @package the-bulletin-local
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TBL_VERSION', '1.6.0' );
define( 'TBL_DIR', get_template_directory() );
define( 'TBL_URI', get_template_directory_uri() );

require_once TBL_DIR . '/inc/template-functions.php';
require_once TBL_DIR . '/inc/theme-options.php';
require_once TBL_DIR . '/inc/default-content.php';

/**
 * Theme setup. Runs once on `after_setup_theme`.
 */
function tbl_setup(): void {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'html5', [
		'search-form',
		'comment-form',
		'comment-list',
		'gallery',
		'caption',
		'style',
		'script',
	] );
	add_theme_support( 'custom-logo', [
		'height'      => 120,
		'width'       => 120,
		'flex-height' => true,
		'flex-width'  => true,
	] );

	register_nav_menus( [
		'primary' => __( 'Primary navigation', 'the-bulletin-local' ),
	] );
}
add_action( 'after_setup_theme', 'tbl_setup' );

/**
 * Frontend assets. Crimson Text from Google Fonts plus the local stylesheet
 * and any per-template scripts. Everything is plain enqueue, no build step.
 */
function tbl_enqueue_assets(): void {
	wp_enqueue_style(
		'tbl-fonts',
		'https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,wght@0,300;0,400;0,600;0,700;0,800;1,300;1,400;1,700&family=Rum+Raisin&display=swap',
		[],
		null
	);

	wp_enqueue_style(
		'tbl-styles',
		TBL_URI . '/assets/css/bulletin-local.css',
		[ 'tbl-fonts' ],
		TBL_VERSION
	);

	wp_enqueue_script(
		'tbl-navigation',
		TBL_URI . '/assets/js/navigation.js',
		[],
		TBL_VERSION,
		true
	);

	if ( is_page_template( 'page-photos.php' ) || is_page( 'photos' ) ) {
		wp_enqueue_script(
			'tbl-lightbox',
			TBL_URI . '/assets/js/lightbox.js',
			[],
			TBL_VERSION,
			true
		);
	}

	if ( is_page_template( 'page-contact.php' ) || is_page( 'contact-us' ) || is_page( 'contact' ) ) {
		wp_enqueue_script(
			'tbl-contact-form',
			TBL_URI . '/assets/js/contact-form.js',
			[],
			TBL_VERSION,
			true
		);
		wp_localize_script( 'tbl-contact-form', 'TBL_CONTACT', [
			'ajaxUrl' => admin_url( 'admin-ajax.php' ),
			'nonce'   => wp_create_nonce( 'tbl_contact' ),
		] );
	}
}
add_action( 'wp_enqueue_scripts', 'tbl_enqueue_assets' );

/**
 * Body class additions used by the stylesheet (e.g., to hide the Videos nav
 * link site-wide when no YouTube URL is configured).
 */
function tbl_body_classes( array $classes ): array {
	if ( ! tbl_get_option( 'youtube_channel_url' ) ) {
		$classes[] = 'tbl-no-videos';
	}
	return $classes;
}
add_filter( 'body_class', 'tbl_body_classes' );

/**
 * Contact form handler. AJAX endpoint, nonce-checked. The recipient is
 * derived from the subsite slug: <slug>@raginggrannies.org.
 */
function tbl_handle_contact_submit(): void {
	check_ajax_referer( 'tbl_contact', 'nonce' );

	$honeypot = isset( $_POST['hp'] ) ? (string) $_POST['hp'] : '';
	if ( $honeypot !== '' ) {
		// Bots fill it; succeed silently.
		wp_send_json_success( [ 'message' => 'Thanks for reaching out! A granny will get back to you.' ] );
	}

	$name    = isset( $_POST['name'] ) ? sanitize_text_field( wp_unslash( $_POST['name'] ) ) : '';
	$email   = isset( $_POST['email'] ) ? sanitize_email( wp_unslash( $_POST['email'] ) ) : '';
	$message = isset( $_POST['message'] ) ? trim( wp_unslash( $_POST['message'] ) ) : '';

	if ( $name === '' || $message === '' ) {
		wp_send_json_error( [ 'message' => 'Name and message are required.' ], 400 );
	}
	if ( ! is_email( $email ) ) {
		wp_send_json_error( [ 'message' => 'A valid email is required.' ], 400 );
	}
	if ( strlen( $name ) > 200 || strlen( $message ) > 8000 ) {
		wp_send_json_error( [ 'message' => 'That message is longer than we accept here.' ], 400 );
	}

	$to       = tbl_gaggle_email();
	$site     = wp_strip_all_tags( get_bloginfo( 'name' ) );
	$subject  = sprintf( '[%s] Contact form: %s', $site, $name );
	$body     = "Name:    {$name}\n";
	$body    .= "Email:   {$email}\n";
	$body    .= "Site:    {$site}\n\n";
	$body    .= "Message:\n{$message}\n";
	$headers  = [
		'Content-Type: text/plain; charset=UTF-8',
		'Reply-To: ' . sprintf( '%s <%s>', $name, $email ),
	];

	$sent = wp_mail( $to, $subject, $body, $headers );
	if ( ! $sent ) {
		wp_send_json_error( [
			'message' => sprintf( 'Something went wrong. Please try again or email us directly at %s.', $to ),
		], 500 );
	}

	wp_send_json_success( [ 'message' => 'Thanks for reaching out! A granny will get back to you.' ] );
}
add_action( 'wp_ajax_tbl_contact', 'tbl_handle_contact_submit' );
add_action( 'wp_ajax_nopriv_tbl_contact', 'tbl_handle_contact_submit' );

/**
 * On theme activation, run the default content seeder. Activation hooks
 * for themes are fired via `after_switch_theme`.
 */
function tbl_on_activation(): void {
	tbl_seed_default_content();
}
add_action( 'after_switch_theme', 'tbl_on_activation' );
