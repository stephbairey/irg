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
				'hero_image_id'       => 0,
				'youtube_channel_url' => '',
				'tagline'             => '',
			],
		]
	);

	add_settings_section(
		'tbl_options_main',
		'',
		'__return_null',
		TBL_OPTIONS_PAGE
	);

	add_settings_field( 'hero_image_id',       'Hero Image',         'tbl_field_hero_image',  TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'youtube_channel_url', 'YouTube Channel URL','tbl_field_youtube_url', TBL_OPTIONS_PAGE, 'tbl_options_main' );
	add_settings_field( 'tagline',             'Tagline',            'tbl_field_tagline',     TBL_OPTIONS_PAGE, 'tbl_options_main' );
}
add_action( 'admin_init', 'tbl_register_options' );

/**
 * Sanitize options on save.
 */
function tbl_sanitize_options( $input ): array {
	$out = [
		'hero_image_id'       => 0,
		'youtube_channel_url' => '',
		'tagline'             => '',
	];
	if ( ! is_array( $input ) ) {
		return $out;
	}
	if ( isset( $input['hero_image_id'] ) ) {
		$out['hero_image_id'] = (int) $input['hero_image_id'];
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
	if ( isset( $input['tagline'] ) ) {
		$out['tagline'] = sanitize_text_field( (string) $input['tagline'] );
	}
	return $out;
}

/* ---- field renderers ---------------------------------------------------- */

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
		<p class="description">Used as the homepage hero. Wide landscape images work best (roughly 1600 by 600).</p>
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

function tbl_field_tagline(): void {
	$opts = get_option( TBL_OPTIONS_KEY, [] );
	$val  = isset( $opts['tagline'] ) ? (string) $opts['tagline'] : '';
	?>
	<input type="text" class="regular-text" maxlength="280" name="<?php echo esc_attr( TBL_OPTIONS_KEY ); ?>[tagline]" value="<?php echo esc_attr( $val ); ?>" placeholder="Older women in flowered hats, singing truth to power and joy to the streets. We do not retire quietly." />
	<p class="description">An italic tagline shown on the homepage hero. Keep it short — one or two sentences.</p>
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
		<p>Three knobs that personalize this subsite. Everything else is wired to the site title and slug.</p>
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
