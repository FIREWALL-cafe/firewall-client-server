<?php

function fwc_library_nav_tags() {
  $nav_buttons = array(
    'censored',
    'bad-translation',
    'sensitive',
    'wtf',
    'may-be-censored',
    'good-translation',
    'lost-in-translation',
    'no-tag',
    'nsfw',
    'baidu',
    'google',
    'st-polten',
    'nyc',
    'oslo',
    'english',
    'chinese',
    'other-language'
  );

  $i = 0;
  foreach ($nav_buttons as $slug) {
    if ($i == 8) {
      fwc_more_button();
      fwc_get_nav_tag($slug);
    } else {
      fwc_get_nav_tag($slug);
    }
    $i += 1;
  }
}

function fwc_more_button() {
  echo "<div class=\"fwc-nav-tag tag-navigation-opener\">";
  echo fwc_get_svg('more');
  echo "</div>";
}

function fwc_get_nav_tag($slug, $class='') {
  $term = get_terms(array('slug' => $slug));
  if (count($term)) {
    $term = $term[0];
    $link = get_term_link($term->term_id);
  } else {
    $link = '#';
  }

  echo "<a href=\"$link\" class=\"fwc-nav-tag ". $class ."\">";
  echo fwc_get_svg($slug);
  echo "</a>";
}
