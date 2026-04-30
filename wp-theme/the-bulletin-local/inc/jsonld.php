<?php
/**
 * JSON-LD schema emission for The Bulletin Local theme.
 *
 * Hooks `wp_head` and emits per-page-type structured data based on the
 * current request context. Mirrors the Astro frontend's <JsonLd> pattern
 * so the central library and gaggle subsites speak the same schema.
 *
 * Refs D038 (JSON-LD across both Astro and the theme).
 *
 * @package the-bulletin-local
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Emit a single JSON-LD schema block. JSON_HEX_TAG escapes "<" and ">"
 * as their unicode escape forms so a value containing "</script>" can
 * never close the tag.
 */
function tbl_emit_jsonld( array $schema ): void {
	if ( empty( $schema ) ) {
		return;
	}
	$json = wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG );
	if ( ! is_string( $json ) ) {
		return;
	}
	echo '<script type="application/ld+json">' . $json . '</script>' . "\n";
}

/**
 * Public host of the central IRG site (raginggrannies.org by default).
 * Override via the IRG_PUBLIC_HOST constant in irg-core.
 */
function tbl_irg_public_host(): string {
	return defined( 'IRG_PUBLIC_HOST' ) ? rtrim( IRG_PUBLIC_HOST, '/' ) : 'https://raginggrannies.org';
}

/**
 * Stable @id for the parent IRG Organization on the central site.
 * Matches the Astro frontend's BaseLayout #org id so the parent reference
 * resolves to the same node across surfaces.
 */
function tbl_irg_org_id(): string {
	return tbl_irg_public_host() . '#org';
}

/**
 * Local subsite home URL without trailing slash.
 */
function tbl_local_home(): string {
	return rtrim( home_url( '/' ), '/' );
}

/**
 * Schema: local gaggle as Organization, chapter of the parent IRG Org.
 * Emitted on every subsite page as part of the baseline.
 */
function tbl_jsonld_local_org(): array {
	$home = tbl_local_home();
	return [
		'@context'           => 'https://schema.org',
		'@type'              => 'Organization',
		'@id'                => $home . '#org',
		'name'               => tbl_gaggle_aka(),
		'url'                => $home . '/',
		'parentOrganization' => [ '@id' => tbl_irg_org_id() ],
	];
}

/**
 * Schema: WebSite for the local subsite. Publisher links to the local Org.
 */
function tbl_jsonld_local_website(): array {
	$home = tbl_local_home();
	return [
		'@context'  => 'https://schema.org',
		'@type'     => 'WebSite',
		'@id'       => $home . '#website',
		'url'       => $home . '/',
		'name'      => tbl_gaggle_aka(),
		'publisher' => [ '@id' => $home . '#org' ],
	];
}

/**
 * Schema: ItemList of the gaggle's recent published Actions for the front page.
 * Same query shape as front-page.php (6 most recent posts).
 */
function tbl_jsonld_recent_actions(): array {
	$q = new WP_Query( [
		'post_type'      => 'post',
		'post_status'    => 'publish',
		'posts_per_page' => 6,
		'no_found_rows'  => true,
	] );
	$items    = [];
	$position = 1;
	foreach ( $q->posts as $post ) {
		$items[] = [
			'@type'    => 'ListItem',
			'position' => $position++,
			'item'     => [
				'@type'         => 'NewsArticle',
				'headline'      => get_the_title( $post ),
				'url'           => get_permalink( $post ),
				'datePublished' => get_the_date( 'c', $post ),
			],
		];
	}
	wp_reset_postdata();

	return [
		'@context'        => 'https://schema.org',
		'@type'           => 'ItemList',
		'name'            => 'Recent Actions',
		'numberOfItems'   => count( $items ),
		'itemListElement' => $items,
	];
}

/**
 * Schema: NewsArticle for a single Action post.
 */
function tbl_jsonld_action( WP_Post $post ): array {
	$home   = tbl_local_home();
	$schema = [
		'@context'      => 'https://schema.org',
		'@type'         => 'NewsArticle',
		'headline'      => get_the_title( $post ),
		'url'           => get_permalink( $post ),
		'datePublished' => get_the_date( 'c', $post ),
		'dateModified'  => get_the_modified_date( 'c', $post ),
		'publisher'     => [ '@id' => $home . '#org' ],
		'author'        => [ '@id' => $home . '#org' ],
	];
	if ( has_post_thumbnail( $post ) ) {
		$img = get_the_post_thumbnail_url( $post, 'large' );
		if ( $img ) {
			$schema['image'] = $img;
		}
	}
	$excerpt = get_the_excerpt( $post );
	if ( $excerpt ) {
		$schema['description'] = wp_strip_all_tags( $excerpt );
	}
	return $schema;
}

