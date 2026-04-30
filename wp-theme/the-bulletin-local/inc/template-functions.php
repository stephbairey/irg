<?php
/**
 * Helpers used across templates.
 *
 * @package the-bulletin-local
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Read a single Gaggle Settings option, with a defensible default.
 */
function tbl_get_option( string $key ): string {
	$opts = get_option( 'tbl_options', [] );
	return isset( $opts[ $key ] ) ? (string) $opts[ $key ] : '';
}

/**
 * The gaggle locator (subsite title), trimmed. Should be just the geographic
 * descriptor, e.g. "San Jose & Santa Clara County" — not "... Raging Grannies".
 * The "Raging Grannies" suffix is appended by tbl_gaggle_aka() where needed.
 */
function tbl_gaggle_name(): string {
	return trim( wp_strip_all_tags( get_bloginfo( 'name' ) ) );
}

/**
 * The gaggle's full AKA: "<locator> Raging Grannies".
 * Used in the hero title and footer wordmark.
 */
function tbl_gaggle_aka(): string {
	return tbl_gaggle_name() . ' Raging Grannies';
}

/**
 * The subsite slug, derived from the blog details path. "/portland/" -> "portland".
 * On the main site (path "/"), returns an empty string.
 */
function tbl_gaggle_slug(): string {
	if ( ! function_exists( 'get_blog_details' ) ) {
		return '';
	}
	$details = get_blog_details();
	if ( ! $details || empty( $details->path ) ) {
		return '';
	}
	$slug = trim( (string) $details->path, '/' );
	return $slug;
}

/**
 * Standardized contact email for the gaggle: <slug>@raginggrannies.org.
 * If we can't determine the slug, fall back to a network-safe address.
 */
function tbl_gaggle_email(): string {
	$slug = tbl_gaggle_slug();
	if ( $slug === '' ) {
		return 'connect@raginggrannies.org';
	}
	return $slug . '@raginggrannies.org';
}

/**
 * Tagline (theme option), with a default for fresh installs.
 */
function tbl_tagline(): string {
	$t = tbl_get_option( 'tagline' );
	if ( $t !== '' ) {
		return $t;
	}
	return 'Older women in flowered hats, singing truth to power and joy to the streets. We do not retire quietly.';
}

/**
 * Hero image URL — option override, or bundled default.
 */
function tbl_hero_image_url(): string {
	$id = (int) tbl_get_option( 'hero_image_id' );
	if ( $id ) {
		$src = wp_get_attachment_image_url( $id, 'large' );
		if ( $src ) {
			return $src;
		}
	}
	return TBL_URI . '/assets/images/default-hero.jpg';
}

/**
 * URL to the main Astro site's Song Library, pre-filtered by this gaggle.
 * Passes the subsite slug (e.g. "portland"); the Astro page does a
 * case-insensitive lookup against the song-library's gaggle taxonomy term
 * names, so the slug resolves to the canonical-cased term ("Portland").
 */
function tbl_songs_url(): string {
	$slug = tbl_gaggle_slug();
	if ( $slug === '' ) {
		return 'https://raginggrannies.international/songs/';
	}
	return 'https://raginggrannies.international/songs/?gaggle=' . rawurlencode( $slug );
}

/**
 * Excerpt the way we want it: prefer manual, fallback to auto. Strips
 * standalone URLs (so YouTube/external links in post bodies don't show up
 * as raw URL text in card excerpts) and collapses whitespace.
 */
function tbl_excerpt( int $words = 28 ): string {
	$post = get_post();
	if ( ! $post ) {
		return '';
	}
	$raw = has_excerpt( $post ) ? get_the_excerpt() : wp_strip_all_tags( $post->post_content );
	$raw = (string) ( $raw ?? '' );
	// Strip URLs (http/https/www-prefixed and bare domain-with-path).
	$raw = preg_replace( '#https?://\S+#i', '', $raw );
	$raw = preg_replace( '#\bwww\.\S+#i', '', $raw );
	$raw = preg_replace( '/\s+/', ' ', $raw );
	return wp_trim_words( trim( $raw ), $words, '…' );
}

