<?php
/**
 * Footer — dark ink, three columns: Brand / From the Network / This Gaggle.
 *
 * @package the-bulletin-local
 */
$year = current_time( 'Y' );
?>
</main>

<footer class="tbl-footer" role="contentinfo">
	<div class="tbl-footer-inner">
		<div class="tbl-footer-grid">
			<div class="tbl-footer-brand">
				<div class="tbl-footer-brand-mark">
					<span class="tbl-footer-logo" aria-hidden="true"><?php echo tbl_logo_svg( 'full' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — local SVG file, content trusted ?></span>
					<b class="tbl-footer-wordmark"><?php echo esc_html( tbl_gaggle_aka() ); ?></b>
				</div>
				<p class="tbl-footer-tagline">Part of the international disorganization of Raging Grannies.</p>
			</div>

			<div class="tbl-footer-col">
				<h2>From the Network</h2>
				<ul>
					<li><a href="https://raginggrannies.international/songs/" rel="noopener">Song Library</a></li>
					<li><a href="https://raginggrannies.international/find-a-gaggle/" rel="noopener">Find a Gaggle</a></li>
					<li><a href="https://raginggrannies.international/faq/" rel="noopener">FAQ</a></li>
					<li><a href="https://raginggrannies.international/in-the-news/" rel="noopener">In the News</a></li>
				</ul>
			</div>

			<div class="tbl-footer-col">
				<h2>This Gaggle</h2>
				<ul>
					<li><a href="<?php echo esc_url( home_url( '/about/' ) ); ?>">About Us</a></li>
					<li><a href="<?php echo esc_url( home_url( '/actions/' ) ); ?>">Recent Actions</a></li>
					<li><a href="<?php echo esc_url( home_url( '/photos/' ) ); ?>">Photo Gallery</a></li>
					<li><a href="<?php echo esc_url( home_url( '/contact/' ) ); ?>">Connect with Us</a></li>
				</ul>
			</div>
		</div>

		<div class="tbl-footer-bottom">
			<span>&copy; <?php echo esc_html( (string) $year ); ?> <?php echo esc_html( tbl_gaggle_aka() ); ?></span>
			<span class="tbl-footer-meta">
				<a href="https://raginggrannies.international/privacy/" rel="noopener">Privacy</a>
				<span aria-hidden="true">·</span>
				<span>Made with spirit, by volunteers.</span>
			</span>
		</div>
	</div>
</footer>

<script>
// Exclusive accordion: when a <details> in the post body opens, close its
// siblings in the same content area. Native disclosure semantics
// preserved (keyboard, links to anchors inside, etc.); we only react to
// the toggle event.
(function () {
	var bodies = document.querySelectorAll('.tbl-single-body, .tbl-page-body');
	bodies.forEach(function (body) {
		var ds = body.querySelectorAll('details');
		if (ds.length < 2) return;
		ds.forEach(function (d) {
			d.addEventListener('toggle', function () {
				if (!d.open) return;
				ds.forEach(function (other) { if (other !== d) other.open = false; });
			});
		});
	});
})();
</script>

<?php wp_footer(); ?>
</body>
</html>
