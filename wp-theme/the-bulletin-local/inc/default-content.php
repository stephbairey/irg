<?php
/**
 * Default content seeder. Runs once on theme activation. Idempotent: it
 * checks for existing slugs before creating anything, so re-activating
 * doesn't duplicate.
 *
 * @package the-bulletin-local
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Seed starter pages, set the static front + posts page, set permalinks,
 * and create one sample Action if there are no published posts.
 */
function tbl_seed_default_content(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$home_id     = tbl_ensure_page( 'home',       'Welcome',     '' );
	$about_id    = tbl_ensure_page( 'about',      'About Us',    tbl_default_about_content() );
	$photos_id   = tbl_ensure_page( 'photos',     'Photos',      '', 'page-photos.php' );
	$videos_id   = tbl_ensure_page( 'videos',     'Videos',      '', 'page-videos.php' );
	$contact_id  = tbl_ensure_page( 'contact',    'Contact Us',  '', 'page-contact.php' );
	$actions_id  = tbl_ensure_page( 'actions',    'Actions',     '' );

	if ( $home_id ) {
		update_option( 'show_on_front',  'page' );
		update_option( 'page_on_front',  $home_id );
	}
	if ( $actions_id ) {
		update_option( 'page_for_posts', $actions_id );
	}

	// Permalink structure: /%postname%/.
	$current_permalink = (string) get_option( 'permalink_structure' );
	if ( $current_permalink !== '/%postname%/' ) {
		update_option( 'permalink_structure', '/%postname%/' );
		flush_rewrite_rules( false );
	}

	// One sample Action only if the gaggle hasn't published anything yet.
	$existing_posts = get_posts( [
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => 1,
		'fields'         => 'ids',
	] );
	if ( empty( $existing_posts ) ) {
		wp_insert_post( [
			'post_type'    => 'post',
			'post_status'  => 'publish',
			'post_title'   => 'Welcome to Our Corner of the Movement',
			'post_name'    => 'welcome-to-our-corner-of-the-movement',
			'post_content' => "This is where we'll share news about our actions, performances, and everything we're raging about. Stay tuned!",
		] );
	}
}

/**
 * Create-or-find a page by slug. Returns the page ID, or 0 on failure.
 */
function tbl_ensure_page( string $slug, string $title, string $content = '', string $template = '' ): int {
	$existing = get_page_by_path( $slug, OBJECT, 'page' );
	if ( $existing instanceof WP_Post ) {
		// Don't overwrite an existing page's content; only set the template
		// if it hasn't been picked yet.
		if ( $template !== '' ) {
			$current = get_page_template_slug( $existing->ID );
			if ( $current === '' ) {
				update_post_meta( $existing->ID, '_wp_page_template', $template );
			}
		}
		return (int) $existing->ID;
	}

	$post_id = wp_insert_post( [
		'post_type'    => 'page',
		'post_status'  => 'publish',
		'post_title'   => $title,
		'post_name'    => $slug,
		'post_content' => $content,
	] );
	if ( is_wp_error( $post_id ) || ! $post_id ) {
		return 0;
	}
	if ( $template !== '' ) {
		update_post_meta( $post_id, '_wp_page_template', $template );
	}
	return (int) $post_id;
}

/**
 * Default About page copy. The gaggle's locator (site title) is interpolated
 * so the seeded paragraph reads naturally with "[locator] Raging Grannies".
 */
function tbl_default_about_content(): string {
	$aka  = function_exists( 'tbl_gaggle_aka' )
		? tbl_gaggle_aka()
		: ( wp_strip_all_tags( get_bloginfo( 'name' ) ) . ' Raging Grannies' );

	$body  = "We are the {aka}, a local chapter of an international disorganization. We're women of a certain age who use satirical songs and street theater to fight for peace, social justice, and the planet.\n\n";
	$body .= "We meet regularly to rehearse, plan actions, and raise our voices wherever they need to be heard. We believe in non-violence, consensus, and the power of a well-timed song in a flowery hat.\n\n";
	$body .= "Want to join us? Come to one of our actions or reach out through our Contact page. No singing ability required. Just bring a sense of humor and a sense of outrage.";

	return str_replace( '{aka}', $aka, $body );
}
