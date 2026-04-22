<?php
/**
 * Plugin Name: IRG Core
 * Description: Custom post types, taxonomies, and ACF fields for the International Raging Grannies multisite.
 * Version: 2.0.0
 * Author: Maya Bairey
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
		'Environment & Energy',
		'Gender Equity',
		'Government & Politics',
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
				'key'               => 'field_irg_tune',
				'label'             => 'Tune',
				'name'              => 'tune',
				'type'              => 'text',
				'instructions'      => 'The melody this song is sung to (e.g., "Old MacDonald Had a Farm").',
				'required'          => 0,
				'show_in_graphql'   => 1,
			],
			[
				'key'               => 'field_irg_songwriter',
				'label'             => 'Songwriter',
				'name'              => 'songwriter',
				'type'              => 'text',
				'instructions'      => 'Individual songwriter credit for display.',
				'required'          => 0,
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
