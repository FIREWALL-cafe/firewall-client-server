<?php

function fwc_get_search_count() {
  $timestamps = get_post_meta(get_the_ID(), 'timestamp');
  $count = count($timestamps);
  return $count;
}

function fwc_post_search_details() {
  $post_id = get_the_ID();

  $banned = has_tag('banned', $post_id);
  $sensitive = has_tag('sensitive', $post_id);

  $censorship_status = get_the_terms($post_id, 'censorship_status')[0];
  $terms = get_the_terms($post_id, 'post_tag');

  if ($banned) {
    $banned = get_term(array( 'slug' => 'banned' ));
    echo "Baidu has marked this search term as&nbsp;&nbsp;<a href=\"".get_term_link($banned->term_id)."\" class=\"post-tag\">$banned->name</a>.</br>";
  }

  if ($sensitive) {
    $sensitive = get_term(array( 'slug' => 'sensitive' ));
    echo "We have determined that this is a&nbsp;&nbsp;<a href=\"".get_term_link($sensitive->term_id)."\" class=\"post-tag\">$sensitive->name</a> term.</br>";
  }

  if ($censorship_status) {
    if ($censorship_status->name == 'censored' ||
        $censorship_status->name == 'uncensored' ) {
      echo "Most people think this search term is&nbsp;&nbsp;<a href=\"".get_term_link($censorship_status->term_id)."\" class=\"post-tag\">$censorship_status->name</a>.</br>";
    } else if ($censorship_status->name == 'may be censored') {
      echo "People think this search term&nbsp;&nbsp;<a href=\"".get_term_link($censorship_status->term_id)."\" class=\"post-tag\">$censorship_status->name</a>.</br>";
    }
  }

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
  $client = fwc_get_latest_meta('client');
  $timestamp = fwc_format_date(fwc_get_latest_timestamp());
  $location = get_the_terms(get_the_ID(), 'locations');
  if (gettype($location) == 'array') {
    $location = $location[0];
  } else {
    $location = null;
  }
  $count = fwc_get_search_count();

  $initial_timestamp = fwc_get_first_timestamp();
  $initial_client = fwc_get_meta_by_timestamp('client', $initial_timestamp);
  $initial_search_date = fwc_format_date($initial_timestamp);
  $initial_search_location = fwc_get_meta_by_timestamp('location', $initial_timestamp);

  // Display chart of search history here.
  if ($count > 1) {
    echo "<p>This term has been searched $count times, most recently by $client on $timestamp";
    if ($location) { echo " in&nbsp;&nbsp;<a href=\"".get_term_link($location->term_id)."\" class=\"post-tag\">$location->name</a>"; }
    echo ".</br>";

    echo "It was first searched by $initial_client on $initial_search_date";
    if ($initial_search_location) {
      echo " in $initial_search_location";
    }
    echo ".</p>";
  } else {
    echo "<p>This term was searched by $initial_client on $initial_search_date";

    if ($location) {
      echo " in&nbsp;&nbsp;<a href=\"".get_term_link($location->term_id)."\" class=\"post-tag\">$location->name</a>";
    }
    echo ".</p>";
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
