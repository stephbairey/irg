<?php
/**
 * Gaggle Settings — single options page under Appearance.
 *
 * @package the-bulletin-local
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const TBL_OPTIONS_KEY  = 'tbl_options';
const TBL_OPTIONS_PAGE = 'tbl-options';

/**
 * Register the menu entry under Appearance.
 */
function tbl_register_options_menu(): void {
	add_theme_page(
		'Gaggle Settings',
		'Gaggle Settings',
		'manage_options',
		TBL_OPTIONS_PAGE,
		'tbl_render_options_page'
	);
}
add_action( 'admin_menu', 'tbl_register_options_menu' );

/**
 * Register the option blob and three sanitized fields. Stored as a single
 * option array under `tbl_options`.
 */
function tbl_register_options(): void {
	register_setting(
		'tbl_options_group',
		TBL_OPTIONS_KEY,
		[
			'type'              => 'array',
			'sanitize_callback' => 'tbl_sanitize_options',
			'default'           => [
				'logo_id'             => 0,
				'logo_has_name'       => 0,
				'footer_logo_id'      => 0,
				'hero_image_id'       => 0,
				'display_name'        => '',
				'youtube_channel_url' => '',
				'facebook_url'        => '',
				'tagline'             => '',
				'show_local_songs'    => 0,
				'hide_action_images'  => 0,
			],
		]
	);

	add_settings_section(
		'tbl_options_main',
		'',
		'__return_null',
		TBL_OPTIONS_PAGE
	);

	add_settings_field( 'logo_id',             'Gaggle logo',                  'tbl_field_logo',              TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'logo_has_name',       'Logo and name',                'tbl_field_logo_has_name',     TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'footer_logo_id',      'Light logo for the footer',    'tbl_field_footer_logo',       TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'hero_image_id',       'Hero Image',                   'tbl_field_hero_image',        TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'display_name',        'Full name',                    'tbl_field_display_name',      TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'youtube_channel_url', 'YouTube Channel URL',          'tbl_field_youtube_url',       TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'facebook_url',        'Facebook Page URL',            'tbl_field_facebook_url',      TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'tagline',             'Tagline',                      'tbl_field_tagline',           TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'show_local_songs',    'Display songs on this subsite','tbl_field_show_local_songs',  TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'hide_action_images',  'Photos on Action lists',      'tbl_field_hide_action_images',TBL_OPTIONS_PAGE, 'tbl_options_main' );
}
add_action( 'admin_init', 'tbl_register_options' );

/**
 * Sanitize options on save.
 */
