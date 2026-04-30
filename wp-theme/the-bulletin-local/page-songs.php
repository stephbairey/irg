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
$slug    = tbl_gaggle_slug();
$central = $slug !== '' ? 'https://raginggrannies.international/songs/?gaggle=' . rawurlencode( $slug ) : 'https://raginggrannies.international/songs/';
?>

<article class="tbl-page tbl-songs">
	<header class="tbl-page-head">
		<div class="tbl-kicker">From the songbook</div>
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

		<?php if ( $total === 0 ) : ?>

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
