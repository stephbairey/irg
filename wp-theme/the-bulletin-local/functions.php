<?php
/**
 * The Bulletin Local — theme bootstrap.
 *
 * @package the-bulletin-local
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TBL_VERSION', '1.16.0' );
define( 'TBL_DIR', get_template_directory() );
define( 'TBL_URI', get_template_directory_uri() );

require_once TBL_DIR . '/inc/template-functions.php';
require_once TBL_DIR . '/inc/theme-options.php';
require_once TBL_DIR . '/inc/default-content.php';
require_once TBL_DIR . '/inc/jsonld.php';

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
 * On theme activation, run the default content seeder and flush rewrite
 * rules so the /songs/<slug>/ rule below takes effect. Activation hooks
 * for themes are fired via `after_switch_theme`.
 */
function tbl_on_activation(): void {
	tbl_seed_default_content();
	flush_rewrite_rules( false );
}
add_action( 'after_switch_theme', 'tbl_on_activation' );

/**
 * Custom rewrite rule for subsite single-song pages: /songs/<slug>/ maps
 * to the tbl_song_slug query var; template_include below loads
 * single-song.php when that var is set. Registered unconditionally; the
 * rule is harmless on subsites that don't have show_local_songs enabled
 * because the template falls back gracefully.
 */
function tbl_register_song_rewrite(): void {
	add_rewrite_rule( '^songs/([^/]+)/?$', 'index.php?tbl_song_slug=$matches[1]', 'top' );
}
add_action( 'init', 'tbl_register_song_rewrite' );

/**
 * Auto-flush rewrite rules when the theme version changes. after_switch_theme
 * doesn't fire on a theme *update* (only on first activation), so without
 * this hook a deploy that adds a new rewrite rule wouldn't take effect until
 * something else flushed (e.g. Settings → Permalinks → Save). One-shot per
 * version: the option write makes the comparison cheap on later requests.
 */
function tbl_maybe_flush_on_version_change(): void {
	$stored = get_option( 'tbl_active_version', '' );
	if ( $stored === TBL_VERSION ) {
		return;
	}
	update_option( 'tbl_active_version', TBL_VERSION );
	flush_rewrite_rules( false );
	// Backfill schema/content that exists in newer versions but missing on
	// existing subsites. Keep these idempotent — they may run repeatedly
	// across deploys as the version bumps.
	if ( function_exists( 'tbl_ensure_gaggle_notes_category' ) ) {
		tbl_ensure_gaggle_notes_category();
	}
}
add_action( 'init', 'tbl_maybe_flush_on_version_change', 99 );

/**
 * Exclude the Gaggle Notes category from the main /actions/ archive
 * query. The category is its own surface (front-page section + standard
 * /category/gaggle-notes/ archive), so it shouldn't double-render in
 * the chronological actions list.
 */
function tbl_exclude_gaggle_notes_from_actions( WP_Query $query ): void {
	if ( is_admin() || ! $query->is_main_query() ) {
		return;
	}
	if ( ! $query->is_home() ) {
		return;
	}
	$cat_id = function_exists( 'tbl_gaggle_notes_category_id' )
		? tbl_gaggle_notes_category_id()
		: 0;
	if ( ! $cat_id ) {
		return;
	}
	$existing   = (array) $query->get( 'category__not_in' );
	$existing[] = $cat_id;
	$query->set( 'category__not_in', array_values( array_unique( $existing ) ) );
}
add_action( 'pre_get_posts', 'tbl_exclude_gaggle_notes_from_actions' );

function tbl_register_song_query_var( array $vars ): array {
	$vars[] = 'tbl_song_slug';
	return $vars;
}
add_filter( 'query_vars', 'tbl_register_song_query_var' );

function tbl_load_single_song_template( $template ) {
	$slug = get_query_var( 'tbl_song_slug' );
	if ( $slug ) {
		$custom = locate_template( 'single-song.php' );
		if ( $custom ) {
			return $custom;
		}
	}
	return $template;
}
add_filter( 'template_include', 'tbl_load_single_song_template' );

/**
 * When `show_local_songs` flips from off to on, ensure the /songs/ page
 * exists with the page-songs.php template assigned. Idempotent — safe
 * to fire repeatedly. We don't auto-delete on flip-off; an admin who
 * customized the page intro shouldn't lose it.
 *
 * WP fires `updated_option` with ($option_name, $old_value, $new_value) —
 * order matters.
 */
function tbl_on_options_updated( $option_name, $old_value, $new_value ): void {
	if ( $option_name !== 'tbl_options' ) {
		return;
	}
	$new_on = is_array( $new_value ) && ! empty( $new_value['show_local_songs'] );
	if ( $new_on ) {
		// Idempotent — does nothing if the page already exists. Always
		// running it on settings save means a stale "toggle is already on
		// but the page never got created" state self-heals on next save.
		tbl_ensure_page( 'songs', 'Songs', '', 'page-songs.php' );
		// Flush so the /songs/<slug>/ rewrite is active on subsites that
		// only have it after a theme update.
		flush_rewrite_rules( false );
	}
}
add_action( 'updated_option', 'tbl_on_options_updated', 10, 3 );

/**
 * Same trigger when the option is being created for the first time
 * (rare — defaults are set, so usually `updated_option` fires instead).
 */
function tbl_on_options_added( $option_name, $value ): void {
	if ( $option_name !== 'tbl_options' ) {
		return;
	}
	if ( is_array( $value ) && ! empty( $value['show_local_songs'] ) ) {
		tbl_ensure_page( 'songs', 'Songs', '', 'page-songs.php' );
	}
}
add_action( 'added_option', 'tbl_on_options_added', 10, 2 );
