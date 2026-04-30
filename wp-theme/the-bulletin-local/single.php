<?php
/**
 * Single Action post. Featured image (or bundled default) renders as a
 * polaroid floated to the right of the body copy; copy flows around it.
 *
 * @package the-bulletin-local
 */
get_header();
?>

<?php while ( have_posts() ) : the_post(); ?>
	<article id="post-<?php the_ID(); ?>" <?php post_class( 'tbl-single' ); ?>>
		<header class="tbl-single-head">
			<div class="tbl-kicker"><?php echo esc_html( tbl_actions_label( false ) ); ?></div>
			<h1 class="tbl-single-title"><?php the_title(); ?></h1>
			<time class="tbl-single-date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
		</header>

		<div class="tbl-single-body">
			<figure class="tbl-feature-polaroid<?php echo tbl_action_has_real_feature() ? '' : ' tbl-feature-polaroid--default'; ?>">
				<img src="<?php echo esc_url( tbl_action_feature_url( 'large' ) ); ?>" alt="" loading="eager" />
			</figure>

			<?php the_content(); ?>
		</div>

		<nav class="tbl-prev-next" aria-label="More Actions">
			<div class="tbl-prev"><?php previous_post_link( '%link', '← %title' ); ?></div>
			<div class="tbl-next"><?php next_post_link( '%link', '%title →' ); ?></div>
		</nav>
	</article>
<?php endwhile; ?>

<?php get_footer(); ?>
