<?php

function fwc_get_search_count() {
  $timestamps = get_post_meta(get_the_ID(), 'timestamp');
  $count = count($timestamps);
  return $count;
}

function fwc_post_search_details() {
  $post_id = get_the_ID();

  $banned = get_the_terms($post_id, 'banned_status')[0];
  if ($banned && $banned->name == 'banned') {
    echo "Baidu has marked this search term as&nbsp;&nbsp;<a href=\"".get_term_link($banned->term_id)."\" class=\"post-tag\">$banned->name</a>.</br>";
  }

  $censorship_status = get_the_terms($post_id, 'censorship_status')[0];

  if ($censorship_status) {
    if ($censorship_status->name == 'censored' ||
        $censorship_status->name == 'not censored' ) {
      echo "Most people think this search term is&nbsp;&nbsp;<a href=\"".get_term_link($censorship_status->term_id)."\" class=\"post-tag\">$censorship_status->name</a>.</br>";
    } else if ($censorship_status->name == 'may be censored') {
      echo "People think this search term&nbsp;&nbsp;<a href=\"".get_term_link($censorship_status->term_id)."\" class=\"post-tag\">$censorship_status->name</a>.</br>";
    }
  }

  $terms = get_the_terms($post_id, 'post_tag');
  if ($terms) {
    foreach($terms as $term) {
      if ($term->name == 'nsfw') {
        echo "People think this search yields&nbsp;&nbsp;<a href=\"".get_term_link($term->term_id)."\" class=\"post-tag\">$term->name</a> results.<br>";
      } else if ($term->name == 'firewall bug') {
        echo "We think there might have been a&nbsp;&nbsp;<a href=\"".get_term_link($term->term_id)."\" class=\"post-tag\">$term->name</a> with this search.<br>";
      } else if ($term->name == 'lost in cultural translation') {
        echo "People think this search term gets&nbsp;&nbsp;<a href=\"".get_term_link($term->term_id)."\" class=\"post-tag\">$term->name</a>.<br>";
      }
    }
  }
}

function fwc_post_search_history() {
  $count = fwc_get_search_count();
  $initial_search_date = fwc_get_first_timestamp();

  // Display chart of search history here.
  if ($count > 1) {
  echo "<p>This term has been searched ".$count." times, most recently by ".fwc_get_latest_meta('client')." on ".fwc_format_date(fwc_get_latest_timestamp()).".</br>";
  echo "It was first searched by ".fwc_get_meta_by_timestamp('client', $initial_search_date)." on ".fwc_format_date($initial_search_date).".</br>";
  } else {
    echo "<p>This term was searched by ".fwc_get_latest_meta('client')." on ".fwc_format_date($initial_search_date).".</p>";
  }

  $location = get_the_terms(get_the_ID(), 'locations')[0];
  if ($location) {
    echo "<p>This search was conducted in&nbsp;&nbsp;<a href=\"".get_term_link($location->term_id)."\" class=\"post-tag\">$location->name</a>.</p>";
  }

  // echo "This is the [ranking]th most popular search using Firewall.</p>";
}

function fwc_post_search_language() {
  $post_id = get_the_ID();
  $search_language = get_the_terms($post_id, 'search_language')[0];
  $translation_status = get_the_terms($post_id, 'translation_status')[0];

  if ($search_language) {
    echo "The search language is&nbsp;&nbsp;<a href=\"".get_term_link($search_language->term_id)."\" class=\"post-tag\">$search_language->name</a>.&nbsp;&nbsp;";
  }

  if ($translation_status) {
    echo "Most people think this is a&nbsp;&nbsp;<a href=\"".get_term_link($translation_status->term_id)."\" class=\"post-tag\">$translation_status->name</a>.";
  }
}

function fwc_post_search_engine() {
  $search_engine = get_the_terms(get_the_ID(), 'search_engine')[0];
  if ($search_engine) {
    echo "This search was most recently performed using&nbsp;&nbsp;<a href=\"".get_term_link($search_engine->term_id)."\" class=\"post-tag\">$search_engine->name</a>.";
  } else {
    $search_engine = fwc_get_latest_meta('search_engine');
    echo "This search was most recently performed using ".ucwords($search_engine).".";
  }
}

function fwc_post_translation_history() {
  // $translation_history =
}

function fwc_get_reverse_search($slug) {
  $args = array(
    'name'        => $slug,
    'post_type'   => 'post',
    'post_status' => 'publish',
    'numberposts' => 1
  );
  $reverse_search = get_posts($args);
  if ($reverse_search) {
    $reverse_search = $reverse_search[0];
    $link = get_permalink($reverse_search->ID);

    $translation = fwc_get_latest_meta('translation', $reverse_search->ID);

    echo "<p>See reverse search: <a href=\"$link\">$slug / $translation </a></p>";
  }
}
