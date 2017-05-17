<?php

function fwc_post_previous_searches() {
  $timestamps = get_post_meta(get_the_ID(), 'timestamp');

  array_pop($timestamps);
  $timestamps = array_reverse($timestamps);

  foreach ($timestamps as $timestamp) {
    echo "<div class=\"post-history\">";
    echo "<h3>Search by ".fwc_get_meta_by_timestamp('client', $timestamp)." on ".fwc_format_date($timestamp);

    $location = fwc_get_meta_by_timestamp('location', $timestamp);
    if ($location) {
      echo " in ".$location;
    }
    echo "</h3>";

    echo "<em>Search Engine:</em> ". ucwords(fwc_get_meta_by_timestamp('search_engine', $timestamp))."</br>";
    echo "<em>Search Language:</em> ". ucwords(fwc_get_meta_by_timestamp('search_language_name', $timestamp))."</br>";

    $banned = fwc_get_meta_by_timestamp('is_banned', $timestamp);
    if ($banned) {
      echo "At the time of this search, this search term was banned.";
    }


    $previous_search_content = fwc_build_previous_search_content($timestamp);

    if ($previous_search_content['google_gallery'] || $previous_search_content['baidu_gallery']) {
      echo "<div class=\"post-content\">";
      if ($previous_search_content['google_gallery']) {
        echo $previous_search_content['google_heading'];
        echo do_shortcode($previous_search_content['google_gallery']);
      }
      if ($previous_search_content['baidu_gallery']) {
        echo $previous_search_content['baidu_heading'];
        echo do_shortcode($previous_search_content['baidu_gallery']);
      }
      echo "</div>";
    }
  }
}

function fwc_build_previous_search_content($timestamp) {
  $post = get_post(get_the_ID());

  $google_prefix = 'google-'.$timestamp.'-';
  $baidu_prefix = 'baidu-'.$timestamp.'-';

  $args = array(
     'post_type' => 'attachment',
     'numberposts' => -1,
     'post_status' => null,
     'post_parent' => $post->ID,
  );
  $attachments = get_posts( $args );

  $google_attachments = array_filter($attachments, array(new PrefixFilter($google_prefix), 'hasPrefix'));
  $baidu_attachments = array_filter($attachments, array(new PrefixFilter($baidu_prefix), 'hasPrefix'));

  $google_ids = array();
  $baidu_ids = array();

  foreach ($google_attachments as $att) {
    $google_ids[] = $att->ID;
  }

  foreach ($baidu_attachments as $att) {
    $baidu_ids[] = $att->ID;
  }

  $query = $post->post_title;
  $link = get_the_permalink();

  $translation = fwc_get_meta_by_timestamp('translation', $timestamp);
  $search_engine = fwc_get_meta_by_timestamp('search_engine', $timestamp);

  $google_heading = "<h3 class=\"query-label\">Google: <strong>";
  if ($search_engine == 'google') {
    $google_heading .= "<a href=\"$link\">$query</a>";
  } else {
    $google_heading .= "<a href=\"$link\">$translation</a>";
  }
  $google_heading .= "</strong></h3>\n";

  $baidu_heading = "<h3 class=\"query-label\">Baidu: <strong>";
  if ($search_engine == 'google') {
    $baidu_heading .= "<a href=\"$link\">$translation</a>";
  } else {
    $baidu_heading .= "<a href=\"$link\">$query</a>";
  }
  $baidu_heading .= "</strong></h3>\n";

  $google_ids = implode(',', $google_ids);
  $baidu_ids = implode(',', $baidu_ids);

  if (strlen($google_ids)) {
    $google_gallery = "[gallery ids=\"$google_ids\" link=\"none\"]";
  } else {
    $google_gallery = null;
  }

  if (strlen($baidu_ids)) {
    $baidu_gallery = "[gallery ids=\"$baidu_ids\" link=\"none\"]";
  } else {
    $baidu_gallery = null;
  }

  $return = array(
    'google_heading' => $google_heading,
    'baidu_heading' => $baidu_heading,
    'google_gallery' => $google_gallery,
    'baidu_gallery' => $baidu_gallery,
  );

  return $return;
}
