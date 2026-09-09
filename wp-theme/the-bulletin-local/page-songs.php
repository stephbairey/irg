<?php
/**
 * Template Name: Songs (subsite-local list)
 *
 * Lists songs queried cross-network from the main site's song archive,
 * filtered by the gaggle taxonomy term whose slug matches this subsite.
 * Detail links go out to the canonical Astro library at
 * IRG_PUBLIC_HOST/songs/<slug>/.
 *
 * @package the-bulletin-local
 */
get_header();

$enabled = (int) tbl_get_option( 'show_local_songs' ) === 1;
// Central library link — unfiltered for gaggles hidden from the central
// archive (their ?gaggle= view would be empty), otherwise pre-filtered.
$central = tbl_central_songs_url();
?>

<article class="tbl-page tbl-songs">
	<header class="tbl-page-head">
		<div class="tbl-kicker">From the Song Library</div>
		<h1 class="tbl-page-title">Songs</h1>
		<p class="tbl-page-deck">Songs we've sung, written, and added to the central library.</p>
	</header>

	<?php while ( have_posts() ) : the_post(); ?>
		<?php $intro = get_the_content(); ?>
		<?php if ( trim( wp_strip_all_tags( $intro ) ) !== '' ) : ?>
			<div class="tbl-page-body tbl-songs-intro"><?php the_content(); ?></div>
		<?php endif; ?>
	<?php endwhile; ?>

	<?php if ( ! $enabled ) : ?>

		<p class="tbl-songs-cta">
			Our songs live in the central song library.
			<a href="<?php echo esc_url( $central ); ?>" rel="noopener">Browse them there</a>.
		</p>

	<?php else : ?>

		<?php
		$songs = tbl_subsite_songs();

		// Search box: filters this gaggle's list by title, songwriter, tune,
		// or the lyrics excerpt before pagination. Plain GET so it works
		// without JavaScript and the URL can be shared.
		$q = isset( $_GET['q'] ) ? trim( sanitize_text_field( wp_unslash( (string) $_GET['q'] ) ) ) : '';
		if ( $q !== '' ) {
			$needle = function_exists( 'mb_strtolower' ) ? mb_strtolower( $q ) : strtolower( $q );
			$songs  = array_values( array_filter( $songs, static function ( $song ) use ( $needle ) {
				$hay = implode( ' ', [
					(string) ( $song['title'] ?? '' ),
					implode( ' ', (array) ( $song['songwriters'] ?? [] ) ),
					implode( ' ', (array) ( $song['tunes'] ?? [] ) ),
					(string) ( $song['lyrics_excerpt'] ?? '' ),
				] );
				$hay = function_exists( 'mb_strtolower' ) ? mb_strtolower( $hay ) : strtolower( $hay );
				return strpos( $hay, $needle ) !== false;
			} ) );
		}
		$total = count( $songs );

		$per_page = 20;
		$paged    = max( 1, (int) get_query_var( 'paged' ) );
		if ( $paged === 1 && isset( $_GET['paged'] ) ) {
			$paged = max( 1, (int) $_GET['paged'] );
		}
		$pages = (int) max( 1, (int) ceil( $total / $per_page ) );
		if ( $paged > $pages ) {
			$paged = $pages;
		}
		$start = ( $paged - 1 ) * $per_page;
		$slice = array_slice( $songs, $start, $per_page );
		?>

		<form class="tbl-songs-search" method="get" action="<?php echo esc_url( get_permalink() ); ?>" role="search">
			<label class="tbl-field" for="tbl-songs-q">
				<span class="tbl-field-label">Search our songs</span>
				<span class="tbl-songs-search-row">
					<input type="search" id="tbl-songs-q" name="q" value="<?php echo esc_attr( $q ); ?>" placeholder="Title, songwriter, tune, or a line you remember" enterkeyhint="search" />
					<button type="submit" class="tbl-button tbl-songs-search-btn" aria-label="Search">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="20" y1="20" x2="16.5" y2="16.5"/></svg>
					</button>
				</span>
			</label>
			<?php if ( $q !== '' ) : ?>
				<p class="tbl-songs-search-status">
					<?php echo esc_html( sprintf( _n( '%d song matches', '%d songs match', $total, 'the-bulletin-local' ), $total ) ); ?>
					&ldquo;<?php echo esc_html( $q ); ?>&rdquo;.
					<a href="<?php echo esc_url( get_permalink() ); ?>">Show all</a>
				</p>
			<?php endif; ?>
		</form>

		<?php if ( $total === 0 && $q !== '' ) : ?>

			<p class="tbl-muted">
				Nothing here matches that. Try fewer words, or search the
				<a href="<?php echo esc_url( add_query_arg( 'q', $q, $central ) ); ?>" rel="noopener">central library</a>.
			</p>

		<?php elseif ( $total === 0 ) : ?>

			<p class="tbl-muted">
				No songs tagged with this gaggle yet. Visit the
				<a href="<?php echo esc_url( $central ); ?>" rel="noopener">central library</a>
				or check this page's settings.
			</p>

		<?php else : ?>

			<p class="tbl-songs-cta">
				Searching for a different song?
				<a href="<?php echo esc_url( $central ); ?>" rel="noopener">Browse the central library</a>.
			</p>

			<ol class="tbl-song-list">
				<?php foreach ( $slice as $song ) : ?>
					<?php
					$meta_parts = [];
					if ( ! empty( $song['year'] ) ) {
						$meta_parts[] = esc_html( (string) $song['year'] );
					}
					if ( ! empty( $song['songwriters'] ) ) {
						$meta_parts[] = esc_html( implode( ' & ', (array) $song['songwriters'] ) );
					}
					if ( ! empty( $song['tunes'] ) ) {
						$meta_parts[] = '<em>to the tune of ' . esc_html( implode( ' / ', (array) $song['tunes'] ) ) . '</em>';
					}
					$local_url = home_url( '/songs/' . rawurlencode( (string) ( $song['slug'] ?? '' ) ) . '/' );
					?>
					<li class="tbl-song-row">
						<a href="<?php echo esc_url( $local_url ); ?>" class="tbl-song-link">
							<h2 class="tbl-song-title"><?php echo esc_html( (string) ( $song['title'] ?? '' ) ); ?></h2>
							<?php if ( $meta_parts ) : ?>
								<div class="tbl-song-meta"><?php echo implode( ' · ', $meta_parts ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — parts already escaped above. ?></div>
							<?php endif; ?>
							<?php if ( ! empty( $song['lyrics_excerpt'] ) ) : ?>
								<p class="tbl-song-excerpt"><?php echo esc_html( (string) $song['lyrics_excerpt'] ); ?></p>
							<?php endif; ?>
							<?php if ( ! empty( $song['issues'] ) ) : ?>
								<div class="tbl-issue-chips">
									<?php foreach ( (array) $song['issues'] as $issue ) : ?>
										<span class="tbl-issue-chip"><?php echo esc_html( (string) $issue ); ?></span>
									<?php endforeach; ?>
								</div>
							<?php endif; ?>
						</a>
					</li>
				<?php endforeach; ?>
			</ol>

			<?php if ( $pages > 1 ) : ?>
				<?php
				$base = get_permalink();
				if ( $q !== '' ) {
					$base = add_query_arg( 'q', $q, $base );
				}
				$prev_url = $paged > 1 ? add_query_arg( 'paged', $paged - 1, $base ) : '';
				$next_url = $paged < $pages ? add_query_arg( 'paged', $paged + 1, $base ) : '';
				?>
				<nav class="tbl-pager" aria-label="Pagination">
					<?php if ( $prev_url ) : ?>
						<a class="page-numbers" href="<?php echo esc_url( $prev_url ); ?>">← Previous</a>
					<?php endif; ?>
					<span class="page-numbers current"><?php echo esc_html( $paged . ' / ' . $pages ); ?></span>
					<?php if ( $next_url ) : ?>
						<a class="page-numbers" href="<?php echo esc_url( $next_url ); ?>">Next →</a>
					<?php endif; ?>
				</nav>
			<?php endif; ?>

		<?php endif; ?>

	<?php endif; ?>
</article>

<?php get_footer(); ?>
