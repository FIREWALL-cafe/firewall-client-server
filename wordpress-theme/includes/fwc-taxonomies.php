<?php

function fwc_add_custom_taxonomies() {
  register_taxonomy('censorship_status', 'post', array(
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
    'hierarchical' => false,
    // This array of options controls the labels displayed in the WordPress Admin UI
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
    // Control the slugs used for this taxonomy
    'rewrite' => array(
      'slug' => 'search-language',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));
  register_taxonomy('search_engine', 'post', array(
    // Hierarchical taxonomy (like categories)
    'hierarchical' => false,
    // This array of options controls the labels displayed in the WordPress Admin UI
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
    // Control the slugs used for this taxonomy
    'rewrite' => array(
      'slug' => 'search-engine',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));
  register_taxonomy('locations', 'post', array(
    // Hierarchical taxonomy (like categories)
    'hierarchical' => false,
    // This array of options controls the labels displayed in the WordPress Admin UI
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
    // Control the slugs used for this taxonomy
    'rewrite' => array(
      'slug' => 'location',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));
  // register_taxonomy('banned_status', 'post', array(
  //   // Hierarchical taxonomy (like categories)
  //   'hierarchical' => false,
  //   // This array of options controls the labels displayed in the WordPress Admin UI
  //   'labels' => array(
  //     'name' => _x( 'Banned Status', 'taxonomy general name' ),
  //     'singular_name' => _x( 'Banned Status', 'taxonomy singular name' ),
  //     'search_items' =>  __( 'Search By Banned Status' ),
  //     'all_items' => __( 'All Banned Statuses' ),
  //     'edit_item' => __( 'Edit Banned Statuses' ),
  //     'update_item' => __( 'Update Banned Statuses' ),
  //     'add_new_item' => __( 'Add New Banned Status' ),
  //     'new_item_name' => __( 'New Banned Status' ),
  //     'menu_name' => __( 'Banned Status' ),
  //   ),
  //   // Control the slugs used for this taxonomy
  //   'rewrite' => array(
  //     'slug' => 'banned',
  //     'with_front' => false,
  //     'hierarchical' => false
  //   ),
  // ));
}

function fwc_set_censorship_status($post_id, $status) {
  wp_set_post_terms( $post_id, $status, 'censorship_status', false );
}

function fwc_set_translation_status($post_id, $status) {
  wp_set_post_terms( $post_id, $status, 'translation_status', false );
}

function fwc_set_search_language($post_id, $lang) {
  wp_set_post_terms( $post_id, $lang, 'search_language', false );
}

function fwc_set_search_engine($post_id, $search_engine) {
  wp_set_post_terms( $post_id, $search_engine, 'search_engine', false);
}

function fwc_set_location($post_id, $location) {
  wp_set_post_terms( $post_id, $location, 'locations', false);
}

// function fwc_set_banned_status($post_id, $status) {
//   wp_set_post_terms( $post_id, $status, 'banned_status', false);
// }

// function fwc_get_censorship_status($post_id) {
//   wp_get_post_terms($post_id, 'censorship_status');
// }

?>