function tbl_sanitize_options( $input ): array {
	$out = [
		'logo_id'             => 0,
		'logo_has_name'       => 0,
		'footer_logo_id'      => 0,
		'hero_image_id'       => 0,
		'display_name'        => '',
		'youtube_channel_url' => '',
		'facebook_url'        => '',
		'tagline'             => '',
		'show_local_songs'    => 0,
		'hide_action_images'  => 0,
	];
	if ( ! is_array( $input ) ) {
		return $out;
	}
	if ( isset( $input['hero_image_id'] ) ) {
		$out['hero_image_id'] = (int) $input['hero_image_id'];
	}
	if ( ! empty( $input['logo_id'] ) ) {
		$logo_id = (int) $input['logo_id'];
		if ( $logo_id > 0 && wp_attachment_is_image( $logo_id ) ) {
			$out['logo_id'] = $logo_id;
		} else {
			add_settings_error(
				TBL_OPTIONS_KEY,
				'tbl_logo_invalid',
				'The gaggle logo must be an image file (PNG, JPG, WebP or GIF). The network mark will be used instead.',
				'error'
			);
		}
	}
	$out['logo_has_name'] = ! empty( $input['logo_has_name'] ) ? 1 : 0;
	if ( ! empty( $input['footer_logo_id'] ) ) {
		$footer_logo_id = (int) $input['footer_logo_id'];
		if ( $footer_logo_id > 0 && wp_attachment_is_image( $footer_logo_id ) ) {
			$out['footer_logo_id'] = $footer_logo_id;
		} else {
			add_settings_error(
				TBL_OPTIONS_KEY,
				'tbl_footer_logo_invalid',
				'The light footer logo must be an image file (PNG, JPG, WebP or GIF). The regular logo will be used in the footer instead.',
				'error'
			);
		}
	}
	if ( isset( $input['youtube_channel_url'] ) ) {
		$url = esc_url_raw( trim( (string) $input['youtube_channel_url'] ) );
		// Light validation: must be a YouTube URL if provided.
		if ( $url === '' || preg_match( '#youtube\.com|youtu\.be#i', $url ) ) {
			$out['youtube_channel_url'] = $url;
		} else {
			add_settings_error(
				TBL_OPTIONS_KEY,
				'tbl_youtube_invalid',
				'YouTube Channel URL must be a youtube.com or youtu.be URL.',
				'error'
			);
		}
	}
	if ( isset( $input['facebook_url'] ) ) {
		$fb = esc_url_raw( trim( (string) $input['facebook_url'] ) );
		// Light validation: must be a Facebook URL if provided.
		if ( $fb === '' || preg_match( '#^https?://([a-z0-9-]+\.)?(facebook\.com|fb\.com|fb\.me)/#i', $fb ) ) {
			$out['facebook_url'] = $fb;
		} else {
			add_settings_error(
				TBL_OPTIONS_KEY,
				'tbl_facebook_invalid',
				'Facebook Page URL must be a facebook.com address.',
				'error'
			);
		}
	}
	if ( isset( $input['tagline'] ) ) {
		$out['tagline'] = sanitize_text_field( (string) $input['tagline'] );
	}
	if ( isset( $input['display_name'] ) ) {
		$out['display_name'] = sanitize_text_field( (string) $input['display_name'] );
	}
	$out['show_local_songs'] = ! empty( $input['show_local_songs'] ) ? 1 : 0;
	$out['hide_action_images'] = empty( $input['hide_action_images'] ) ? 0 : 1;
	return $out;
}

/* ---- field renderers ---------------------------------------------------- */

/**
 * Media picker for the gaggle's own logo (D081). Any size or shape; the
 * front end fits it with CSS. 0 means "use the shared network mark".
 */
function tbl_field_logo(): void {
	$opts = get_option( TBL_OPTIONS_KEY, [] );
	$id   = isset( $opts['logo_id'] ) ? (int) $opts['logo_id'] : 0;
	$src  = $id ? wp_get_attachment_image_url( $id, 'medium' ) : '';

	wp_enqueue_media();
	?>
	<div class="tbl-logo-field">
		<input type="hidden" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[logo_id]" id="tbl_logo_id" value="<?php echo esc_attr( (string) $id ); ?>" />
		<div class="tbl-logo-preview" style="margin-bottom:10px">
			<?php if ( $src ) : ?>
				<img src="<?php echo esc_url( $src ); ?>" alt="" style="max-width:240px;max-height:120px;width:auto;height:auto;border:1px solid #ccc;background:#fff;padding:6px" />
			<?php else : ?>
				<em style="color:#666">No gaggle logo set. The shared Raging Grannies mark will be used.</em>
			<?php endif; ?>
		</div>
		<button type="button" class="button" id="tbl_logo_pick">Choose logo</button>
		<button type="button" class="button" id="tbl_logo_clear" <?php echo $id ? '' : 'style="display:none"'; ?>>Clear</button>
		<p class="description">Shown in the header and footer of every page. PNG or JPG with a transparent or white background works best. Any shape is fine; the site fits it. Leave empty to keep the shared Raging Grannies mark.</p>
	</div>
	<script>
		(function () {
			var pick = document.getElementById('tbl_logo_pick');
			var clear = document.getElementById('tbl_logo_clear');
			var idEl = document.getElementById('tbl_logo_id');
			var preview = document.querySelector('.tbl-logo-preview');
			if (!pick || !idEl || !preview) return;

			var frame;
			pick.addEventListener('click', function () {
				if (frame) { frame.open(); return; }
				frame = wp.media({
					title: 'Select your gaggle logo',
					button: { text: 'Use this logo' },
					library: { type: 'image' },
					multiple: false
				});
				frame.on('select', function () {
					var att = frame.state().get('selection').first().toJSON();
					idEl.value = att.id;
					var src = (att.sizes && att.sizes.medium && att.sizes.medium.url) ? att.sizes.medium.url : att.url;
					preview.innerHTML = '<img src="' + src + '" alt="" style="max-width:240px;max-height:120px;width:auto;height:auto;border:1px solid #ccc;background:#fff;padding:6px" />';
					if (clear) clear.style.display = '';
				});
				frame.open();
			});
			if (clear) clear.addEventListener('click', function () {
				idEl.value = '0';
				preview.innerHTML = '<em style="color:#666">No gaggle logo set. The shared Raging Grannies mark will be used.</em>';
				clear.style.display = 'none';
			});
		})();
	</script>
	<?php
}

