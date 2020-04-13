<?php

function fwc_add_custom_taxonomies() {
  register_taxonomy('censorship_status', 'post', array(
    'show_in_rest' => true,
    'hierarchical' => false,
    'labels' => array(
      'name' => _x( 'Censorship Statuses', 'taxonomy general name' ),
      'singular_name' => _x( 'Censorship Status', 'taxonomy singular name' ),
      'search_items' =>  __( 'Search By Censorship Status' ),
      'all_items' => __( 'All Censorship Statuses' ),
      'edit_item' => __( 'Edit Censorship Status' ),
      'update_item' => __( 'Update Censorship Status' ),
      'add_new_item' => __( 'Add New Censorship Status' ),
      'new_item_name' => __( 'New Censorship Status' ),
      'menu_name' => __( 'Censorship Statuses' ),
    ),
    'rewrite' => array(
      'slug' => 'censorship',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));

  register_taxonomy('translation_status', 'post', array(
    'show_in_rest' => true,
    'hierarchical' => false,
    'labels' => array(
      'name' => _x( 'Translation Statuses', 'taxonomy general name' ),
      'singular_name' => _x( 'Translation Status', 'taxonomy singular name' ),
      'search_items' =>  __( 'Search By Translation Status' ),
      'all_items' => __( 'All Translation Statuses' ),
      'edit_item' => __( 'Edit Translation Status' ),
      'update_item' => __( 'Update Translation Status' ),
      'add_new_item' => __( 'Add New Translation Status' ),
      'new_item_name' => __( 'New Translation Status' ),
      'menu_name' => __( 'Translation Statuses' ),
    ),
    'rewrite' => array(
      'slug' => 'translation',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));

  register_taxonomy('search_language', 'post', array(
    'show_in_rest' => true,
    'hierarchical' => true,
    'labels' => array(
      'name' => _x( 'Search Languages', 'taxonomy general name' ),
      'singular_name' => _x( 'Search Language', 'taxonomy singular name' ),
      'search_items' =>  __( 'Search By Search Language' ),
      'all_items' => __( 'All Search Languages' ),
      'edit_item' => __( 'Edit Search Language' ),
      'update_item' => __( 'Update Search Language' ),
      'add_new_item' => __( 'Add New Search Language' ),
      'new_item_name' => __( 'New Search Language' ),
      'menu_name' => __( 'Search Languages' ),
    ),
    'rewrite' => array(
      'slug' => 'search-language',
      'with_front' => false,
      'hierarchical' => true
    ),
  ));
  register_taxonomy('search_engine', 'post', array(
    'show_in_rest' => true,
    'hierarchical' => false,
    'labels' => array(
      'name' => _x( 'Search Engines', 'taxonomy general name' ),
      'singular_name' => _x( 'Search Engine', 'taxonomy singular name' ),
      'search_items' =>  __( 'Search By Search Engine' ),
      'all_items' => __( 'All Search Engines' ),
      'edit_item' => __( 'Edit Search Engine' ),
      'update_item' => __( 'Update Search Engine' ),
      'add_new_item' => __( 'Add New Search Engine' ),
      'new_item_name' => __( 'New Search Engine' ),
      'menu_name' => __( 'Search Engines' ),
    ),
    'rewrite' => array(
      'slug' => 'search-engine',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));
  register_taxonomy('locations', 'post', array(
    'show_in_rest' => true,
    'hierarchical' => false,
    'labels' => array(
      'name' => _x( 'Locations', 'taxonomy general name' ),
      'singular_name' => _x( 'Location', 'taxonomy singular name' ),
      'search_items' =>  __( 'Search By Location' ),
      'all_items' => __( 'All Locations' ),
      'edit_item' => __( 'Edit Location' ),
      'update_item' => __( 'Update Location' ),
      'add_new_item' => __( 'Add New Location' ),
      'new_item_name' => __( 'New Location' ),
      'menu_name' => __( 'Locations' ),
    ),
    'rewrite' => array(
      'slug' => 'location',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));
}

function fwc_set_censorship_status($post_id, $status) {
  wp_set_post_terms( $post_id, $status, 'censorship_status', false );
}

function fwc_set_translation_status($post_id, $status) {
  wp_set_post_terms( $post_id, $status, 'translation_status', false );
}

function fwc_set_search_language($post_id, $lang) {
  $taxonomy = 'search_language';
  $lower_lang = strtolower($lang);
  $slug = preg_replace('/[^A-Za-z0-9-]+/', '-', $lower_lang);

  if ($lower_lang != 'english' && !strpos($lower_lang, 'chinese')) {
    $term = term_exists( $lang, $taxonomy );

    if (!$term) {
      $ol_title = 'Other Language';
      $ol_slug = 'other-language';

      $ol = term_exists('Other Language', $taxonomy);

      if (! $ol) {
        $ol = wp_insert_term( 'Other Language', $taxonomy, array(
          'slug' => 'other-language'
        ));
      }

      $ol_id = $ol['term_id'];
      $term = wp_insert_term( $lang, $taxonomy, $args = array(
        'slug' => $slug,
        'parent' => $ol_id
      ));
    }
  }
  wp_set_post_terms( $post_id, $term['term_id'], $taxonomy, false );
}

function fwc_set_search_engine($post_id, $search_engine) {
  wp_set_post_terms( $post_id, $search_engine, 'search_engine', false);
}

function fwc_set_location($post_id, $location) {
  wp_set_post_terms( $post_id, $location, 'locations', false);
}

function fwc_set_banned($post_id, $banned) {
  $term = get_terms(array('slug' => 'banned'));
  if (!$term) {
    $term = wp_insert_term('banned', 'post_tag');
  }
  if ($banned === 'true' || $banned === true) {
    wp_set_post_terms( $post_id, 'banned', 'post_tag', true);
  } else {
    wp_delete_term($term->term_id, 'post_tag');
  }
}

function fwc_set_sensitive($post_id, $sensitive) {
  $term = get_terms(array('slug' => 'sensitive'));
  if (!$term) {
    $term = wp_insert_term('sensitive', 'post_tag');
  }
  if ($sensitive === 'true' || $sensitive === true) {
    wp_set_post_terms( $post_id, 'sensitive', 'post_tag', true);
  } else {
    wp_delete_term($term->term_id, 'post_tag');
  }
}

?>
