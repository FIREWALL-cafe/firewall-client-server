<?php

function fwc_library_nav_tags() {
  $tags = get_terms( array(
    'taxonomy' => 'post_tag',
    'hide_empty' => true,
  ));

  $censorship = get_terms( array(
    'taxonomy' => 'censorship_status',
    'hide_empty' => true,
  ));

  $translation = get_terms( array(
    'taxonomy' => 'translation_status',
    'hide_empty' => true,
  ));

  $search_language = get_terms( array(
    'taxonomy' => 'search_language',
    'hide_empty' => true,
  ));

  $search_engine = get_terms( array(
    'taxonomy' => 'search_engine',
    'hide_empty' => true,
  ));

  $location = get_terms(array(
    'taxonomy' => 'locations',
    'hide_empty' => true,
  ));

  $banned = get_terms(array(
    'taxonomy' => 'banned_status',
    'hide_empty' => true,
  ));

  if ($censorship && $banned) {
    $censorship = array_merge($censorship, $banned);
  } else if (!$censorship) {
    $censorship = $banned;
  }

  $tag_sets = array(
    'Censorship' => $censorship,
    'Translation' => $translation,
    'Language' => $search_language,
    'Search Engine' => $search_engine,
    'Location' => $location,
    'Other Tags' => $tags,
  );

  foreach($tag_sets as $title => $tag_set) {
    if ($tag_set) {
      echo "<h3 class=\"tag-set-title\">$title</h3>";
      foreach ($tag_set as $term) {
        if ($term && $term->term_id) {
          echo "<a href=\"".get_term_link($term->term_id)."\" class=\"post-tag\">$term->name</a>";
        }
      }
      if (count($tag_set)) {
        echo "</br>";
      }
    }
  }
}