/**
 * URL of the featured image for the current post, or the bundled default
 * if no featured image is set. Used by single.php so every Action page has
 * an image — most grannies won't set a featured image on their own.
 */
function tbl_action_feature_url( string $size = 'large' ): string {
	$post = get_post();
	if ( $post && has_post_thumbnail( $post ) ) {
		$src = get_the_post_thumbnail_url( $post, $size );
		if ( $src ) {
			return $src;
		}
	}
	return TBL_URI . '/assets/images/default-feat.jpg';
}

/**
 * Whether the current post has its own (non-default) featured image. Used
 * by templates that want to behave differently for default-vs-real images.
 */
function tbl_action_has_real_feature(): bool {
	$post = get_post();
	return $post ? (bool) has_post_thumbnail( $post ) : false;
}

/**
 * Output an inline SVG logo (cropped 526x500 or full 676x1000). The SVG file
 * has no root fill attribute so CSS controls color via the parent class.
 *
 * @param string $variant 'cropped' or 'full'.
 * @return string SVG markup, or empty string if the file is missing.
 */
function tbl_logo_svg( string $variant = 'cropped' ): string {
	static $cache = [];
	if ( isset( $cache[ $variant ] ) ) {
		return $cache[ $variant ];
	}
	$file = TBL_DIR . '/assets/images/logo-' . ( $variant === 'full' ? 'full' : 'cropped' ) . '.svg';
	if ( ! is_readable( $file ) ) {
		return $cache[ $variant ] = '';
	}
	return $cache[ $variant ] = (string) file_get_contents( $file );
}

/**
 * Collect every attachment ID used by published Action posts: featured
 * images plus images embedded in post_content (Gutenberg's wp-image-NN
 * class is the most reliable hook). Used by the Photos page.
 *
 * @return int[] Unique attachment IDs, ordered newest-post-first.
 */
function tbl_collect_action_attachment_ids(): array {
	$cache_key = 'tbl_action_attachments_v1';
	$cached    = get_transient( $cache_key );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	$ids = [];

	$q = new WP_Query( [
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'orderby'        => 'date',
		'order'          => 'DESC',
		'no_found_rows'  => true,
	] );

	foreach ( $q->posts as $p ) {
		$thumb_id = (int) get_post_thumbnail_id( $p );
		if ( $thumb_id ) {
			$ids[ $thumb_id ] = true;
		}
		if ( ! empty( $p->post_content ) && preg_match_all( '/wp-image-(\d+)/i', $p->post_content, $m ) ) {
			foreach ( $m[1] as $aid ) {
				$ids[ (int) $aid ] = true;
			}
		}
	}

	$out = array_keys( $ids );
	set_transient( $cache_key, $out, 5 * MINUTE_IN_SECONDS );
	return $out;
}

/**
 * Bust the photos transient whenever an Action is saved.
 */
function tbl_invalidate_photos_cache( int $post_id ): void {
	if ( get_post_type( $post_id ) !== 'post' ) {
		return;
	}
	delete_transient( 'tbl_action_attachments_v1' );
}
add_action( 'save_post', 'tbl_invalidate_photos_cache' );
add_action( 'deleted_post', 'tbl_invalidate_photos_cache' );

/**
 * The label irg-core sets for the Posts CPT on subsites is "Action" /
 * "Actions". Use that consistently when we render UI strings.
 */
function tbl_actions_label( bool $plural = true ): string {
	return $plural ? 'Actions' : 'Action';
}

/**
 * SVG icons used as the "no featured image" fallback in action cards and
 * list rows. Rotated by the caller's index so successive placeholders vary.
 *
 * @return string Inline SVG markup (currentColor stroke; sized via CSS).
 */
function tbl_placeholder_icon( int $idx ): string {
	$icons = [
		// Musical notes
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
		// People silhouette
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21v-4a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v4"/><circle cx="12" cy="7" r="4"/></svg>',
		// Megaphone
		'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l15-7v16l-15-7z"/><path d="M8 12v5a3 3 0 0 0 6 0v-2"/></svg>',
	];
	return $icons[ $idx % count( $icons ) ];
}
