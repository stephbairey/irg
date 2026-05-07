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
					<li><a href="https://raginggrannies.international/in-the-news/" rel="noopener">News</a></li>
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

<div class="tbl-text-zoom" role="group" aria-label="Text size">
	<button type="button" class="tbl-text-zoom-btn" data-zoom="default" aria-pressed="true" aria-label="Default text size">A</button>
	<button type="button" class="tbl-text-zoom-btn" data-zoom="bigger" aria-pressed="false" aria-label="Bigger text">A<span aria-hidden="true">+</span></button>
	<button type="button" class="tbl-text-zoom-btn" data-zoom="quite-big" aria-pressed="false" aria-label="Quite big text">A<span aria-hidden="true">++</span></button>
</div>

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

// Text-size control: cycles html[data-text-zoom] and persists in
// localStorage. Pre-paint apply lives in header.php; this handler keeps
// the visible state (aria-pressed) in sync after the page loads.
(function () {
	var root = document.documentElement;
	var btns = document.querySelectorAll('.tbl-text-zoom-btn');
	if (!btns.length) return;
	function apply(level) {
		if (level === 'bigger' || level === 'quite-big') {
			root.setAttribute('data-text-zoom', level);
		} else {
			root.removeAttribute('data-text-zoom');
			level = 'default';
		}
		btns.forEach(function (b) {
			b.setAttribute('aria-pressed', String(b.getAttribute('data-zoom') === level));
		});
	}
	var saved = null;
	try { saved = localStorage.getItem('tbl-text-zoom'); } catch (e) {}
	apply(saved);
	btns.forEach(function (b) {
		b.addEventListener('click', function () {
			var level = b.getAttribute('data-zoom');
			apply(level);
			try {
				if (level === 'default') {
					localStorage.removeItem('tbl-text-zoom');
				} else {
					localStorage.setItem('tbl-text-zoom', level);
				}
			} catch (e) {}
		});
	});
})();
</script>

<?php wp_footer(); ?>
</body>
</html>
