<?php
/**
 * Default page template.
 *
 * @package the-bulletin-local
 */
get_header();
?>

<?php while ( have_posts() ) : the_post(); ?>
	<article id="page-<?php the_ID(); ?>" <?php post_class( 'tbl-page' ); ?>>
		<header class="tbl-page-head">
			<h1 class="tbl-page-title"><?php the_title(); ?></h1>
		</header>
		<div class="tbl-page-body">
			<?php the_content(); ?>
		</div>
	</article>
<?php endwhile; ?>

<?php get_footer(); ?>
