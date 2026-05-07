<?php
/**
 * Plugin Name: IRG Core
 * Plugin URI: https://linguainkmedia.com
 * Description: Custom post types, taxonomies, and ACF fields for the International Raging Grannies multisite.
 * Version: 3.13.0
 * Author: Lingua Ink Media
 * Author URI: https://linguainkmedia.com
 * Network: true
 * Requires PHP: 8.0
 * License: GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Plugin version. Used as the gate key for one-shot upgrade routines so a
// version bump triggers them once, network-wide, then they go quiet again.
// Keep in sync with the file header above.
define( 'IRG_VERSION', '3.13.0' );

// Public host for cross-site URL builders (subsite-songs detail links, etc.).
// Override in wp-config.php to point at a preview/dev URL.
if ( ! defined( 'IRG_PUBLIC_HOST' ) ) {
	define( 'IRG_PUBLIC_HOST', 'https://raginggrannies.org' );
}

add_action( 'init', 'irg_register_song_cpt' );
add_action( 'init', 'irg_register_song_taxonomies' );
add_action( 'init', 'irg_relabel_posts_on_subsites' );
add_action( 'init', 'irg_maybe_apply_subsite_defaults_network', 99 );
add_action( 'wp_initialize_site', 'irg_apply_defaults_to_new_site', 100 );
add_action( 'init', 'irg_seed_issue_terms' );
add_action( 'init', 'irg_register_press_photo_cpt' );
add_action( 'init', 'irg_register_press_photo_taxonomy' );
add_action( 'init', 'irg_seed_photo_category_terms' );
add_action( 'acf/include_fields', 'irg_register_acf_fields' );
add_action( 'acf/include_fields', 'irg_register_press_photo_acf_fields' );
add_action( 'admin_menu', 'irg_add_import_page' );

add_filter( 'manage_song_posts_columns', 'irg_song_admin_columns' );
add_action( 'manage_song_posts_custom_column', 'irg_song_admin_column_content', 10, 2 );
add_filter( 'manage_edit-song_sortable_columns', 'irg_song_admin_sortable_columns' );
add_action( 'pre_get_posts', 'irg_song_admin_sort_by_taxonomy' );
add_action( 'restrict_manage_posts', 'irg_song_admin_filter_dropdowns' );

add_action( 'rest_api_init', 'irg_register_deploy_endpoint' );
add_action( 'rest_api_init', 'irg_register_theme_deploy_endpoint' );
add_action( 'rest_api_init', 'irg_register_subsites_endpoint' );
add_action( 'rest_api_init', 'irg_register_contact_endpoint' );
add_filter( 'rest_pre_serve_request', 'irg_contact_cors_headers', 10, 4 );
add_action( 'rest_api_init', 'irg_register_submit_song_endpoint' );
add_filter( 'rest_pre_serve_request', 'irg_submit_song_cors_headers', 10, 4 );

// Subsite-songs cache invalidation (main-site context only).
add_action( 'save_post_song', 'irg_subsite_songs_bust_on_save', 10, 1 );
add_action( 'before_delete_post', 'irg_subsite_songs_bust_on_delete', 10, 1 );
add_action( 'set_object_terms', 'irg_subsite_songs_bust_on_term_change', 10, 4 );
add_action( 'transition_post_status', 'irg_subsite_songs_bust_on_status', 10, 3 );

add_filter( 'upload_size_limit', 'irg_upload_size_limit' );
add_filter( 'pre_site_option_fileupload_maxk', 'irg_multisite_upload_maxk' );
add_filter( 'big_image_size_threshold', 'irg_press_photo_no_big_image', 10, 4 );

function irg_register_song_cpt(): void {
	if ( ! is_main_site() ) {
		return;
	}

	register_post_type( 'song', [
		'labels' => [
			'name'               => 'Songs',
			'singular_name'      => 'Song',
			'add_new'            => 'Add New Song',
			'add_new_item'       => 'Add New Song',
			'edit_item'          => 'Edit Song',
			'new_item'           => 'New Song',
			'view_item'          => 'View Song',
			'search_items'       => 'Search Songs',
			'not_found'          => 'No songs found',
			'not_found_in_trash' => 'No songs found in Trash',
			'all_items'          => 'All Songs',
			'menu_name'          => 'Songs',
		],
		'public'              => true,
		'has_archive'         => true,
		'rewrite'             => [ 'slug' => 'songs' ],
		'menu_icon'           => 'dashicons-format-audio',
		'menu_position'       => 5,
		'supports'            => [ 'title', 'excerpt', 'thumbnail', 'custom-fields', 'revisions' ],
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'song',
		'graphql_plural_name' => 'songs',
	] );
}

function irg_register_song_taxonomies(): void {
	if ( ! is_main_site() ) {
		return;
	}

	register_taxonomy( 'issue', [ 'song' ], [
		'labels' => [
			'name'          => 'Issues',
			'singular_name' => 'Issue',
			'search_items'  => 'Search Issues',
			'all_items'     => 'All Issues',
			'parent_item'   => 'Parent Issue',
			'edit_item'     => 'Edit Issue',
			'add_new_item'  => 'Add New Issue',
			'menu_name'     => 'Issues',
		],
		'hierarchical'        => true,
		'public'              => true,
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'issue',
		'graphql_plural_name' => 'issues',
		'rewrite'             => [ 'slug' => 'issue' ],
	] );

	register_taxonomy( 'songwriter', [ 'song' ], [
		'labels' => [
			'name'          => 'Songwriters',
			'singular_name' => 'Songwriter',
			'search_items'  => 'Search Songwriters',
			'all_items'     => 'All Songwriters',
			'edit_item'     => 'Edit Songwriter',
			'add_new_item'  => 'Add New Songwriter',
			'menu_name'     => 'Songwriters',
		],
		'hierarchical'        => false,
		'public'              => true,
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'songwriter',
		'graphql_plural_name' => 'songwriters',
		'rewrite'             => [ 'slug' => 'songwriter' ],
	] );

	register_taxonomy( 'gaggle', [ 'song' ], [
		'labels' => [
			'name'          => 'Gaggles',
			'singular_name' => 'Gaggle',
			'search_items'  => 'Search Gaggles',
			'all_items'     => 'All Gaggles',
			'edit_item'     => 'Edit Gaggle',
			'add_new_item'  => 'Add New Gaggle',
			'menu_name'     => 'Gaggles',
		],
		'hierarchical'        => false,
		'public'              => true,
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'gaggle',
		'graphql_plural_name' => 'gaggles',
		'rewrite'             => [ 'slug' => 'gaggle' ],
	] );

	register_taxonomy( 'tune', [ 'song' ], [
		'labels' => [
			'name'          => 'Tunes',
			'singular_name' => 'Tune',
			'search_items'  => 'Search Tunes',
			'all_items'     => 'All Tunes',
			'edit_item'     => 'Edit Tune',
			'add_new_item'  => 'Add New Tune',
			'menu_name'     => 'Tunes',
		],
		'hierarchical'        => false,
		'public'              => true,
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'tune',
		'graphql_plural_name' => 'tunes',
		'rewrite'             => [ 'slug' => 'tune' ],
	] );
}

function irg_seed_issue_terms(): void {
	if ( ! is_main_site() ) {
		return;
	}

	if ( get_option( 'irg_issue_terms_seeded' ) ) {
		return;
	}

	if ( ! taxonomy_exists( 'issue' ) ) {
		return;
	}

	$terms = [
		'Business & Economy',
		'Education',
		'Elections & Democracy',
		'Environment & Energy',
		'Gender Equity',
		'Government & Power',
		'Granny Life',
		'Guns & Violence',
		'Healthcare',
		'Holiday & Celebrations',
		'Human & Civil Rights',
		'Immigration',
		'Labor & Worker Rights',
		'Local Issues',
		'Racism & Social Justice',
		'Reproductive Rights',
		'Soldiers & Veterans',
		'War & Peace',
	];

	foreach ( $terms as $term ) {
		if ( ! term_exists( $term, 'issue' ) ) {
			wp_insert_term( $term, 'issue' );
		}
	}

	update_option( 'irg_issue_terms_seeded', true );
}

function irg_register_acf_fields(): void {
	if ( ! is_main_site() ) {
		return;
	}

	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	acf_add_local_field_group( [
		'key'                   => 'group_irg_song_fields',
		'title'                 => 'Song Details',
		'fields'                => [
			[
				'key'               => 'field_irg_lyrics',
				'label'             => 'Lyrics',
				'name'              => 'lyrics',
				'type'              => 'wysiwyg',
				'instructions'      => 'Full song lyrics. Use bold, italic, and underline for musical emphasis (syllable stress, held notes).',
				'required'          => 0,
				'tabs'              => 'all',
				'toolbar'           => 'basic',
				'media_upload'      => 0,
				'show_in_graphql'   => 1,
			],
			[
				'key'               => 'field_irg_key_or_starting_note',
				'label'             => 'Key or Starting Note',
				'name'              => 'key_or_starting_note',
				'type'              => 'text',
				'instructions'      => 'Musical key or starting note (e.g., "Key of G" or "Start on D").',
				'required'          => 0,
				'show_in_graphql'   => 1,
			],
			[
				'key'               => 'field_irg_youtube_link',
				'label'             => 'YouTube Link',
				'name'              => 'youtube_link',
				'type'              => 'url',
				'instructions'      => 'Link to a YouTube video of this song being performed.',
				'required'          => 0,
				'show_in_graphql'   => 1,
			],
			[
				'key'               => 'field_irg_youtube_link_2',
				'label'             => 'YouTube Link 2',
				'name'              => 'youtube_link_2',
				'type'              => 'url',
				'instructions'      => 'Optional second YouTube link (alternate performance).',
				'required'          => 0,
				'show_in_graphql'   => 1,
			],
			[
				'key'               => 'field_irg_date_written_or_updated',
				'label'             => 'Date Written or Updated',
				'name'              => 'date_written_or_updated',
				'type'              => 'date_picker',
				'instructions'      => 'When this song was written or last updated.',
				'required'          => 0,
				'display_format'    => 'F j, Y',
				'return_format'     => 'Y-m-d',
				'show_in_graphql'   => 1,
			],
			[
				'key'               => 'field_irg_source_notes',
				'label'             => 'Source Notes',
				'name'              => 'source_notes',
				'type'              => 'text',
				'instructions'      => 'Provenance or attribution (e.g., "from the Victoria Grannies Songbook, 1993").',
				'required'          => 0,
				'show_in_graphql'   => 1,
			],
		],
		'location'              => [
			[
				[
					'param'    => 'post_type',
					'operator' => '==',
					'value'    => 'song',
				],
			],
		],
		'menu_order'            => 0,
		'position'              => 'normal',
		'style'                 => 'default',
		'label_placement'       => 'top',
		'instruction_placement' => 'label',
		'active'                => true,
		'show_in_rest'          => 1,
		'show_in_graphql'       => 1,
		'graphql_field_name'    => 'songDetails',
	] );
}

// ---------------------------------------------------------------------------
// Temporary song import tool — remove after migration is complete.
// ---------------------------------------------------------------------------

function irg_add_import_page(): void {
	if ( ! is_main_site() ) {
		return;
	}

	add_submenu_page(
		'edit.php?post_type=song',
		'Import Songs',
		'Import Songs',
		'manage_options',
		'irg-import-songs',
		'irg_render_import_page'
	);
}

function irg_render_import_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( 'Unauthorized.' );
	}

	echo '<div class="wrap">';
	echo '<h1>Import Songs from JSON</h1>';

	// Handle form submission.
	if ( isset( $_POST['irg_import_nonce'] ) && wp_verify_nonce( $_POST['irg_import_nonce'], 'irg_import_songs' ) ) {
		irg_handle_import();
		echo '</div>';
		return;
	}

	// Safety check: count existing songs.
	$existing = wp_count_posts( 'song' );
	$existing_count = ( $existing->publish ?? 0 ) + ( $existing->draft ?? 0 ) + ( $existing->trash ?? 0 );

	if ( $existing_count > 0 ) {
		echo '<div class="notice notice-warning"><p>';
		echo '<strong>Warning:</strong> There are already <strong>' . (int) $existing_count . '</strong> songs in the database. ';
		echo 'Importing again will create duplicates. Only proceed if you have cleared the existing songs.';
		echo '</p></div>';
	}

	echo '<form method="post" enctype="multipart/form-data">';
	wp_nonce_field( 'irg_import_songs', 'irg_import_nonce' );
	echo '<table class="form-table"><tr>';
	echo '<th><label for="irg_json_file">JSON File</label></th>';
	echo '<td><input type="file" name="irg_json_file" id="irg_json_file" accept=".json" required>';
	echo '<p class="description">Upload songs-consolidated.json. Songs with duplicate_of set will be skipped.</p>';
	echo '</td></tr></table>';

	if ( $existing_count > 0 ) {
		echo '<p><label><input type="checkbox" name="irg_confirm_reimport" value="1" required> ';
		echo 'I understand there are existing songs and want to proceed anyway.</label></p>';
	}

	submit_button( 'Import Songs' );
	echo '</form>';
	echo '</div>';
}

function irg_handle_import(): void {
	if ( empty( $_FILES['irg_json_file']['tmp_name'] ) ) {
		echo '<div class="notice notice-error"><p>No file uploaded.</p></div>';
		return;
	}

	$json_string = file_get_contents( $_FILES['irg_json_file']['tmp_name'] );
	$songs = json_decode( $json_string, true );

	if ( ! is_array( $songs ) ) {
		echo '<div class="notice notice-error"><p>Invalid JSON file.</p></div>';
		return;
	}

	// Filter out duplicates.
	$to_import = array_filter( $songs, fn( $s ) => empty( $s['duplicate_of'] ) );
	$skipped_dupes = count( $songs ) - count( $to_import );

	$total        = count( $to_import );
	$imported     = 0;
	$errors       = [];
	$terms_created = [
		'issue'      => 0,
		'songwriter' => 0,
		'gaggle'     => 0,
		'tune'       => 0,
	];

	echo '<h2>Import Progress</h2>';
	echo '<div id="irg-import-log" style="background:#f0f0f0;padding:12px;max-height:400px;overflow-y:auto;font-family:monospace;font-size:13px;margin-bottom:20px;">';

	// Flush output so the browser renders progressively.
	if ( ob_get_level() ) {
		ob_end_flush();
	}
	flush();

	foreach ( $to_import as $song ) {
		$imported++;
		$title = $song['title'] ?? '(untitled)';

		// Build post_date from date_published.
		$post_date = '';
		if ( ! empty( $song['date_published'] ) ) {
			$post_date = $song['date_published'] . ' 00:00:00';
		}

		$post_args = [
			'post_type'   => 'song',
			'post_title'  => sanitize_text_field( $title ),
			'post_status' => 'publish',
		];

		if ( $post_date ) {
			$post_args['post_date']     = $post_date;
			$post_args['post_date_gmt'] = get_gmt_from_date( $post_date );
		}

		$post_id = wp_insert_post( $post_args, true );

		if ( is_wp_error( $post_id ) ) {
			$errors[] = "#{$imported} \"{$title}\": " . $post_id->get_error_message();
			echo esc_html( "ERROR {$imported}/{$total}: \"{$title}\" — {$post_id->get_error_message()}" ) . "<br>";
			flush();
			continue;
		}

		// ACF fields.
		if ( function_exists( 'update_field' ) ) {
			if ( ! empty( $song['lyrics'] ) ) {
				update_field( 'field_irg_lyrics', wp_kses_post( $song['lyrics'] ), $post_id );
			}
			if ( ! empty( $song['key_or_starting_note'] ) ) {
				update_field( 'field_irg_key_or_starting_note', sanitize_text_field( $song['key_or_starting_note'] ), $post_id );
			}
			if ( ! empty( $song['youtube_link'] ) ) {
				update_field( 'field_irg_youtube_link', esc_url_raw( $song['youtube_link'] ), $post_id );
			}
			if ( ! empty( $song['youtube_link_2'] ) ) {
				update_field( 'field_irg_youtube_link_2', esc_url_raw( $song['youtube_link_2'] ), $post_id );
			}
			if ( ! empty( $song['date_written_or_updated'] ) ) {
				update_field( 'field_irg_date_written_or_updated', sanitize_text_field( $song['date_written_or_updated'] ), $post_id );
			}
			if ( ! empty( $song['source_notes'] ) ) {
				update_field( 'field_irg_source_notes', sanitize_text_field( $song['source_notes'] ), $post_id );
			}
		}

		// Issue taxonomy.
		if ( ! empty( $song['issues'] ) && is_array( $song['issues'] ) ) {
			$term_ids = [];
			foreach ( $song['issues'] as $issue_name ) {
				$term = term_exists( $issue_name, 'issue' );
				if ( ! $term ) {
					$term = wp_insert_term( $issue_name, 'issue' );
					if ( ! is_wp_error( $term ) ) {
						$terms_created['issue']++;
					}
				}
				if ( ! is_wp_error( $term ) ) {
					$term_ids[] = (int) ( is_array( $term ) ? $term['term_id'] : $term );
				}
			}
			if ( $term_ids ) {
				wp_set_object_terms( $post_id, $term_ids, 'issue' );
			}
		}

		// Songwriter taxonomy.
		if ( ! empty( $song['songwriter'] ) ) {
			$sw_name = trim( $song['songwriter'] );
			$term    = term_exists( $sw_name, 'songwriter' );
			if ( ! $term ) {
				$term = wp_insert_term( $sw_name, 'songwriter' );
				if ( ! is_wp_error( $term ) ) {
					$terms_created['songwriter']++;
				}
			}
			if ( ! is_wp_error( $term ) ) {
				$tid = (int) ( is_array( $term ) ? $term['term_id'] : $term );
				wp_set_object_terms( $post_id, [ $tid ], 'songwriter' );
			}
		}

		// Gaggle taxonomy.
		if ( ! empty( $song['gaggle'] ) ) {
			$g_name = trim( $song['gaggle'] );
			$term   = term_exists( $g_name, 'gaggle' );
			if ( ! $term ) {
				$term = wp_insert_term( $g_name, 'gaggle' );
				if ( ! is_wp_error( $term ) ) {
					$terms_created['gaggle']++;
				}
			}
			if ( ! is_wp_error( $term ) ) {
				$tid = (int) ( is_array( $term ) ? $term['term_id'] : $term );
				wp_set_object_terms( $post_id, [ $tid ], 'gaggle' );
			}
		}

		// Tune taxonomy.
		if ( ! empty( $song['tune'] ) ) {
			$t_name = trim( $song['tune'] );
			$term   = term_exists( $t_name, 'tune' );
			if ( ! $term ) {
				$term = wp_insert_term( $t_name, 'tune' );
				if ( ! is_wp_error( $term ) ) {
					$terms_created['tune']++;
				}
			}
			if ( ! is_wp_error( $term ) ) {
				$tid = (int) ( is_array( $term ) ? $term['term_id'] : $term );
				wp_set_object_terms( $post_id, [ $tid ], 'tune' );
			}
		}

		echo esc_html( "Imported {$imported} of {$total}: \"{$title}\"" ) . "<br>";

		if ( $imported % 50 === 0 ) {
			flush();
		}
	}

	echo '</div>';

	// Summary.
	$error_count = count( $errors );
	echo '<h2>Import Summary</h2>';
	echo '<table class="widefat" style="max-width:500px;"><tbody>';
	echo "<tr><td>Total in file</td><td><strong>" . count( $songs ) . "</strong></td></tr>";
	echo "<tr><td>Skipped (flagged duplicates)</td><td><strong>{$skipped_dupes}</strong></td></tr>";
	echo "<tr><td>Imported</td><td><strong>{$imported}</strong></td></tr>";
	echo "<tr><td>Errors</td><td><strong>{$error_count}</strong></td></tr>";
	echo "<tr><td colspan='2'><strong>Terms created:</strong></td></tr>";
	echo "<tr><td>&nbsp;&nbsp;Issues</td><td>{$terms_created['issue']}</td></tr>";
	echo "<tr><td>&nbsp;&nbsp;Songwriters</td><td>{$terms_created['songwriter']}</td></tr>";
	echo "<tr><td>&nbsp;&nbsp;Gaggles</td><td>{$terms_created['gaggle']}</td></tr>";
	echo "<tr><td>&nbsp;&nbsp;Tunes</td><td>{$terms_created['tune']}</td></tr>";
	echo '</tbody></table>';

	if ( $errors ) {
		echo '<h3>Errors</h3><ul>';
		foreach ( $errors as $err ) {
			echo '<li>' . esc_html( $err ) . '</li>';
		}
		echo '</ul>';
	}
}

// ---------------------------------------------------------------------------
// Subsite label customization.
// ---------------------------------------------------------------------------

function irg_relabel_posts_on_subsites(): void {
	if ( is_main_site() ) {
		return;
	}

	global $wp_post_types;

	if ( ! isset( $wp_post_types['post'] ) ) {
		return;
	}

	$wp_post_types['post']->labels->name               = 'Actions';
	$wp_post_types['post']->labels->singular_name       = 'Action';
	$wp_post_types['post']->labels->add_new             = 'Add New Action';
	$wp_post_types['post']->labels->add_new_item        = 'Add New Action';
	$wp_post_types['post']->labels->edit_item           = 'Edit Action';
	$wp_post_types['post']->labels->new_item            = 'New Action';
	$wp_post_types['post']->labels->view_item           = 'View Action';
	$wp_post_types['post']->labels->search_items        = 'Search Actions';
	$wp_post_types['post']->labels->not_found           = 'No actions found';
	$wp_post_types['post']->labels->not_found_in_trash  = 'No actions found in Trash';
	$wp_post_types['post']->labels->all_items           = 'All Actions';
	$wp_post_types['post']->labels->menu_name           = 'Actions';
	$wp_post_types['post']->labels->name_admin_bar      = 'Action';
}

// ---------------------------------------------------------------------------
// Subsite content defaults — comments, pings, avatars off network-wide.
// Applied per-subsite via a one-shot version-gated runner; new subsites
// inherit the same defaults via wp_initialize_site so the policy doesn't
// drift as new gaggles are added.
// ---------------------------------------------------------------------------

/**
 * Set the four content-default options on the current site to off /
 * closed. Idempotent — running multiple times has no effect. Caller
 * is responsible for switch_to_blog when applying to a non-current
 * site.
 */
