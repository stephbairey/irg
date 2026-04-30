<?php
/**
 * Single Song page (subsite-local view of a song from the central archive).
 *
 * Loaded via the rewrite rule in functions.php:
 *   /songs/<slug>/  →  index.php?tbl_song_slug=<slug>
 *
 * Rendering depends on the show_local_songs toggle being on AND the slug
 * matching a song in the gaggle's cached list. Anything else falls back
 * to a "song not found" panel that points at the central library.
 *
 * @package the-bulletin-local
 */
get_header();

$song_slug = (string) get_query_var( 'tbl_song_slug' );
$enabled   = (int) tbl_get_option( 'show_local_songs' ) === 1;
$gaggle    = tbl_gaggle_slug();
$song      = null;

if ( $enabled && $gaggle !== '' && function_exists( 'irg_get_subsite_song_by_slug' ) ) {
	$song = irg_get_subsite_song_by_slug( $gaggle, $song_slug );
}

$astro_host = defined( 'IRG_PUBLIC_HOST' ) ? rtrim( IRG_PUBLIC_HOST, '/' ) : 'https://raginggrannies.org';
?>

<?php if ( ! $song ) : ?>

	<article class="tbl-page tbl-song-detail">
		<header class="tbl-page-head">
			<div class="tbl-kicker">Song</div>
			<h1 class="tbl-page-title">Song not found</h1>
			<p class="tbl-page-deck">We couldn't find that song attached to this gaggle.</p>
		</header>
		<p class="tbl-songs-cta">
			Try the
			<a href="<?php echo esc_url( $astro_host . '/songs/' ); ?>" rel="noopener">central song library</a>
			or
			<a href="<?php echo esc_url( home_url( '/songs/' ) ); ?>">this gaggle's song list</a>.
		</p>
	</article>

<?php else : ?>

	<article class="tbl-page tbl-song-detail">
		<header class="tbl-page-head">
			<div class="tbl-kicker">From the songbook</div>
			<h1 class="tbl-page-title"><?php echo esc_html( (string) ( $song['title'] ?? '' ) ); ?></h1>
		</header>

		<div class="tbl-song-meta-block">
			<?php if ( ! empty( $song['year'] ) ) : ?>
				<div class="tbl-song-meta-item">
					<span class="tbl-song-meta-label">Year</span>
					<span><?php echo esc_html( (string) $song['year'] ); ?></span>
				</div>
			<?php endif; ?>

			<?php if ( ! empty( $song['songwriters'] ) ) : ?>
				<div class="tbl-song-meta-item">
					<span class="tbl-song-meta-label">Songwriter</span>
					<span>
						<?php
						$first = true;
						foreach ( (array) $song['songwriters'] as $sw ) :
							if ( ! $first ) {
								echo ' &amp; ';
							}
							$first = false;
							?>
							<a href="<?php echo esc_url( $astro_host . '/songs/?songwriter=' . rawurlencode( (string) $sw ) ); ?>" rel="noopener"><?php echo esc_html( (string) $sw ); ?></a>
						<?php endforeach; ?>
					</span>
				</div>
			<?php endif; ?>

			<?php if ( ! empty( $song['tunes'] ) ) : ?>
				<div class="tbl-song-meta-item">
					<span class="tbl-song-meta-label">Tune</span>
					<span>
						<?php
						$first = true;
						foreach ( (array) $song['tunes'] as $t ) :
							if ( ! $first ) {
								echo ' / ';
							}
							$first = false;
							?>
							<a href="<?php echo esc_url( $astro_host . '/songs/?tune=' . rawurlencode( (string) $t ) ); ?>" rel="noopener"><?php echo esc_html( (string) $t ); ?></a>
						<?php endforeach; ?>
					</span>
				</div>
			<?php endif; ?>

			<?php if ( ! empty( $song['issues'] ) ) : ?>
				<div class="tbl-song-meta-item tbl-song-meta-issues">
					<span class="tbl-song-meta-label">Categories</span>
					<span class="tbl-issue-chips">
						<?php foreach ( (array) $song['issues'] as $issue ) : ?>
							<a class="tbl-issue-chip" href="<?php echo esc_url( $astro_host . '/songs/?issue=' . rawurlencode( (string) $issue ) ); ?>" rel="noopener"><?php echo esc_html( (string) $issue ); ?></a>
						<?php endforeach; ?>
					</span>
				</div>
			<?php endif; ?>
		</div>

		<?php if ( ! empty( $song['lyrics'] ) ) : ?>
			<div class="tbl-song-lyrics"><?php echo wp_kses_post( (string) $song['lyrics'] ); ?></div>
		<?php else : ?>
			<p class="tbl-muted">Lyrics not yet entered for this song.</p>
		<?php endif; ?>

		<?php
		$yt_link = (string) ( $song['youtube_link'] ?? '' );
		$yt_id   = '';
		if ( $yt_link !== '' && preg_match( '#(?:youtube\.com/(?:watch\?v=|embed/|v/)|youtu\.be/)([A-Za-z0-9_-]{11})#', $yt_link, $m ) ) {
			$yt_id = $m[1];
		}
		?>
		<?php if ( $yt_id !== '' ) : ?>
			<div class="tbl-song-video">
				<iframe
					src="<?php echo esc_url( 'https://www.youtube-nocookie.com/embed/' . $yt_id ); ?>"
					title="<?php echo esc_attr( (string) ( $song['title'] ?? '' ) ); ?>"
					allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowfullscreen
					loading="lazy"
				></iframe>
			</div>
		<?php endif; ?>

		<aside class="tbl-song-aside">
			<a class="tbl-song-aside-link" href="<?php echo esc_url( $astro_host . '/songsheets/' . rawurlencode( (string) ( $song['slug'] ?? '' ) ) . '.pdf' ); ?>" rel="noopener">
				Printable songsheet available on the international site &rarr;
			</a>
			<a class="tbl-song-aside-link" href="<?php echo esc_url( (string) ( $song['detail_url'] ?? '' ) ); ?>" rel="noopener">
				View this song in the central library &rarr;
			</a>
			<a class="tbl-song-aside-link" href="<?php echo esc_url( home_url( '/songs/' ) ); ?>">
				&larr; Back to all songs
			</a>
		</aside>
	</article>

<?php endif; ?>

<?php get_footer(); ?>
