<?php
/**
 * 404 — page not found.
 *
 * @package the-bulletin-local
 */
get_header();
?>

<article class="tbl-page tbl-404">
	<header class="tbl-page-head">
		<div class="tbl-kicker">Page not found</div>
		<h1 class="tbl-page-title">Looks like that page wandered off.</h1>
		<p class="tbl-page-deck">Check the URL, or try one of these.</p>
	</header>

	<ul class="tbl-404-links">
		<li><a href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a></li>
		<li><a href="<?php echo esc_url( home_url( '/actions/' ) ); ?>">Actions</a></li>
		<li><a href="<?php echo esc_url( home_url( '/photos/' ) ); ?>">Photos</a></li>
		<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Contact</a></li>
	</ul>
</article>

<?php get_footer(); ?>
