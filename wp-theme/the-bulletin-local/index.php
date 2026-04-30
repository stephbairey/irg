<?php
/**
 * The catch-all template. WordPress requires every theme to ship an
 * index.php. In practice the more specific templates (front-page, home,
 * archive, single, page, 404) handle every route — this file is the
 * defensive fallback if WP ever falls through to it.
 *
 * @package the-bulletin-local
 */
get_header();
?>

<article class="tbl-page">
	<header class="tbl-page-head">
		<?php if ( is_singular() ) : ?>
			<h1 class="tbl-page-title"><?php the_title(); ?></h1>
		<?php else : ?>
			<div class="tbl-kicker">From the gaggle</div>
			<h1 class="tbl-page-title"><?php echo esc_html( wp_get_document_title() ); ?></h1>
		<?php endif; ?>
	</header>

	<?php if ( have_posts() ) : ?>
		<?php if ( is_singular() ) : ?>
			<?php while ( have_posts() ) : the_post(); ?>
				<div class="tbl-page-body">
					<?php the_content(); ?>
				</div>
			<?php endwhile; ?>
		<?php else : ?>
			<ul class="tbl-action-list">
				<?php while ( have_posts() ) : the_post(); ?>
					<li class="tbl-action-row">
						<?php if ( has_post_thumbnail() ) : ?>
							<a href="<?php the_permalink(); ?>" class="tbl-action-thumb" tabindex="-1" aria-hidden="true">
								<?php the_post_thumbnail( 'medium', [ 'loading' => 'lazy', 'alt' => '' ] ); ?>
							</a>
						<?php endif; ?>
						<div class="tbl-action-body">
							<time class="tbl-action-date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
							<h2 class="tbl-action-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
							<p class="tbl-action-excerpt"><?php echo esc_html( tbl_excerpt( 36 ) ); ?></p>
						</div>
					</li>
				<?php endwhile; ?>
			</ul>

			<nav class="tbl-pager" aria-label="Pagination">
				<?php the_posts_pagination( [ 'prev_text' => '← Newer', 'next_text' => 'Older →' ] ); ?>
			</nav>
		<?php endif; ?>
	<?php else : ?>
		<p class="tbl-muted">Nothing here yet.</p>
	<?php endif; ?>
</article>

<?php get_footer(); ?>