/**
 * Checkbox: the uploaded logo already contains the gaggle's name, so hide
 * the text beside it in the header and footer.
 */
function tbl_field_logo_has_name(): void {
	$opts    = get_option( TBL_OPTIONS_KEY, [] );
	$checked = ! empty( $opts['logo_has_name'] );
	?>
	<label>
		<input type="checkbox" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[logo_has_name]" value="1" <?php checked( $checked ); ?> />
		My logo already includes our name
	</label>
	<p class="description">
		Tick this if the words are part of your logo picture, so the site does not print your name a second time next to it. Only applies when a gaggle logo is set.
	</p>
	<?php
}

/**
 * Media picker for an optional light-coloured version of the gaggle logo,
 * used only on the dark footer. Without it the regular logo sits on a cream
 * chip so a dark logo stays visible.
 */
function tbl_field_footer_logo(): void {
	$opts = get_option( TBL_OPTIONS_KEY, [] );
	$id   = isset( $opts['footer_logo_id'] ) ? (int) $opts['footer_logo_id'] : 0;
	$src  = $id ? wp_get_attachment_image_url( $id, 'medium' ) : '';

	wp_enqueue_media();
	?>
	<div class="tbl-footer-logo-field">
		<input type="hidden" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[footer_logo_id]" id="tbl_footer_logo_id" value="<?php echo esc_attr( (string) $id ); ?>" />
		<div class="tbl-footer-logo-preview" style="margin-bottom:10px">
			<?php if ( $src ) : ?>
				<img src="<?php echo esc_url( $src ); ?>" alt="" style="max-width:240px;max-height:120px;width:auto;height:auto;border:1px solid #ccc;background:#422a69;padding:6px" />
			<?php else : ?>
				<em style="color:#666">No light logo set. The footer shows your regular logo on a cream chip.</em>
			<?php endif; ?>
		</div>
		<button type="button" class="button" id="tbl_footer_logo_pick">Choose light logo</button>
		<button type="button" class="button" id="tbl_footer_logo_clear" <?php echo $id ? '' : 'style="display:none"'; ?>>Clear</button>
		<p class="description">Optional. The footer is dark purple, so a dark logo is shown there on a cream chip. If you have a cream or white version of your logo on a see-through background, choose it here and the footer will use it with no chip. Only applies when a gaggle logo is set.</p>
	</div>
	<script>
		(function () {
			var pick = document.getElementById('tbl_footer_logo_pick');
			var clear = document.getElementById('tbl_footer_logo_clear');
			var idEl = document.getElementById('tbl_footer_logo_id');
			var preview = document.querySelector('.tbl-footer-logo-preview');
			if (!pick || !idEl || !preview) return;

			var frame;
			pick.addEventListener('click', function () {
				if (frame) { frame.open(); return; }
				frame = wp.media({
					title: 'Select the light version of your logo',
					button: { text: 'Use this logo' },
					library: { type: 'image' },
					multiple: false
				});
				frame.on('select', function () {
					var att = frame.state().get('selection').first().toJSON();
					idEl.value = att.id;
					var src = (att.sizes && att.sizes.medium && att.sizes.medium.url) ? att.sizes.medium.url : att.url;
					preview.innerHTML = '<img src="' + src + '" alt="" style="max-width:240px;max-height:120px;width:auto;height:auto;border:1px solid #ccc;background:#422a69;padding:6px" />';
					if (clear) clear.style.display = '';
				});
				frame.open();
			});
			if (clear) clear.addEventListener('click', function () {
				idEl.value = '0';
				preview.innerHTML = '<em style="color:#666">No light logo set. The footer shows your regular logo on a cream chip.</em>';
				clear.style.display = 'none';
			});
		})();
	</script>
	<?php
}