function irg_apply_subsite_content_defaults(): void {
	update_option( 'default_comment_status', 'closed' );
	update_option( 'default_ping_status',    'closed' );
	update_option( 'default_pingback_flag',  0 );
	update_option( 'show_avatars',           0 );
}

/**
 * Network-wide one-shot: when the plugin version bumps, walk every
 * non-main site in the network and apply the content defaults under
 * each site's context. The gate (irg_subsite_defaults_version) lives
 * at network scope so this runner doesn't repeat once it has caught
 * up with the current version. Skips the network's main site, which
 * has different editorial policy.
 */
function irg_maybe_apply_subsite_defaults_network(): void {
	$gate_key = 'irg_subsite_defaults_version';

	if ( ! is_multisite() ) {
		if ( get_option( $gate_key, '' ) === IRG_VERSION ) {
			return;
		}
		irg_apply_subsite_content_defaults();
		update_option( $gate_key, IRG_VERSION );
		return;
	}

	if ( get_site_option( $gate_key, '' ) === IRG_VERSION ) {
		return;
	}

	$main_id = (int) get_main_site_id();
	$ids     = get_sites( [ 'number' => 0, 'fields' => 'ids' ] );

	foreach ( $ids as $blog_id ) {
		$blog_id = (int) $blog_id;
		if ( $blog_id === $main_id ) {
			continue;
		}
		switch_to_blog( $blog_id );
		irg_apply_subsite_content_defaults();
		restore_current_blog();
	}

	update_site_option( $gate_key, IRG_VERSION );
}

