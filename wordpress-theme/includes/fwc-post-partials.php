<?php

function fwc_get_search_count() {
  $timestamps = get_post_meta(get_the_ID(), 'timestamp');
  $count = count($timestamps);
  return $count;
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

  // echo "This is the [ranking]th most popular search using Firewall.</p>";
}

function fwc_post_search_language() {
  $search_language = fwc_get_latest_meta('search_language_name');
  if ($search_language) {
    echo $search_language;
  }
}

function fwc_post_search_engine() {
  $search_engine = fwc_get_latest_meta('search_engine');
  echo ucwords($search_engine);
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
  $reverse_search = get_posts($args)[0];
  if ($reverse_search) {
    $link = get_permalink($reverse_search->ID);

    $translation = fwc_get_latest_meta('translation', $reverse_search->ID);

    echo "<h3>See reverse search: <a href=\"$link\">$slug / $translation </a></h3>";
  }
}
