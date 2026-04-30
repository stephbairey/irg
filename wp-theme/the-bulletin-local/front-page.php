<?php
/**
 * Front page — two-column polaroid hero + Recent Actions grid.
 *
 * @package the-bulletin-local
 */
get_header();
?>

<section class="tbl-hero">
	<div class="tbl-hero-grid">
		<div class="tbl-hero-left">
			<div class="tbl-hero-eyebrow">Local Women <span class="tbl-hero-dot" aria-hidden="true"></span> Local Gaggle</div>
			<h1 class="tbl-hero-title"><?php echo esc_html( tbl_gaggle_name() ); ?> <em>Raging Grannies</em></h1>
			<p class="tbl-hero-tagline"><?php echo esc_html( tbl_tagline() ); ?></p>
		</div>
		<div class="tbl-hero-right">
			<figure class="tbl-polaroid">
				<img src="<?php echo esc_url( tbl_hero_image_url() ); ?>" alt="<?php echo esc_attr( tbl_gaggle_aka() ); ?>" />
			</figure>
		</div>
	</div>
</section>

<?php
$latest = new WP_Query( [
	'post_type'      => 'post',
	'post_status'    => 'publish',
	'posts_per_page' => 6,
	'no_found_rows'  => true,
] );
?>

<section class="tbl-actions">
	<div class="tbl-actions-head">
		<div>
			<h2 class="tbl-actions-title">Recent <em>Actions</em></h2>
			<p class="tbl-actions-sub">Where we've been showing up, lately.</p>
		</div>
		<a href="<?php echo esc_url( home_url( '/actions/' ) ); ?>" class="tbl-actions-archive">
			Full Archive <span class="tbl-arrow" aria-hidden="true">&rarr;</span>
		</a>
	</div>

	<?php if ( $latest->have_posts() ) : ?>
		<div class="tbl-actions-grid">
			<?php
			$idx = 0;
			while ( $latest->have_posts() ) :
				$latest->the_post();
				?>
				<a class="tbl-action-card" href="<?php the_permalink(); ?>">
					<?php if ( has_post_thumbnail() ) : ?>
						<div class="tbl-action-img">
							<?php the_post_thumbnail( 'medium_large', [ 'loading' => 'lazy', 'alt' => '' ] ); ?>
						</div>
					<?php else : ?>
						<div class="tbl-action-img tbl-action-img--placeholder" aria-hidden="true">
							<?php echo tbl_placeholder_icon( $idx ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — static SVG markup. ?>
						</div>
					<?php endif; ?>
					<time class="tbl-action-date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date( 'F j, Y' ) ); ?></time>
					<h3 class="tbl-action-title"><?php the_title(); ?></h3>
					<p class="tbl-action-excerpt"><?php echo esc_html( tbl_excerpt( 30 ) ); ?></p>
					<span class="tbl-action-more">See more <span class="tbl-arrow" aria-hidden="true">&rarr;</span></span>
				</a>
				<?php
				$idx++;
			endwhile;
			?>
		</div>
	<?php else : ?>
		<p class="tbl-muted">No Actions published yet. Check back soon.</p>
	<?php endif; ?>

	<?php wp_reset_postdata(); ?>
</section>

<?php get_footer(); ?>