/**
 * New-subsite hook: any gaggle subsite created post-deploy inherits
 * the same content defaults. The main site is created at network
 * setup and isn't re-initialized by this hook in normal operation,
 * but we guard explicitly anyway.
 */
function irg_apply_defaults_to_new_site( WP_Site $new_site ): void {
	$blog_id = (int) $new_site->blog_id;
	if ( is_multisite() && $blog_id === (int) get_main_site_id() ) {
		return;
	}
	switch_to_blog( $blog_id );
	irg_apply_subsite_content_defaults();
	restore_current_blog();
}

// ---------------------------------------------------------------------------
// Songs admin list table — custom columns, sorting, filter dropdowns.
// ---------------------------------------------------------------------------

const IRG_SONG_ADMIN_TAXONOMIES = [
	'issue'      => 'Issue',
	'gaggle'     => 'Gaggle',
	'songwriter' => 'Songwriter',
	'tune'       => 'Tune',
];

function irg_song_admin_columns( array $columns ): array {
	$new = [];
	foreach ( $columns as $key => $label ) {
		if ( $key === 'date' ) {
			foreach ( IRG_SONG_ADMIN_TAXONOMIES as $tax => $tax_label ) {
				$new[ $tax ] = $tax_label;
			}
		}
		$new[ $key ] = $label;
	}
	return $new;
}

function irg_song_admin_column_content( string $column, int $post_id ): void {
	if ( ! array_key_exists( $column, IRG_SONG_ADMIN_TAXONOMIES ) ) {
		return;
	}

	$terms = get_the_terms( $post_id, $column );
	if ( is_wp_error( $terms ) || ! $terms ) {
		echo '<span style="color:#a7aaad">—</span>';
		return;
	}

	$links = [];
	foreach ( $terms as $term ) {
		$url = add_query_arg(
			[
				'post_type' => 'song',
				$column     => $term->slug,
			],
			admin_url( 'edit.php' )
		);
		$links[] = '<a href="' . esc_url( $url ) . '">' . esc_html( $term->name ) . '</a>';
	}
	echo implode( ', ', $links );
}

