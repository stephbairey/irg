<?php
/**
 * Template Name: Videos (YouTube channel link)
 *
 * If a YouTube channel URL is set in Gaggle Settings, surface it here.
 * Direct channel embeds aren't reliable across YouTube's products, so this
 * page leans into a clear CTA + the page link rather than an iframe that
 * might break.
 *
 * @package the-bulletin-local
 */
get_header();
$yt = tbl_get_option( 'youtube_channel_url' );
?>

<article class="tbl-page">
	<header class="tbl-page-head">
		<div class="tbl-kicker">On camera</div>
		<h1 class="tbl-page-title">Videos</h1>
		<p class="tbl-page-deck">Performances and footage from the gaggle.</p>
	</header>

	<?php if ( $yt === '' ) : ?>
		<p class="tbl-muted">Once we add a YouTube channel, it'll appear here.</p>
	<?php else : ?>
		<div class="tbl-video-card">
			<p>Watch us on YouTube. Subscribe to follow new uploads.</p>
			<a href="<?php echo esc_url( $yt ); ?>" class="tbl-button" target="_blank" rel="noopener noreferrer">
				Visit our YouTube channel <span aria-hidden="true">→</span>
			</a>
		</div>
	<?php endif; ?>
</article>

<?php get_footer(); ?>
