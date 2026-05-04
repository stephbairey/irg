<?php
/**
 * Template Name: Videos (YouTube uploads grid)
 *
 * If a YouTube channel URL is set in Gaggle Settings, fetch the channel's
 * latest uploads via YouTube's public RSS feed and embed them as a grid.
 * Falls back to a single CTA link when the URL hasn't been set or the
 * channel ID can't be resolved.
 *
 * @package the-bulletin-local
 */
get_header();

$yt_url     = tbl_get_option( 'youtube_channel_url' );
$videos     = [];
$channel_id = '';
if ( $yt_url !== '' ) {
	$channel_id = tbl_resolve_youtube_channel_id( $yt_url );
	if ( $channel_id !== '' ) {
		$videos = tbl_fetch_youtube_videos( $channel_id, 6 );
	}
}
?>

<article class="tbl-page">
	<header class="tbl-page-head">
		<div class="tbl-kicker">On camera</div>
		<h1 class="tbl-page-title">Videos</h1>
		<p class="tbl-page-deck">Performances and footage from the gaggle.</p>
	</header>

	<?php if ( empty( $videos ) ) : ?>
		<?php if ( $yt_url === '' ) : ?>
			<p class="tbl-muted">Once we add a YouTube channel, it'll appear here.</p>
		<?php else : ?>
			<div class="tbl-video-card">
				<p>Watch us on YouTube. Subscribe to follow new uploads.</p>
				<a href="<?php echo esc_url( $yt_url ); ?>" class="tbl-button" target="_blank" rel="noopener noreferrer">
					Visit our YouTube channel <span aria-hidden="true">→</span>
				</a>
			</div>
		<?php endif; ?>
	<?php else : ?>
		<div class="tbl-video-grid">
			<?php foreach ( $videos as $v ) : ?>
				<div class="tbl-video-item">
					<div class="tbl-video-frame">
						<iframe
							src="https://www.youtube-nocookie.com/embed/<?php echo esc_attr( $v['videoId'] ); ?>"
							title="<?php echo esc_attr( $v['title'] ); ?>"
							allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowfullscreen
							loading="lazy"
							referrerpolicy="strict-origin-when-cross-origin"
						></iframe>
					</div>
					<p class="tbl-video-title"><?php echo esc_html( $v['title'] ); ?></p>
				</div>
			<?php endforeach; ?>
		</div>
		<p class="tbl-video-cta">
			<a href="<?php echo esc_url( $yt_url ); ?>" class="tbl-button" target="_blank" rel="noopener noreferrer">
				More on our YouTube channel <span aria-hidden="true">→</span>
			</a>
		</p>
	<?php endif; ?>
</article>

<?php get_footer(); ?>
