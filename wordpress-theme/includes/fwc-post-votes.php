<?php

function fwc_post_vote_buttons() {

  $vote_buttons = array(
    'censored_votes' => 'Censored',
    'uncensored_votes' => 'Uncensored',
    'bad_translation_votes' => 'Bad Translation',
    'good_translation_votes' => 'Good Translation',
    'lost_in_translation_votes' => 'Lost in Cultural Translation',
    'nsfw_votes' => 'NSFW',
    'bad_result' => 'Bad Result',
  );

  foreach ($vote_buttons as $key => $button_text) {
    fwc_post_vote_button($button_text, $key, fwc_get_latest_meta($key));
  }
}

function fwc_post_vote_button($button_text, $key, $count) {
  $post_id = get_the_ID();
  if (!$count) { $count = 0; }

  // TODO: Add vote button SVGs here.
  echo "<div class=\"vote-button-container\">";
  echo "<p class=\"vote-count\">".$count."</p>";
  echo "<button class=\"fwc-vote-button\" data-key=\"$key\" data-post=\"$post_id\">".$button_text."</button>";
  echo "</div>";
}

function fwc_post_vote_scripts() {
  wp_enqueue_script( 'fwcPostVote', get_template_directory_uri() . '/js/fwcPostVote.js', array('jquery'));
  wp_localize_script( 'fwcPostVote', 'FWC', array(
    'ajaxurl' => admin_url( 'admin-ajax.php'),
    'security' => wp_create_nonce( 'fwc-post-vote-nonce' ),
  ));
}

function fwc_post_vote() {
  fwc_enable_cors();
  check_ajax_referer( 'fwc-post-vote-nonce', 'security' );

  $key = $_POST['meta_key'];
  $post_id = $_POST['post_id'];

  $new = fwc_post_vote_update($post_id, $key);
}

function fwc_post_vote_update($post_id, $meta_key) {
  $curr = get_post_meta($post_id, $meta_key);
  $curr = intval(fwc_get_latest_value($curr));

  $new = $curr + 1;
  update_post_meta($post_id, $meta_key, $new);

  fwc_post_update_tags($post_id, $meta_key, $new);

  die((string)$new);
}

function fwc_post_tags() {
  $post_id = get_the_ID();

  // TODO: Update tag background colors here.
  $taxonomies = array(
    'censorship_status' => 'red',
    'translation_status' => 'blue',
    'locations' => 'grey',
    'search_language' => 'blue',
    'search_engine' => 'grey',
    'post_tag' => 'red'
  );

  foreach ($taxonomies as $tax => $color) {
    $terms = get_the_terms($post_id, $tax);
    if ($terms) {
      foreach ($terms as $term) {
        echo "<a href=\"".get_term_link($term->term_id)."\" class=\"post-tag $color\">$term->name</a>";
      }
    }
  }
}

function fwc_post_update_tags($post_id, $meta_key, $count) {

  // Look at censored/uncensored votes to set censorship status.
  $uncensored = get_post_meta($post_id, 'uncensored_votes');
  $censored = get_post_meta($post_id, 'censored_votes');

  if ($uncensored > $censored) {
    $censorship = 'uncensored';
  } else if ($censored > $uncensored) {
    $censorship = 'censored';
  } else if ($censored == $uncensored && $censored != 0) {
    $censorship = 'may be censored';
  } else {
    $censorship = '';
  }
  fwc_set_censorship_status($post_id, $censorship);

  // Look at bad/good translation votes to set translation status.
  $bad_translation = get_post_meta($post_id, 'bad_translation_votes');
  $good_translation = get_post_meta($post_id, 'good_translation_votes');

  if ($bad_translation > $good_translation) {
    $translation = 'bad translation';
  } else if ($good_translation > $bad_translation) {
    $translation = 'good translation';
  } else {
    $translation = '';
  }
  fwc_set_translation_status($post_id, $translation);

  $keep_tags = array();

  // Add banned tag if search is banned.
  $banned = get_post_meta($post_id, 'banned');
  if ($banned) {
    $keep_tags[] = 'banned';
  }

  // Add sensitive tag if search is sensitive.
  $sensitive = get_post_meta($post_id, 'sensitive');
  if ($sensitive) {
    $keep_tags[] = 'sensitive';
  }

  // Check for at least one vote to apply/remove these tags.
  $tag_by_vote = array(
    'nsfw',
    'lost-in-translation',
    'firewall-bug',
    'bad-result',
    // 'slow-search',
    // 'no-result'
  );

  foreach ($tag_by_vote as $tag) {
    $key = str_replace ( '-' , '_' , $tag ) . "_votes";
    $count = get_post_meta($post_id, $key);
    $count = intval(fwc_get_latest_value($count));
    if ($count > 0) {
      $keep_tags[] = $tag;
    }
  }

  wp_set_post_terms( $post_id, $keep_tags, 'post_tag');
}