function tbl_field_hero_image(): void {
	$opts = get_option( TBL_OPTIONS_KEY, [] );
	$id   = isset( $opts['hero_image_id'] ) ? (int) $opts['hero_image_id'] : 0;
	$src  = $id ? wp_get_attachment_image_url( $id, 'medium' ) : '';

	wp_enqueue_media();
	?>
	<div class="tbl-hero-field">
		<input type="hidden" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[hero_image_id]" id="tbl_hero_image_id" value="<?php echo esc_attr( (string) $id ); ?>" />
		<div class="tbl-hero-preview" style="margin-bottom:10px">
			<?php if ( $src ) : ?>
				<img src="<?php echo esc_url( $src ); ?>" alt="" style="max-width:320px;height:auto;border:1px solid #ccc" />
			<?php else : ?>
				<em style="color:#666">No custom hero set. The bundled default will be used.</em>
			<?php endif; ?>
		</div>
		<button type="button" class="button" id="tbl_hero_pick">Choose image</button>
		<button type="button" class="button" id="tbl_hero_clear" <?php echo $id ? '' : 'style="display:none"'; ?>>Clear</button>
		<p class="description">Used as the homepage polaroid. Square images work best (roughly 1000 by 1000 pixels).</p>
	</div>
	<script>
		(function () {
			var pick = document.getElementById('tbl_hero_pick');
			var clear = document.getElementById('tbl_hero_clear');
			var idEl = document.getElementById('tbl_hero_image_id');
			var preview = document.querySelector('.tbl-hero-preview');
			if (!pick || !idEl || !preview) return;

			var frame;
			pick.addEventListener('click', function () {
				if (frame) { frame.open(); return; }
				frame = wp.media({
					title: 'Select a hero image',
					button: { text: 'Use this image' },
					multiple: false
				});
				frame.on('select', function () {
					var att = frame.state().get('selection').first().toJSON();
					idEl.value = att.id;
					var src = (att.sizes && att.sizes.medium && att.sizes.medium.url) ? att.sizes.medium.url : att.url;
					preview.innerHTML = '<img src="' + src + '" alt="" style="max-width:320px;height:auto;border:1px solid #ccc" />';
					if (clear) clear.style.display = '';
				});
				frame.open();
			});
			if (clear) clear.addEventListener('click', function () {
				idEl.value = '0';
				preview.innerHTML = '<em style="color:#666">No custom hero set. The bundled default will be used.</em>';
				clear.style.display = 'none';
			});
		})();
	</script>
	<?php
}

function tbl_field_youtube_url(): void {
	$opts = get_option( TBL_OPTIONS_KEY, [] );
	$val  = isset( $opts['youtube_channel_url'] ) ? (string) $opts['youtube_channel_url'] : '';
	?>
	<input type="url" class="regular-text" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[youtube_channel_url]" value="<?php echo esc_attr( $val ); ?>" placeholder="https://youtube.com/@yourgaggle" />
	<p class="description">If set, a Videos page link appears in the site nav. Leave blank to hide it.</p>
	<?php
}

function tbl_field_facebook_url(): void {
	$opts = get_option( TBL_OPTIONS_KEY, [] );
	$val  = isset( $opts['facebook_url'] ) ? (string) $opts['facebook_url'] : '';
	?>
	<input type="url" class="regular-text" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[facebook_url]" value="<?php echo esc_attr( $val ); ?>" placeholder="https://www.facebook.com/yourgaggle" />
	<p class="description">If set, a "Find us on Facebook" link appears in the footer and on the Contact page. Paste the address from your browser's address bar while viewing your page.</p>
	<?php
}

/**
 * Text: the gaggle's full name, for gaggles not called "<place> Raging Grannies".
 * Blank means the default, "<site title> Raging Grannies".
 */
