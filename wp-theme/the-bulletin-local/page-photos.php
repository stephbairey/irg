<?php
/**
 * Template Name: Photos (auto-gallery)
 *
 * Auto-generates a responsive grid of every image used in published Action
 * posts: featured images plus images embedded in the post content (matched
 * via the wp-image-NN class Gutenberg writes onto every inline image).
 *
 * @package the-bulletin-local
 */
get_header();

$ids = tbl_collect_action_attachment_ids();
?>

<article class="tbl-page">
	<header class="tbl-page-head">
		<div class="tbl-kicker">In the field</div>
		<h1 class="tbl-page-title">Photos</h1>
		<p class="tbl-page-deck">Pulled automatically from every Action we've published.</p>
	</header>

	<?php if ( empty( $ids ) ) : ?>
		<p class="tbl-muted">No photos yet. Add a featured image or an inline image to an Action and it'll show up here.</p>
	<?php else : ?>
		<div class="tbl-photo-grid">
			<?php
			foreach ( $ids as $aid ) :
				$full    = wp_get_attachment_image_url( $aid, 'full' );
				$thumb   = wp_get_attachment_image_url( $aid, 'medium_large' );
				$caption = wp_get_attachment_caption( $aid );
				$alt     = (string) get_post_meta( $aid, '_wp_attachment_image_alt', true );
				if ( ! $full || ! $thumb ) {
					continue;
				}
				?>
				<button
					type="button"
					class="tbl-photo"
					data-full="<?php echo esc_attr( $full ); ?>"
					data-caption="<?php echo esc_attr( $caption ?: '' ); ?>"
					aria-label="<?php echo esc_attr( $alt !== '' ? $alt : 'Open photo' ); ?>"
				>
					<img src="<?php echo esc_url( $thumb ); ?>" alt="<?php echo esc_attr( $alt ); ?>" loading="lazy" />
				</button>
			<?php endforeach; ?>
		</div>

		<div id="tbl-lightbox" class="tbl-lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" hidden>
			<button type="button" class="tbl-lightbox-close" aria-label="Close">×</button>
			<img class="tbl-lightbox-image" src="" alt="" />
			<p class="tbl-lightbox-caption" hidden></p>
		</div>
	<?php endif; ?>
</article>

<?php get_footer(); ?>
