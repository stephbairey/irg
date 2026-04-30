<?php
/**
 * Generic archive (date, category, tag). Falls through for anything that
 * isn't the main /actions/ posts page (which uses home.php).
 *
 * @package the-bulletin-local
 */
get_header();
?>

<article class="tbl-page">
	<header class="tbl-page-head">
		<div class="tbl-kicker">Archive</div>
		<h1 class="tbl-page-title"><?php the_archive_title(); ?></h1>
		<?php if ( get_the_archive_description() ) : ?>
			<div class="tbl-page-deck"><?php echo wp_kses_post( get_the_archive_description() ); ?></div>
		<?php endif; ?>
	</header>

	<?php if ( have_posts() ) : ?>
		<ul class="tbl-action-list">
			<?php $idx = 0; while ( have_posts() ) : the_post(); ?>
				<li class="tbl-action-row">
					<?php if ( has_post_thumbnail() ) : ?>
						<a href="<?php the_permalink(); ?>" class="tbl-action-thumb" tabindex="-1" aria-hidden="true">
							<?php the_post_thumbnail( 'medium', [ 'loading' => 'lazy', 'alt' => '' ] ); ?>
						</a>
					<?php else : ?>
						<a href="<?php the_permalink(); ?>" class="tbl-action-thumb tbl-action-thumb--placeholder" tabindex="-1" aria-hidden="true">
							<?php echo tbl_placeholder_icon( $idx ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — static SVG markup. ?>
						</a>
					<?php endif; ?>
					<div class="tbl-action-body">
						<time class="tbl-action-date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
						<h2 class="tbl-action-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
						<p class="tbl-action-excerpt"><?php echo esc_html( tbl_excerpt( 36 ) ); ?></p>
					</div>
				</li>
			<?php $idx++; endwhile; ?>
		</ul>

		<nav class="tbl-pager" aria-label="Pagination">
			<?php the_posts_pagination( [ 'prev_text' => '← Newer', 'next_text' => 'Older →' ] ); ?>
		</nav>
	<?php else : ?>
		<p class="tbl-muted">Nothing here yet.</p>
	<?php endif; ?>
</article>

<?php get_footer(); ?>