function irg_song_admin_sortable_columns( array $columns ): array {
	foreach ( array_keys( IRG_SONG_ADMIN_TAXONOMIES ) as $tax ) {
		$columns[ $tax ] = $tax;
	}
	return $columns;
}

function irg_song_admin_sort_by_taxonomy( WP_Query $query ): void {
	if ( ! is_admin() || ! $query->is_main_query() ) {
		return;
	}
	if ( $query->get( 'post_type' ) !== 'song' ) {
		return;
	}

	$orderby = $query->get( 'orderby' );
	if ( ! is_string( $orderby ) || ! array_key_exists( $orderby, IRG_SONG_ADMIN_TAXONOMIES ) ) {
		return;
	}

	add_filter( 'posts_clauses', function ( array $clauses ) use ( $orderby ) {
		global $wpdb;

		$tax   = $orderby;
		$order = isset( $_GET['order'] ) && strtoupper( (string) $_GET['order'] ) === 'DESC' ? 'DESC' : 'ASC';

		$clauses['join']    .= " LEFT JOIN {$wpdb->term_relationships} AS irg_tr ON ( irg_tr.object_id = {$wpdb->posts}.ID )";
		$clauses['join']    .= $wpdb->prepare(
			" LEFT JOIN {$wpdb->term_taxonomy} AS irg_tt ON ( irg_tt.term_taxonomy_id = irg_tr.term_taxonomy_id AND irg_tt.taxonomy = %s )",
			$tax
		);
		$clauses['join']    .= " LEFT JOIN {$wpdb->terms} AS irg_t ON ( irg_t.term_id = irg_tt.term_id )";
		$clauses['groupby']  = "{$wpdb->posts}.ID";
		$clauses['orderby']  = "MIN(irg_t.name) {$order}, {$wpdb->posts}.post_title ASC";

		return $clauses;
	} );
}

function irg_song_admin_filter_dropdowns( string $post_type ): void {
	if ( $post_type !== 'song' ) {
		return;
	}

	foreach ( IRG_SONG_ADMIN_TAXONOMIES as $tax => $label ) {
		$selected = isset( $_GET[ $tax ] ) ? sanitize_text_field( wp_unslash( $_GET[ $tax ] ) ) : '';
		wp_dropdown_categories( [
			'show_option_all' => "All {$label}s",
			'taxonomy'        => $tax,
			'name'            => $tax,
			'orderby'         => 'name',
			'value_field'     => 'slug',
			'selected'        => $selected,
			'hierarchical'    => is_taxonomy_hierarchical( $tax ),
			'show_count'      => true,
			'hide_empty'      => true,
			'depth'           => 3,
		] );
	}
}

// ---------------------------------------------------------------------------
// Plugin self-deploy endpoint — upload a new irg-core.zip via REST.
// Requires Application Password + super admin. Refuses any zip whose filename
// doesn't start with "irg-core".
// ---------------------------------------------------------------------------

function irg_register_deploy_endpoint(): void {
	register_rest_route( 'irg/v1', '/plugin-upload', [
		'methods'             => 'POST',
		'callback'            => 'irg_handle_plugin_upload',
		'permission_callback' => function () {
			return is_multisite() ? is_super_admin() : current_user_can( 'install_plugins' );
		},
	] );
}

