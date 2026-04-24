<?php
/**
 * Plugin Name: IRG Core
 * Plugin URI: https://linguainkmedia.com
 * Description: Custom post types, taxonomies, and ACF fields for the International Raging Grannies multisite.
 * Version: 3.0.0
 * Author: Lingua Ink Media
 * Author URI: https://linguainkmedia.com
 * Network: true
 * Requires PHP: 8.0
 * License: GPL-2.0-or-later
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_action( 'init', 'irg_register_song_cpt' );
add_action( 'init', 'irg_register_song_taxonomies' );
add_action( 'init', 'irg_relabel_posts_on_subsites' );
add_action( 'init', 'irg_seed_issue_terms' );
add_action( 'acf/include_fields', 'irg_register_acf_fields' );
add_action( 'admin_menu', 'irg_add_import_page' );

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
