<?php
/**
 * Template Name: Contact (form)
 *
 * Submits via admin-ajax (action: tbl_contact). Recipient is derived from
 * the subsite slug: <slug>@raginggrannies.org. Cloudflare Turnstile is
 * rendered when IRG_TURNSTILE_SITEKEY is configured in wp-config; without
 * it, the form falls back to honeypot only.
 *
 * @package the-bulletin-local
 */
get_header();
$gaggle_email     = tbl_gaggle_email();
$page             = get_post();
$has_page_content = $page && trim( wp_strip_all_tags( (string) $page->post_content ) ) !== '';
$turnstile_key    = function_exists( 'irg_turnstile_sitekey' ) ? irg_turnstile_sitekey() : '';
?>

<article class="tbl-page tbl-contact">
	<header class="tbl-page-head">
		<div class="tbl-kicker">Get in touch</div>
		<h1 class="tbl-page-title">Contact Us</h1>
		<?php if ( $has_page_content ) : ?>
			<div class="tbl-page-deck">
				<?php
				// Lets each gaggle replace the default deck text by adding
				// content to their Contact page in WP admin (e.g. links to
				// a separate signup form, hours, etc.). Falls back to the
				// default tagline when the page content is empty.
				echo apply_filters( 'the_content', $page->post_content ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — filtered through the_content; matches how WP renders editor output everywhere else.
				?>
			</div>
		<?php else : ?>
			<p class="tbl-page-deck">Drop us a line. A granny will write back.</p>
		<?php endif; ?>
	</header>

	<form id="tbl-contact-form" class="tbl-form" novalidate>
		<label class="tbl-field" for="tbl-contact-name">
			<span class="tbl-field-label">Your name</span>
			<input type="text" id="tbl-contact-name" name="name" required maxlength="200" autocomplete="name" />
		</label>

		<label class="tbl-field" for="tbl-contact-email">
			<span class="tbl-field-label">Email</span>
			<input type="email" id="tbl-contact-email" name="email" required maxlength="200" autocomplete="email" />
		</label>

		<label class="tbl-field" for="tbl-contact-message">
			<span class="tbl-field-label">Message</span>
			<textarea id="tbl-contact-message" name="message" rows="6" required minlength="10" maxlength="8000"></textarea>
		</label>

		<div class="tbl-hp" aria-hidden="true">
			<label>Don't fill this in if you're human <input type="text" name="hp" tabindex="-1" autocomplete="off" /></label>
		</div>

		<?php if ( $turnstile_key !== '' ) : ?>
			<div class="cf-turnstile" data-sitekey="<?php echo esc_attr( $turnstile_key ); ?>" data-theme="light"></div>
		<?php endif; ?>

		<div class="tbl-form-actions">
			<button type="submit" class="tbl-button">Send message</button>
			<span id="tbl-contact-status" class="tbl-form-status" role="status" aria-live="polite"></span>
		</div>
	</form>

	<p class="tbl-contact-direct">
		Or write directly to <a href="mailto:<?php echo esc_attr( $gaggle_email ); ?>" class="tbl-inline-link"><?php echo esc_html( $gaggle_email ); ?></a>.
	</p>
</article>

<?php get_footer(); ?>