function irg_handle_plugin_upload( WP_REST_Request $req ) {
	$files = $req->get_file_params();
	if ( empty( $files['plugin'] ) ) {
		return new WP_Error( 'irg_no_file', 'No plugin file uploaded (expected multipart field "plugin").', [ 'status' => 400 ] );
	}

	$file = $files['plugin'];
	if ( ( $file['error'] ?? UPLOAD_ERR_OK ) !== UPLOAD_ERR_OK ) {
		return new WP_Error( 'irg_upload_error', 'Upload error code ' . (int) $file['error'], [ 'status' => 400 ] );
	}

	$name = (string) ( $file['name'] ?? '' );
	if ( strpos( $name, 'irg-core' ) !== 0 || substr( $name, -4 ) !== '.zip' ) {
		return new WP_Error( 'irg_bad_name', 'Expected filename starting with "irg-core" and ending in ".zip".', [ 'status' => 400 ] );
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/misc.php';
	require_once ABSPATH . 'wp-admin/includes/plugin.php';
	require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

	$skin     = new WP_Ajax_Upgrader_Skin();
	$upgrader = new Plugin_Upgrader( $skin );
	$result   = $upgrader->install( $file['tmp_name'], [ 'overwrite_package' => true ] );

	if ( is_wp_error( $result ) ) {
		return $result;
	}
	if ( $result === false ) {
		$errors = $skin->get_errors();
		return new WP_Error(
			'irg_install_failed',
			'Plugin install returned false.',
			[
				'status' => 500,
				'errors' => is_wp_error( $errors ) ? $errors->get_error_messages() : [],
			]
		);
	}

	$plugin_file = 'irg-core/irg-core.php';
	if ( is_multisite() && ! is_plugin_active_for_network( $plugin_file ) ) {
		$activate = activate_plugin( $plugin_file, '', true );
		if ( is_wp_error( $activate ) ) {
			return $activate;
		}
	} elseif ( ! is_multisite() && ! is_plugin_active( $plugin_file ) ) {
		$activate = activate_plugin( $plugin_file );
		if ( is_wp_error( $activate ) ) {
			return $activate;
		}
	}

	$data = get_plugin_data( WP_PLUGIN_DIR . '/' . $plugin_file, false, false );

	return [
		'ok'          => true,
		'name'        => $name,
		'version'     => $data['Version'] ?? null,
		'network'     => is_multisite(),
		'active'      => is_multisite() ? is_plugin_active_for_network( $plugin_file ) : is_plugin_active( $plugin_file ),
	];
}

// ---------------------------------------------------------------------------
// Theme self-deploy endpoint — upload a new the-bulletin-local.zip via REST.
// Same access model as the plugin endpoint: super admin on multisite,
// install_themes capability otherwise. Network-enables the theme on install
// so subsites can activate it; does NOT change any subsite's active theme.
// ---------------------------------------------------------------------------

function irg_register_theme_deploy_endpoint(): void {
	register_rest_route( 'irg/v1', '/theme-upload', [
		'methods'             => 'POST',
		'callback'            => 'irg_handle_theme_upload',
		'permission_callback' => function () {
			return is_multisite() ? is_super_admin() : current_user_can( 'install_themes' );
		},
	] );
}

function irg_handle_theme_upload( WP_REST_Request $req ) {
	$files = $req->get_file_params();
	if ( empty( $files['theme'] ) ) {
		return new WP_Error( 'irg_no_file', 'No theme file uploaded (expected multipart field "theme").', [ 'status' => 400 ] );
	}

	$file = $files['theme'];
	if ( ( $file['error'] ?? UPLOAD_ERR_OK ) !== UPLOAD_ERR_OK ) {
		return new WP_Error( 'irg_upload_error', 'Upload error code ' . (int) $file['error'], [ 'status' => 400 ] );
	}

	$name = (string) ( $file['name'] ?? '' );
	if ( strpos( $name, 'the-bulletin-local' ) !== 0 || substr( $name, -4 ) !== '.zip' ) {
		return new WP_Error( 'irg_bad_name', 'Expected filename starting with "the-bulletin-local" and ending in ".zip".', [ 'status' => 400 ] );
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/misc.php';
	require_once ABSPATH . 'wp-admin/includes/theme.php';
	require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

	$skin     = new WP_Ajax_Upgrader_Skin();
	$upgrader = new Theme_Upgrader( $skin );
	$result   = $upgrader->install( $file['tmp_name'], [ 'overwrite_package' => true ] );

	if ( is_wp_error( $result ) ) {
		return $result;
	}
	if ( $result === false ) {
		$errors = $skin->get_errors();
		return new WP_Error(
			'irg_install_failed',
			'Theme install returned false.',
			[
				'status' => 500,
				'errors' => is_wp_error( $errors ) ? $errors->get_error_messages() : [],
			]
		);
	}

	$stylesheet = 'the-bulletin-local';
	$theme      = wp_get_theme( $stylesheet );
	if ( ! $theme->exists() ) {
		return new WP_Error( 'irg_theme_missing', 'Theme installed but not found at expected slug.', [ 'status' => 500 ] );
	}

	$network_enabled = false;
	if ( is_multisite() ) {
		$allowed                = (array) get_site_option( 'allowedthemes', [] );
		$allowed[ $stylesheet ] = true;
		update_site_option( 'allowedthemes', $allowed );
		$network_enabled = true;
	}

	return [
		'ok'              => true,
		'name'            => $name,
		'stylesheet'      => $stylesheet,
		'version'         => $theme->get( 'Version' ),
		'network_enabled' => $network_enabled,
	];
}

// ---------------------------------------------------------------------------
// Subsites discovery endpoint — lets the Astro frontend enumerate gaggle
// subsites without any env-var config. Public (network membership is already
// discoverable by trying URLs). Excludes the main site since it's the hub,
// not a gaggle.
// ---------------------------------------------------------------------------

function irg_register_subsites_endpoint(): void {
	register_rest_route( 'irg/v1', '/subsites', [
		'methods'             => 'GET',
		'callback'            => 'irg_handle_subsites',
		'permission_callback' => '__return_true',
	] );
}

function irg_handle_subsites() {
	if ( ! is_multisite() ) {
		return [];
	}

	$sites = get_sites( [
		'number'   => 500,
		'archived' => 0,
		'spam'     => 0,
		'deleted'  => 0,
		'public'   => 1,
		'orderby'  => 'path',
	] );

	$out = [];
	foreach ( $sites as $site ) {
		$id = (int) $site->blog_id;
		if ( is_main_site( $id ) ) {
			continue;
		}
		$details = get_blog_details( $id );
		if ( ! $details ) {
			continue;
		}
		$slug = trim( (string) $details->path, '/' );
		if ( $slug === '' ) {
			continue;
		}
		$out[] = [
			'id'   => $id,
			'slug' => $slug,
			'name' => html_entity_decode( (string) $details->blogname, ENT_QUOTES, 'UTF-8' ),
			'url'  => rtrim( (string) $details->siteurl, '/' ),
		];
	}

	return $out;
}

// ---------------------------------------------------------------------------
// Press Photo CPT — high-resolution images for press / editorial reuse.
// ---------------------------------------------------------------------------

function irg_register_press_photo_cpt(): void {
	if ( ! is_main_site() ) {
		return;
	}

	register_post_type( 'press_photo', [
		'labels' => [
			'name'               => 'Press Photos',
			'singular_name'      => 'Press Photo',
			'add_new'            => 'Add New Press Photo',
			'add_new_item'       => 'Add New Press Photo',
			'edit_item'          => 'Edit Press Photo',
			'new_item'           => 'New Press Photo',
			'view_item'          => 'View Press Photo',
			'search_items'       => 'Search Press Photos',
			'not_found'          => 'No press photos found',
			'not_found_in_trash' => 'No press photos found in Trash',
			'all_items'          => 'All Press Photos',
			'menu_name'          => 'Press Photos',
		],
		'public'              => true,
		'has_archive'         => false,
		'rewrite'             => [ 'slug' => 'press-photos' ],
		'menu_icon'           => 'dashicons-camera',
		'menu_position'       => 6,
		'supports'            => [ 'title', 'thumbnail', 'custom-fields', 'revisions' ],
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'pressPhoto',
		'graphql_plural_name' => 'pressPhotos',
	] );
}

function irg_register_press_photo_taxonomy(): void {
	if ( ! is_main_site() ) {
		return;
	}

	register_taxonomy( 'photo_category', [ 'press_photo' ], [
		'labels' => [
			'name'          => 'Photo Categories',
			'singular_name' => 'Photo Category',
			'search_items'  => 'Search Photo Categories',
			'all_items'     => 'All Photo Categories',
			'parent_item'   => 'Parent Photo Category',
			'edit_item'     => 'Edit Photo Category',
			'add_new_item'  => 'Add New Photo Category',
			'menu_name'     => 'Categories',
		],
		'hierarchical'        => true,
		'public'              => true,
		'show_in_rest'        => true,
		'show_in_graphql'     => true,
		'graphql_single_name' => 'photoCategory',
		'graphql_plural_name' => 'photoCategories',
		'rewrite'             => [ 'slug' => 'photo-category' ],
	] );
}

function irg_seed_photo_category_terms(): void {
	if ( ! is_main_site() ) {
		return;
	}
	if ( get_option( 'irg_photo_category_terms_seeded' ) ) {
		return;
	}
	if ( ! taxonomy_exists( 'photo_category' ) ) {
		return;
	}

	$terms = [ 'Rally', 'Performance', 'Portrait', 'Historical', 'Media' ];
	foreach ( $terms as $term ) {
		if ( ! term_exists( $term, 'photo_category' ) ) {
			wp_insert_term( $term, 'photo_category' );
		}
	}

	update_option( 'irg_photo_category_terms_seeded', true );
}

function irg_register_press_photo_acf_fields(): void {
	if ( ! is_main_site() ) {
		return;
	}
	if ( ! function_exists( 'acf_add_local_field_group' ) ) {
		return;
	}

	acf_add_local_field_group( [
		'key'                   => 'group_irg_press_photo_fields',
		'title'                 => 'Press Photo Details',
		'fields'                => [
			[
				'key'             => 'field_irg_press_photo_image',
				'label'           => 'Photo',
				'name'            => 'photo',
				'type'            => 'image',
				'instructions'    => 'Upload a high-resolution image. WordPress will generate thumbnail and intermediate sizes automatically.',
				'required'        => 1,
				'return_format'   => 'array',
				'preview_size'    => 'medium',
				'library'         => 'all',
				'show_in_graphql' => 1,
			],
			[
				'key'             => 'field_irg_press_photo_credit',
				'label'           => 'Photographer Credit',
				'name'            => 'photographer_credit',
				'type'            => 'text',
				'instructions'    => 'How the photographer should be credited (e.g. "Photo: Jane Smith"). Leave blank if unknown.',
				'required'        => 0,
				'show_in_graphql' => 1,
			],
			[
				'key'             => 'field_irg_press_photo_caption',
				'label'           => 'Caption',
				'name'            => 'caption',
				'type'            => 'textarea',
				'instructions'    => 'A short description of what is happening in the photo.',
				'required'        => 0,
				'rows'            => 3,
				'new_lines'       => '',
				'show_in_graphql' => 1,
			],
			[
				'key'             => 'field_irg_press_photo_usage_rights',
				'label'           => 'Usage Rights',
				'name'            => 'usage_rights',
				'type'            => 'text',
				'instructions'    => 'Licensing terms shown on the lightbox / download page.',
				'required'        => 0,
				'default_value'   => 'Free for editorial use with credit to the International Raging Grannies',
				'show_in_graphql' => 1,
			],
		],
		'location'              => [
			[
				[
					'param'    => 'post_type',
					'operator' => '==',
					'value'    => 'press_photo',
				],
			],
		],
		'menu_order'            => 0,
		'position'              => 'normal',
		'style'                 => 'default',
		'label_placement'       => 'top',
		'instruction_placement' => 'label',
		'active'                => true,
		'show_in_rest'          => 1,
		'show_in_graphql'       => 1,
		'graphql_field_name'    => 'pressPhotoDetails',
	] );
}

// ---------------------------------------------------------------------------
// Upload size — WP defaults the multisite cap to 1500 KB (~1.5 MB) and the
// per-request cap to whatever PHP allows. Press photos and granny photography
// routinely exceed that. Raise WP's logical floor to 10 MB so admins can
// upload reasonably sized images without bumping into the multisite cap.
//
// PHP's own `upload_max_filesize` and `post_max_size` are server-controlled
// and not affected by these filters; if PHP is capped below 10 MB the host's
// PHP settings (php.ini / .user.ini / cPanel) need a matching bump.
// ---------------------------------------------------------------------------

const IRG_UPLOAD_FLOOR_BYTES = 10 * 1024 * 1024; // 10 MB

function irg_upload_size_limit( $size ) {
	return max( (int) $size, IRG_UPLOAD_FLOOR_BYTES );
}

function irg_multisite_upload_maxk( $value ) {
	$floor_kb = (int) ( IRG_UPLOAD_FLOOR_BYTES / 1024 );
	return max( (int) $value, $floor_kb );
}

// ---------------------------------------------------------------------------
// Disable WP's "big image" auto-scaling (default: 2560px longest side) for
// uploads attached to a press_photo post. Editorial download links need the
// original full-resolution file, not the WP-scaled stand-in.
//
// Detection: media-library uploads pass the parent post id in $_REQUEST as
// `post_id`. Falls back to wp_get_post_parent_id() if the attachment has
// already been linked. Non-press uploads keep the default behaviour so blog
// images / song featured photos still get auto-shrunk for performance.
// ---------------------------------------------------------------------------

function irg_press_photo_no_big_image( $threshold, $imagesize = [], $file = '', $attachment_id = 0 ) {
	if ( irg_upload_is_for_press_photo( (int) $attachment_id ) ) {
		return false;
	}
	return $threshold;
}

function irg_upload_is_for_press_photo( int $attachment_id ): bool {
	if ( ! empty( $_REQUEST['post_id'] ) ) {
		$parent_id = (int) $_REQUEST['post_id'];
		if ( $parent_id && get_post_type( $parent_id ) === 'press_photo' ) {
			return true;
		}
	}
	if ( $attachment_id ) {
		$linked = (int) wp_get_post_parent_id( $attachment_id );
		if ( $linked && get_post_type( $linked ) === 'press_photo' ) {
			return true;
		}
	}
	return false;
}

// ---------------------------------------------------------------------------
// Contact form endpoint — receives the /contact/ form, verifies Cloudflare
// Turnstile server-side, and forwards to press@raginggrannies.org via
// wp_mail. Public endpoint; Turnstile + a honeypot field are the gates.
//
// Required server-side config: define( 'IRG_TURNSTILE_SECRET', '...' ) in
// wp-config.php (set via SSH). The matching public site key lives in
// PUBLIC_TURNSTILE_SITEKEY in the Astro env vars.
// ---------------------------------------------------------------------------

const IRG_CONTACT_TO       = 'press@raginggrannies.org';
const IRG_CONTACT_MAX_NAME = 200;
const IRG_CONTACT_MAX_MSG  = 8000;

/**
 * Public Cloudflare Turnstile sitekey, or empty string if not
 * configured. Sitekey is not a secret — safe to render in the page —
 * but lives in wp-config.php alongside the secret for consistency.
 */
function irg_turnstile_sitekey(): string {
	return defined( 'IRG_TURNSTILE_SITEKEY' ) ? (string) IRG_TURNSTILE_SITEKEY : '';
}

/**
 * Verify a Cloudflare Turnstile token against siteverify. Returns
 * true on success, or a WP_Error describing the failure (with an HTTP
 * status code in its data) on misconfiguration, missing token,
 * network failure, or a token rejected by Cloudflare. Reads the
 * secret from IRG_TURNSTILE_SECRET.
 *
 * Both the hub (irg_handle_contact) and the gaggle subsite contact
 * form (tbl_handle_contact_submit in the bulletin-local theme) rely
 * on this helper so spam policy stays in one place.
 */
function irg_verify_turnstile( string $token ) {
	$secret = defined( 'IRG_TURNSTILE_SECRET' ) ? (string) IRG_TURNSTILE_SECRET : '';
	if ( $secret === '' ) {
		return new WP_Error( 'irg_turnstile_unset', 'Spam protection is misconfigured. Please email us directly.', [ 'status' => 503 ] );
	}
	if ( $token === '' ) {
		return new WP_Error( 'irg_turnstile_missing', 'Spam check did not load. Please refresh and try again.', [ 'status' => 400 ] );
	}
	$verify = wp_remote_post( 'https://challenges.cloudflare.com/turnstile/v0/siteverify', [
		'timeout' => 10,
		'body'    => [
			'secret'   => $secret,
			'response' => $token,
			'remoteip' => isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '',
		],
	] );
	if ( is_wp_error( $verify ) ) {
		return new WP_Error( 'irg_turnstile_net', 'Could not verify the spam check. Please try again.', [ 'status' => 502 ] );
	}
	$body = json_decode( (string) wp_remote_retrieve_body( $verify ), true );
	if ( ! is_array( $body ) || empty( $body['success'] ) ) {
		return new WP_Error( 'irg_turnstile_fail', 'Spam check failed. Please refresh and try again.', [ 'status' => 400 ] );
	}
	return true;
}

function irg_register_contact_endpoint(): void {
	register_rest_route( 'irg/v1', '/contact', [
		'methods'             => 'POST',
		'callback'            => 'irg_handle_contact',
		'permission_callback' => '__return_true',
	] );
}

function irg_contact_origin_allowed( string $origin ): bool {
	$allowlist = [
		'https://raginggrannies.org',
		'https://www.raginggrannies.org',
		'https://raginggrannies.net',
		'https://www.raginggrannies.net',
		'https://raginggrannies.international',
		'https://www.raginggrannies.international',
	];
	if ( in_array( $origin, $allowlist, true ) ) {
		return true;
	}
	if ( preg_match( '#^http://localhost(:\d+)?$#', $origin ) ) {
		return true;
	}
	if ( preg_match( '#^https?://[a-z0-9-]+\.pages\.dev$#i', $origin ) ) {
		return true;
	}
	return false;
}

function irg_contact_cors_headers( $served, $result, $request, $server ) {
	if ( strpos( $request->get_route(), '/irg/v1/contact' ) !== 0 ) {
		return $served;
	}
	$origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? (string) $_SERVER['HTTP_ORIGIN'] : '';
	if ( $origin && irg_contact_origin_allowed( $origin ) ) {
		header( "Access-Control-Allow-Origin: {$origin}" );
		header( 'Access-Control-Allow-Methods: POST, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Content-Type' );
		header( 'Vary: Origin' );
	}
	return $served;
}

function irg_handle_contact( WP_REST_Request $req ) {
	$name    = sanitize_text_field( (string) $req->get_param( 'name' ) );
	$email   = sanitize_email( (string) $req->get_param( 'email' ) );
	$message = trim( (string) $req->get_param( 'message' ) );
	$hp      = (string) $req->get_param( 'hp' );
	$token   = (string) $req->get_param( 'cf-turnstile-response' );

	// Honeypot: real browsers never fill this. Silent success so bots don't learn.
	if ( $hp !== '' ) {
		return [ 'ok' => true ];
	}

	if ( $name === '' || $message === '' ) {
		return new WP_Error( 'irg_required', 'Name and message are required.', [ 'status' => 400 ] );
	}
	if ( ! is_email( $email ) ) {
		return new WP_Error( 'irg_email', 'A valid email is required.', [ 'status' => 400 ] );
	}
	if ( strlen( $name ) > IRG_CONTACT_MAX_NAME || strlen( $message ) > IRG_CONTACT_MAX_MSG ) {
		return new WP_Error( 'irg_too_long', 'That message is longer than we accept here. Please email us directly.', [ 'status' => 400 ] );
	}

	$verified = irg_verify_turnstile( $token );
	if ( is_wp_error( $verified ) ) {
		return $verified;
	}

	$subject = '[Contact form] from ' . wp_strip_all_tags( $name );
	$body    = "Name:    {$name}\nEmail:   {$email}\n\n— Message —\n{$message}\n\n---\nSent via the contact form on raginggrannies.org\n";
	$headers = [
		'Content-Type: text/plain; charset=UTF-8',
		'Reply-To: ' . sprintf( '%s <%s>', $name, $email ),
	];

	$sent = wp_mail( IRG_CONTACT_TO, $subject, $body, $headers );
	if ( ! $sent ) {
		return new WP_Error( 'irg_mail_fail', 'Could not send the message. Please email us directly.', [ 'status' => 500 ] );
	}

	return [ 'ok' => true ];
}

// ---------------------------------------------------------------------------
// Song submission endpoint (D031) — granny-only form at /submit/ POSTs here.
// Creates a draft Song, attaches taxonomy terms (creating tune/songwriter/
// gaggle on the fly if new; issues must already exist), emails the librarian.
// ---------------------------------------------------------------------------

const IRG_SUBMIT_TO = 'songlibrarian@raginggrannies.org';

function irg_register_submit_song_endpoint(): void {
	register_rest_route( 'irg/v1', '/submit-song', [
		'methods'             => 'POST',
		'callback'            => 'irg_handle_submit_song',
		'permission_callback' => '__return_true',
	] );
}

function irg_submit_song_cors_headers( $served, $result, $request, $server ) {
	if ( strpos( $request->get_route(), '/irg/v1/submit-song' ) !== 0 ) {
		return $served;
	}
	$origin = isset( $_SERVER['HTTP_ORIGIN'] ) ? (string) $_SERVER['HTTP_ORIGIN'] : '';
	if ( $origin && irg_contact_origin_allowed( $origin ) ) {
		header( "Access-Control-Allow-Origin: {$origin}" );
		header( 'Access-Control-Allow-Methods: POST, OPTIONS' );
		header( 'Access-Control-Allow-Headers: Content-Type' );
		header( 'Vary: Origin' );
	}
	return $served;
}

function irg_handle_submit_song( WP_REST_Request $req ) {
	// Songs CPT lives on the main site only. Block off-network attempts cleanly.
	if ( ! is_main_site() ) {
		return new WP_Error( 'irg_wrong_site', 'Songs can only be submitted on the main site.', [ 'status' => 400 ] );
	}

	$title      = sanitize_text_field( (string) $req->get_param( 'title' ) );
	$tune       = sanitize_text_field( (string) $req->get_param( 'tune' ) );
	$lyrics_raw = (string) $req->get_param( 'lyrics' );
	$songwriter = sanitize_text_field( (string) $req->get_param( 'songwriter' ) );
	$gaggle     = sanitize_text_field( (string) $req->get_param( 'gaggle' ) );
	$issues     = $req->get_param( 'issues' );

	// Optional fields. All four may be empty.
	$key_starting_note = sanitize_text_field( (string) $req->get_param( 'key_starting_note' ) );
	$youtube_link      = esc_url_raw( trim( (string) $req->get_param( 'youtube_link' ) ) );
	$date_written      = sanitize_text_field( (string) $req->get_param( 'date_written' ) );
	$source_notes      = sanitize_text_field( (string) $req->get_param( 'source_notes' ) );

	if ( $title === '' || $tune === '' || $songwriter === '' || $gaggle === '' ) {
		return new WP_Error( 'irg_required', 'Title, tune, songwriter, and gaggle are all required.', [ 'status' => 400 ] );
	}
	if ( trim( wp_strip_all_tags( $lyrics_raw ) ) === '' ) {
		return new WP_Error( 'irg_lyrics_required', 'Lyrics are required.', [ 'status' => 400 ] );
	}
	if ( ! is_array( $issues ) || count( $issues ) === 0 ) {
		return new WP_Error( 'irg_issues_required', 'At least one issue is required.', [ 'status' => 400 ] );
	}
	if ( $youtube_link !== '' && ! irg_is_youtube_url( $youtube_link ) ) {
		return new WP_Error( 'irg_bad_youtube', 'YouTube link must be a youtube.com or youtu.be URL.', [ 'status' => 400 ] );
	}

	// Allow only the formatting marks the songbook treats as performance cues
	// (bold = strong beat, italic = inflection, underline = held). Strip the rest.
	$allowed_html = [
		'p'      => [],
		'br'     => [],
		'strong' => [],
		'b'      => [],
		'em'     => [],
		'i'      => [],
		'u'      => [],
	];
	$lyrics = wp_kses( $lyrics_raw, $allowed_html );

	$post_id = wp_insert_post( [
		'post_type'   => 'song',
		'post_status' => 'draft',
		'post_title'  => $title,
	], true );
	if ( is_wp_error( $post_id ) ) {
		return new WP_Error( 'irg_post_fail', 'Could not create the song draft.', [ 'status' => 500 ] );
	}

	if ( function_exists( 'update_field' ) ) {
		update_field( 'field_irg_lyrics', $lyrics, $post_id );
		// Optional ACF fields. Only write when the submitter provided a value
		// so empty strings don't overwrite future librarian edits.
		if ( $key_starting_note !== '' ) {
			update_field( 'field_irg_key_or_starting_note', $key_starting_note, $post_id );
		}
		if ( $youtube_link !== '' ) {
			update_field( 'field_irg_youtube_link', $youtube_link, $post_id );
		}
		if ( $date_written !== '' ) {
			update_field( 'field_irg_date_written_or_updated', $date_written, $post_id );
		}
		if ( $source_notes !== '' ) {
			update_field( 'field_irg_source_notes', $source_notes, $post_id );
		}
	} else {
		update_post_meta( $post_id, 'lyrics', $lyrics );
		if ( $key_starting_note !== '' ) update_post_meta( $post_id, 'key_or_starting_note', $key_starting_note );
		if ( $youtube_link !== '' )      update_post_meta( $post_id, 'youtube_link', $youtube_link );
		if ( $date_written !== '' )      update_post_meta( $post_id, 'date_written_or_updated', $date_written );
		if ( $source_notes !== '' )      update_post_meta( $post_id, 'source_notes', $source_notes );
	}

	irg_submit_attach_term( $post_id, 'tune', $tune );
	irg_submit_attach_term( $post_id, 'songwriter', $songwriter );
	irg_submit_attach_term( $post_id, 'gaggle', $gaggle );

	$issue_ids       = [];
	$unknown_issues  = [];
	foreach ( (array) $issues as $issue_name ) {
		$issue_name = sanitize_text_field( (string) $issue_name );
		if ( $issue_name === '' ) {
			continue;
		}
		$term = term_exists( $issue_name, 'issue' );
		if ( $term ) {
			$issue_ids[] = (int) ( is_array( $term ) ? $term['term_id'] : $term );
		} else {
			$unknown_issues[] = $issue_name;
		}
	}
	if ( $issue_ids ) {
		wp_set_object_terms( $post_id, $issue_ids, 'issue' );
	}
	if ( $unknown_issues ) {
		error_log( '[irg-submit] Unknown issues for post ' . $post_id . ': ' . implode( ', ', $unknown_issues ) );
	}

	irg_submit_send_notification( $post_id, [
		'title'             => $title,
		'tune'              => $tune,
		'songwriter'        => $songwriter,
		'gaggle'            => $gaggle,
		'issues'            => array_map( 'sanitize_text_field', (array) $issues ),
		'key_starting_note' => $key_starting_note,
		'youtube_link'      => $youtube_link,
		'date_written'      => $date_written,
	] );

	return [ 'ok' => true, 'post_id' => $post_id ];
}

// True if the URL contains a YouTube hostname (youtube.com or youtu.be).
// Used to reject obvious non-YouTube URLs in the optional video fields.
function irg_is_youtube_url( string $url ): bool {
	$url = strtolower( $url );
	return strpos( $url, 'youtube.com' ) !== false || strpos( $url, 'youtu.be' ) !== false;
}

// Look up a term in the given taxonomy. Create it if missing. Attach to the post.
// Used for tune / songwriter / gaggle (open taxonomies — submitters can extend).
function irg_submit_attach_term( int $post_id, string $taxonomy, string $name ): void {
	$name = trim( $name );
	if ( $name === '' ) {
		return;
	}
	$term = term_exists( $name, $taxonomy );
	if ( ! $term ) {
		$term = wp_insert_term( $name, $taxonomy );
	}
	if ( is_wp_error( $term ) ) {
		error_log( '[irg-submit] term op failed for ' . $taxonomy . ' "' . $name . '": ' . $term->get_error_message() );
		return;
	}
	$term_id = (int) ( is_array( $term ) ? $term['term_id'] : $term );
	wp_set_object_terms( $post_id, [ $term_id ], $taxonomy );
}

function irg_submit_send_notification( int $post_id, array $fields ): void {
	$edit_url = admin_url( 'post.php?post=' . $post_id . '&action=edit' );
	$subject  = 'New song submission: ' . $fields['title'];
	$body     = "A new song has been submitted for review.\n\n";
	$body    .= "Title:      {$fields['title']}\n";
	$body    .= "Tune:       {$fields['tune']}\n";
	$body    .= "Songwriter: {$fields['songwriter']}\n";
	$body    .= "Gaggle:     {$fields['gaggle']}\n";
	$body    .= 'Issues:     ' . implode( ', ', $fields['issues'] ) . "\n";
	if ( ! empty( $fields['key_starting_note'] ) ) {
		$body .= "Key/Note:   {$fields['key_starting_note']}\n";
	}
	if ( ! empty( $fields['youtube_link'] ) ) {
		$body .= "YouTube:    {$fields['youtube_link']}\n";
	}
	if ( ! empty( $fields['date_written'] ) ) {
		$body .= "Written:    {$fields['date_written']}\n";
	}
	$body    .= "\nReview and publish: {$edit_url}\n";
	$headers  = [ 'Content-Type: text/plain; charset=UTF-8' ];

	$sent = wp_mail( IRG_SUBMIT_TO, $subject, $body, $headers );
	if ( ! $sent ) {
		// Non-fatal. The draft was already created; the email is a notification, not a gate.
		error_log( '[irg-submit] wp_mail failed for post ' . $post_id );
	}
}

// ---------------------------------------------------------------------------
// Subsite-songs cross-site query — lets opted-in subsites display "their"
// songs (filtered by gaggle taxonomy term-slug) on a local /songs/ page.
// Songs live exclusively on the main site as a `song` CPT, so the build
// path runs in main-site context. The result is cached as a network-wide
// site option, keyed by gaggle term-slug, so the read path never has to
// switch_to_blog — `get_site_option()` is enough.
//
// Cache invalidation is hooked on the main site for: save, delete, term
// reassignment (set_object_terms with taxonomy=gaggle), and status
// transitions (publish/draft/trash).
// ---------------------------------------------------------------------------

function irg_subsite_songs_cache_key( string $gaggle_slug ): string {
	// Bump the suffix to invalidate every gaggle's cached song list.
	return 'irg_subsite_songs_' . sanitize_key( $gaggle_slug ) . '_v7';
}

/**
 * Find a single song by slug within the subsite cache. Walks the cached
 * list (alphabetical, ~100s of entries — cheap). Returns null if missing.
 *
 * @return array<string, mixed>|null
 */
function irg_get_subsite_song_by_slug( string $gaggle_slug, string $song_slug ): ?array {
	$song_slug = sanitize_title( $song_slug );
	if ( $song_slug === '' ) {
		return null;
	}
	foreach ( irg_get_subsite_songs( $gaggle_slug ) as $song ) {
		if ( ( $song['slug'] ?? '' ) === $song_slug ) {
			return $song;
		}
	}
	return null;
}

/**
 * Read path. Subsites call this with their own slug. Returns plain arrays.
 * If the network-wide cache miss, builds it under switch_to_blog.
 *
 * @return array<int, array<string, mixed>>
 */
function irg_get_subsite_songs( string $gaggle_slug ): array {
	$gaggle_slug = sanitize_key( $gaggle_slug );
	if ( $gaggle_slug === '' ) {
		return [];
	}

	$key    = irg_subsite_songs_cache_key( $gaggle_slug );
	$cached = get_site_option( $key, null );
	if ( is_array( $cached ) ) {
		return $cached;
	}

	if ( ! is_main_site() ) {
		$switched = true;
		switch_to_blog( get_main_site_id() );
	} else {
		$switched = false;
	}
	try {
		// `init` fired earlier in subsite context, where the song CPT and
		// gaggle taxonomy registration is guarded by `is_main_site()` and
		// returns early. We're now switched to the main site — force the
		// registration so WP_Query and get_term_by can see them.
		if ( ! post_type_exists( 'song' ) ) {
			irg_register_song_cpt();
		}
		if ( ! taxonomy_exists( 'gaggle' ) ) {
			irg_register_song_taxonomies();
		}
		$built = irg_build_subsite_songs_cache( $gaggle_slug );
		// Only persist non-empty results. Caching an empty array is a
		// footgun: a transient registration glitch becomes a sticky
		// "always 0 songs" state until something explicitly invalidates.
		if ( ! empty( $built ) ) {
			update_site_option( $key, $built );
		}
	} finally {
		if ( $switched ) {
			restore_current_blog();
		}
	}
	return $built;
}

/**
 * Build the song list for a gaggle. MUST run in main-site context (the
 * caller is responsible for switch_to_blog if needed). Returns plain
 * arrays — caller is decoupled from WP_Post objects.
 *
 * @return array<int, array<string, mixed>>
 */
function irg_build_subsite_songs_cache( string $gaggle_slug ): array {
	if ( ! is_main_site() ) {
		// Defensive: schema only exists on the main site.
		return [];
	}

	$term = get_term_by( 'slug', $gaggle_slug, 'gaggle' );
	if ( ! ( $term instanceof WP_Term ) ) {
		return [];
	}

	$q = new WP_Query( [
		'post_type'      => 'song',
		'post_status'    => 'publish',
		'posts_per_page' => -1,
		'no_found_rows'  => true,
		'orderby'        => 'title',
		'order'          => 'ASC',
		'tax_query'      => [
			[
				'taxonomy' => 'gaggle',
				'field'    => 'term_id',
				'terms'    => [ $term->term_id ],
			],
		],
	] );

	$out = [];
	foreach ( $q->posts as $p ) {
		$lyrics = '';
		if ( function_exists( 'get_field' ) ) {
			$lyrics = (string) get_field( 'lyrics', $p->ID );
		}
		if ( $lyrics === '' ) {
			$lyrics = (string) get_post_meta( $p->ID, 'lyrics', true );
		}
		// Lyrics ship as-stored. The migrated field has known issues
		// (orphan "br>" fragments, mixed entity encoding, malformed
		// pseudo-tags) but every regex-based sanitizer pass we tried
		// surfaced new edge cases. The fix belongs at the content level,
		// not the display.
		$lyrics_excerpt = wp_trim_words(
			wp_strip_all_tags( $lyrics, true ),
			30,
			'…'
		);

		$youtube_link = '';
		if ( function_exists( 'get_field' ) ) {
			$youtube_link = (string) get_field( 'youtube_link', $p->ID );
		}
		if ( $youtube_link === '' ) {
			$youtube_link = (string) get_post_meta( $p->ID, 'youtube_link', true );
		}

		$songwriters = [];
		foreach ( wp_get_object_terms( $p->ID, 'songwriter' ) as $t ) {
			if ( $t instanceof WP_Term ) {
				$songwriters[] = $t->name;
			}
		}
		$tunes = [];
		foreach ( wp_get_object_terms( $p->ID, 'tune' ) as $t ) {
			if ( $t instanceof WP_Term ) {
				$tunes[] = $t->name;
			}
		}
		$issues = [];
		foreach ( wp_get_object_terms( $p->ID, 'issue' ) as $t ) {
			if ( $t instanceof WP_Term ) {
				$issues[] = $t->name;
			}
		}

		$year = '';
		if ( ! empty( $p->post_date ) ) {
			$year = substr( $p->post_date, 0, 4 );
		}

		$out[] = [
			'title'          => get_the_title( $p ),
			'slug'           => $p->post_name,
			'year'           => $year,
			'songwriters'    => $songwriters,
			'tunes'          => $tunes,
			'issues'         => $issues,
			'lyrics'         => $lyrics,
			'lyrics_excerpt' => $lyrics_excerpt,
			'youtube_link'   => $youtube_link,
			'detail_url'     => rtrim( IRG_PUBLIC_HOST, '/' ) . '/songs/' . $p->post_name . '/',
		];
	}
	return $out;
}

/**
 * For a given song post ID (in main-site context), return the slugs of its
 * gaggle terms. Used by the cache-busters.
 *
 * @return string[]
 */
function irg_song_gaggle_slugs( int $post_id ): array {
	$slugs = [];
	$terms = wp_get_object_terms( $post_id, 'gaggle' );
	if ( is_array( $terms ) ) {
		foreach ( $terms as $t ) {
			if ( $t instanceof WP_Term ) {
				$slugs[] = $t->slug;
			}
		}
	}
	return $slugs;
}

function irg_subsite_songs_bust_for_slugs( array $gaggle_slugs ): void {
	foreach ( array_unique( $gaggle_slugs ) as $slug ) {
		delete_site_option( irg_subsite_songs_cache_key( (string) $slug ) );
	}
}

function irg_subsite_songs_bust_on_save( int $post_id ): void {
	if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
		return;
	}
	if ( get_post_type( $post_id ) !== 'song' ) {
		return;
	}
	irg_subsite_songs_bust_for_slugs( irg_song_gaggle_slugs( $post_id ) );
}

function irg_subsite_songs_bust_on_delete( int $post_id ): void {
	if ( get_post_type( $post_id ) !== 'song' ) {
		return;
	}
	irg_subsite_songs_bust_for_slugs( irg_song_gaggle_slugs( $post_id ) );
}

/**
 * Catches gaggle term reassignment, including via Quick Edit.
 *
 * @param int    $object_id
 * @param array  $terms
 * @param array  $tt_ids
 * @param string $taxonomy
 */
function irg_subsite_songs_bust_on_term_change( int $object_id, $terms, $tt_ids, string $taxonomy ): void {
	if ( $taxonomy !== 'gaggle' ) {
		return;
	}
	if ( get_post_type( $object_id ) !== 'song' ) {
		return;
	}
	// Bust both the new gaggles AND the previously-cached ones — but at
	// this hook we only know the new set. Simpler: walk every cached
	// gaggle option and let the next read rebuild on demand. With ~80
	// gaggles and a tiny option table it's cheap.
	$slugs = [];
	$all_terms = get_terms( [
		'taxonomy'   => 'gaggle',
		'hide_empty' => false,
		'fields'     => 'slugs',
	] );
	if ( is_array( $all_terms ) ) {
		$slugs = $all_terms;
	}
	irg_subsite_songs_bust_for_slugs( $slugs );
}

function irg_subsite_songs_bust_on_status( string $new_status, string $old_status, $post ): void {
	if ( ! ( $post instanceof WP_Post ) || $post->post_type !== 'song' ) {
		return;
	}
	if ( $new_status === $old_status ) {
		return;
	}
	irg_subsite_songs_bust_for_slugs( irg_song_gaggle_slugs( (int) $post->ID ) );
}