/**
 * Schema: MusicComposition for a single song page on the subsite.
 *
 * `mainEntityOfPage` points at the central library canonical URL so search
 * engines treat the central Astro version as authoritative (per D042).
 *
 * @param array $song The cached song record from irg_get_subsite_song_by_slug.
 */
function tbl_jsonld_song( array $song ): array {
	$title = (string) ( $song['title'] ?? '' );
	if ( $title === '' ) {
		return [];
	}
	$canonical = (string) ( $song['detail_url'] ?? '' );
	$slug      = (string) ( $song['slug'] ?? '' );
	$local_url = home_url( '/songs/' . rawurlencode( $slug ) . '/' );

	$schema = [
		'@context'   => 'https://schema.org',
		'@type'      => 'MusicComposition',
		'name'       => $title,
		'url'        => $local_url,
		'inLanguage' => 'en',
	];
	if ( $canonical !== '' ) {
		$schema['mainEntityOfPage'] = $canonical;
	}

	$songwriters = array_filter( (array) ( $song['songwriters'] ?? [] ), 'strlen' );
	if ( ! empty( $songwriters ) ) {
		$schema['composer'] = array_values( array_map(
			static fn( $name ) => [ '@type' => 'Person', 'name' => (string) $name ],
			$songwriters
		) );
	}

	$tunes = array_values( array_filter( (array) ( $song['tunes'] ?? [] ), 'strlen' ) );
	if ( ! empty( $tunes ) ) {
		$schema['musicCompositionForm'] = 'Set to the tune of "' . implode( '" / "', array_map( 'strval', $tunes ) ) . '"';
	}

	$issues = array_values( array_filter( (array) ( $song['issues'] ?? [] ), 'strlen' ) );
	if ( ! empty( $issues ) ) {
		$schema['keywords'] = implode( ', ', array_map( 'strval', $issues ) );
	}

	if ( ! empty( $song['lyrics'] ) ) {
		$lyrics_text = wp_strip_all_tags( (string) $song['lyrics'] );
		$lyrics_text = trim( preg_replace( '/\s+/', ' ', $lyrics_text ) );
		if ( $lyrics_text !== '' ) {
			$schema['lyrics'] = [
				'@type' => 'CreativeWork',
				'text'  => $lyrics_text,
			];
		}
	}

	$yt_link = (string) ( $song['youtube_link'] ?? '' );
	if ( $yt_link !== '' && preg_match( '#(?:youtube\.com/(?:watch\?v=|embed/|v/)|youtu\.be/)([A-Za-z0-9_-]{11})#', $yt_link, $m ) ) {
		$schema['recordedAs'] = [
			'@type'    => 'MusicRecording',
			'name'     => $title,
			'embedUrl' => 'https://www.youtube-nocookie.com/embed/' . $m[1],
			'byArtist' => [
				'@type' => 'MusicGroup',
				'name'  => tbl_gaggle_aka(),
			],
		];
	}

	return $schema;
}

/**
 * Dispatcher: emit JSON-LD blocks based on the current request context.
 * Hooked to wp_head at priority 5 so blocks land near the top of <head>.
 */
function tbl_jsonld_dispatch(): void {
	// Baseline on every subsite page.
	tbl_emit_jsonld( tbl_jsonld_local_org() );
	tbl_emit_jsonld( tbl_jsonld_local_website() );

	// Front page → + ItemList of recent Actions.
	if ( is_front_page() ) {
		tbl_emit_jsonld( tbl_jsonld_recent_actions() );
		return;
	}

	// Single Action post → NewsArticle.
	if ( is_singular( 'post' ) ) {
		$post = get_post();
		if ( $post instanceof WP_Post ) {
			tbl_emit_jsonld( tbl_jsonld_action( $post ) );
		}
		return;
	}

	// Single song page (custom rewrite via tbl_song_slug → single-song.php).
	$song_slug = (string) get_query_var( 'tbl_song_slug' );
	if ( $song_slug !== '' && (int) tbl_get_option( 'show_local_songs' ) === 1 ) {
		$gaggle = tbl_gaggle_slug();
		if ( $gaggle !== '' && function_exists( 'irg_get_subsite_song_by_slug' ) ) {
			$song = irg_get_subsite_song_by_slug( $gaggle, $song_slug );
			if ( is_array( $song ) && ! empty( $song ) ) {
				tbl_emit_jsonld( tbl_jsonld_song( $song ) );
			}
		}
	}

	// Other pages (about, photos, contact, etc.): baseline only.
}
add_action( 'wp_head', 'tbl_jsonld_dispatch', 5 );
