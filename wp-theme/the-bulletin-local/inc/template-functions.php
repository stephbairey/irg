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
 * Hero image URL — option override, or bundled default. The default is
 * cache-busted by theme version: WP/LiteSpeed sets a 7-day public cache on
 * static assets, so swapping the bundled image without a URL change leaves
 * browsers stuck on the old copy until cache expiry.
 */
function tbl_hero_image_url(): string {
	$id = (int) tbl_get_option( 'hero_image_id' );
	if ( $id ) {
		$src = wp_get_attachment_image_url( $id, 'large' );
		if ( $src ) {
			return $src;
		}
	}
	return TBL_URI . '/assets/images/default-hero.jpg?v=' . TBL_VERSION;
}

/**
 * URL the Songs pill should point to. When the subsite has the local
 * songs page enabled (Gaggle Settings → Display songs on this subsite),
 * the pill links to that subsite-local page. Otherwise it falls through
 * to the central Astro library, pre-filtered by this gaggle.
 *
 * The Astro page does a case-insensitive lookup against the song-
 * library's gaggle taxonomy term names, so the subsite slug resolves
 * to the canonical-cased term ("portland" → "Portland").
 */
function tbl_songs_url(): string {
	if ( (int) tbl_get_option( 'show_local_songs' ) === 1 ) {
		return home_url( '/songs/' );
	}
	$slug = tbl_gaggle_slug();
	if ( $slug === '' ) {
		return 'https://raginggrannies.international/songs/';
	}
	return 'https://raginggrannies.international/songs/?gaggle=' . rawurlencode( $slug );
}

/**
 * Public detail URL for a song slug — points to the Astro library's
 * canonical detail page. Host is overrideable via IRG_PUBLIC_HOST.
 */
function tbl_song_detail_url( string $slug ): string {
	$host = defined( 'IRG_PUBLIC_HOST' ) ? rtrim( IRG_PUBLIC_HOST, '/' ) : 'https://raginggrannies.org';
	return $host . '/songs/' . rawurlencode( $slug ) . '/';
}

/**
 * Songs visible on this subsite, queried cross-network from the main site.
 * Returns plain arrays (see irg_get_subsite_songs in irg-core).
 *
 * @return array<int, array<string, mixed>>
 */
function tbl_subsite_songs(): array {
	if ( ! function_exists( 'irg_get_subsite_songs' ) ) {
		return [];
	}
	return irg_get_subsite_songs( tbl_gaggle_slug() );
}

/**
 * Count of songs detected for this subsite. Used by Gaggle Settings to
 * show the gaggle admin a sanity-check that the slug match is working.
 */
function tbl_count_local_songs(): int {
	return count( tbl_subsite_songs() );
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
 * an image — most grannies won't set a featured image on their own. The
 * default is cache-busted by theme version (see tbl_hero_image_url for why).
 */
function tbl_action_feature_url( string $size = 'large' ): string {
	$post = get_post();
	if ( $post && has_post_thumbnail( $post ) ) {
		$src = get_the_post_thumbnail_url( $post, $size );
		if ( $src ) {
			return $src;
		}
	}
	return TBL_URI . '/assets/images/default-feat.jpg?v=' . TBL_VERSION;
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

/**
 * Resolve a YouTube channel URL (handle, /c/, /channel/, custom) into the
 * canonical UC… channel ID. Returns "" if it can't be determined. Cached
 * via transient: 7 days on hit, 1 hour on miss so a misconfigured URL
 * doesn't hammer YouTube on every page load.
 */
function tbl_resolve_youtube_channel_id( string $url ): string {
	$url = trim( $url );
	if ( $url === '' ) {
		return '';
	}
	// Direct channel URL: /channel/UCxxx — no scrape needed.
	if ( preg_match( '#youtube\.com/channel/(UC[A-Za-z0-9_-]{22})#', $url, $m ) ) {
		return $m[1];
	}
	$cache_key = 'tbl_yt_chid_' . md5( $url );
	$cached    = get_transient( $cache_key );
	if ( is_string( $cached ) ) {
		return $cached;
	}
	$resp = wp_remote_get(
		$url,
		[
			'timeout'     => 8,
			'redirection' => 3,
			'headers'     => [
				// Desktop UA so YouTube returns the embedded JSON we scrape from
				// rather than a stripped-down mobile shell.
				'User-Agent' => 'Mozilla/5.0 (compatible; IRG-Theme/1.0)',
			],
		]
	);
	if ( is_wp_error( $resp ) || (int) wp_remote_retrieve_response_code( $resp ) !== 200 ) {
		set_transient( $cache_key, '', HOUR_IN_SECONDS );
		return '';
	}
	$body = (string) wp_remote_retrieve_body( $resp );
	$patterns = [
		'#"channelId":"(UC[A-Za-z0-9_-]{22})"#',
		'#"externalId":"(UC[A-Za-z0-9_-]{22})"#',
		'#<meta\s+itemprop="channelId"\s+content="(UC[A-Za-z0-9_-]{22})"#',
	];
	foreach ( $patterns as $p ) {
		if ( preg_match( $p, $body, $m ) ) {
			set_transient( $cache_key, $m[1], 7 * DAY_IN_SECONDS );
			return $m[1];
		}
	}
	set_transient( $cache_key, '', HOUR_IN_SECONDS );
	return '';
}

/**
 * Fetch the latest videos from a YouTube channel via its public RSS feed
 * (https://www.youtube.com/feeds/videos.xml?channel_id=UC…). No API key
 * required. Returns an array of [ 'videoId', 'title', 'published' ].
 * Cached for 1 hour.
 */
function tbl_fetch_youtube_videos( string $channel_id, int $limit = 6 ): array {
	if ( $channel_id === '' ) {
		return [];
	}
	$cache_key = 'tbl_yt_videos_' . $channel_id;
	$cached    = get_transient( $cache_key );
	if ( is_array( $cached ) ) {
		return array_slice( $cached, 0, $limit );
	}
	$rss_url = 'https://www.youtube.com/feeds/videos.xml?channel_id=' . rawurlencode( $channel_id );
	$resp    = wp_remote_get( $rss_url, [ 'timeout' => 8 ] );
	if ( is_wp_error( $resp ) || (int) wp_remote_retrieve_response_code( $resp ) !== 200 ) {
		set_transient( $cache_key, [], 10 * MINUTE_IN_SECONDS );
		return [];
	}
	$body = (string) wp_remote_retrieve_body( $resp );
	$prev = libxml_use_internal_errors( true );
	$xml  = @simplexml_load_string( $body );
	libxml_use_internal_errors( $prev );
	if ( ! $xml ) {
		set_transient( $cache_key, [], 10 * MINUTE_IN_SECONDS );
		return [];
	}
	$videos = [];
	foreach ( $xml->entry as $entry ) {
		$yt  = $entry->children( 'yt', true );
		$vid = (string) ( $yt->videoId ?? '' );
		if ( $vid === '' ) {
			continue;
		}
		$videos[] = [
			'videoId'   => $vid,
			'title'     => trim( (string) $entry->title ),
			'published' => (string) $entry->published,
		];
	}
	set_transient( $cache_key, $videos, HOUR_IN_SECONDS );
	return array_slice( $videos, 0, $limit );
}