function tbl_field_display_name(): void {
	$opts    = get_option( TBL_OPTIONS_KEY, [] );
	$val     = isset( $opts['display_name'] ) ? (string) $opts['display_name'] : '';
	$default = function_exists( 'tbl_gaggle_name' ) ? tbl_gaggle_name() . ' Raging Grannies' : '';
	?>
	<input type="text" class="regular-text" maxlength="120" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[display_name]" value="<?php echo esc_attr( $val ); ?>" placeholder="<?php echo esc_attr( $default ); ?>" />
	<p class="description">Leave blank and your site is called <strong><?php echo esc_html( $default ); ?></strong>, built from the Site Title. Fill this in only if your gaggle goes by something else, such as <em>Raging Grannies of Rolla</em> or <em>Raging Grannies Action League</em>. It shows on the front page, in the footer, and to search engines.</p>
	<?php
}

function tbl_field_tagline(): void {
	$opts = get_option( TBL_OPTIONS_KEY, [] );
	$val  = isset( $opts['tagline'] ) ? (string) $opts['tagline'] : '';
	?>
	<input type="text" class="regular-text" maxlength="280" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[tagline]" value="<?php echo esc_attr( $val ); ?>" placeholder="Older women in flowered hats, singing truth to power and joy to the streets. We do not retire quietly." />
	<p class="description">An italic tagline shown on the homepage hero. Keep it short — one or two sentences.</p>
	<?php
}

function tbl_field_show_local_songs(): void {
	$opts    = get_option( TBL_OPTIONS_KEY, [] );
	$checked = ! empty( $opts['show_local_songs'] );
	$count   = function_exists( 'tbl_count_local_songs' ) ? tbl_count_local_songs() : 0;
	$slug    = function_exists( 'tbl_gaggle_slug' ) ? tbl_gaggle_slug() : '';
	?>
	<label>
		<input type="checkbox" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[show_local_songs]" value="1" <?php checked( $checked ); ?> />
		Show this gaggle's songs on the subsite
	</label>
	<p class="description">
		Pulls from the central song library, filtered by the gaggle taxonomy term whose slug matches this subsite (<code><?php echo esc_html( $slug ); ?></code>). When on, the Songs pill in the header points to a local <code>/songs/</code> page. When off, the pill links to the central library.
	</p>
	<p class="description" style="margin-top:6px">
		<strong>Detected:</strong>
		<?php
		if ( $count === 0 ) {
			echo 'no songs found tagged with the <code>' . esc_html( $slug ) . '</code> gaggle term. Either no songs exist for this gaggle yet, or the term slug doesn\'t match this subsite\'s path.';
		} else {
			echo esc_html( (string) $count ) . ' songs in the central archive tagged with this gaggle.';
		}
		?>
	</p>
	<?php
}

/**
 * Render the options page.
 */
function tbl_render_options_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1>Gaggle Settings</h1>
		<p>The handful of settings that personalize this subsite. Everything else is wired to the site title and slug.</p>
		<form action="options.php" method="post">
			<?php
			settings_fields( 'tbl_options_group' );
			do_settings_sections( TBL_OPTIONS_PAGE );
			submit_button( 'Save Settings' );
			?>
		</form>
	</div>
	<?php
}

/**
 * Checkbox: hide featured images / placeholder art on Action lists.
 * Stored inverted (hide, default 0) so gaggles that saved settings before
 * this option existed keep showing images.
 */
function tbl_field_hide_action_images(): void {
	$opts    = get_option( TBL_OPTIONS_KEY, [] );
	$checked = ! empty( $opts['hide_action_images'] );
	?>
	<label>
		<input type="checkbox" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[hide_action_images]" value="1" <?php checked( $checked ); ?> />
		Hide photos on Action lists
	</label>
	<p class="description">
		By default, each Action shows its photo on the front page and the Actions
		list, with placeholder art when a post has no photo. If most of your
		Actions have no photos, tick this to hide the image column entirely for a
		cleaner, text-first look. Individual Action pages are unaffected.
	</p>
	<?php
}
