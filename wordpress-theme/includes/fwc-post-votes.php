<?php

function fwc_post_vote_buttons() {

  $vote_buttons = array(
    'censored_votes' => 'Censored',
    'uncensored_votes' => 'Not Censored',
    'bad_translation_votes' => 'Bad Translation',
    'good_translation_votes' => 'Good Translation',
    'lost_in_translation_votes' => 'Lost in Translation',
    'firewall_bug_votes' => 'Firewall Bug',
    'nsfw_votes' => 'NSFW',
  );

  foreach ($vote_buttons as $key => $button_text) {
    fwc_post_vote_button($button_text, $key, fwc_get_latest_meta($key));
  }
}

function fwc_post_vote_button($button_text, $key, $count) {
  $post_id = get_the_ID();
  if (!$count) { $count = 0; }

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
  $taxonomies = array(
    'censorship_status',
    'translation_status',
    'search_language',
    'search_engine',
    'post_tag'
  );

  foreach ($taxonomies as $tax) {
    $terms = get_the_terms(get_the_ID(), $tax);
    if ($terms) {
      foreach ($terms as $term) {
        echo "<a href=\"".get_term_link($term->term_id)."\" class=\"post-tag\">$term->name</a>";
      }
    }
  }
}

function fwc_post_update_tags($post_id, $meta_key, $count) {
  $uncensored = get_post_meta($post_id, 'uncensored_votes');
  $censored = get_post_meta($post_id, 'censored_votes');

  if ($uncensored > $censored) {
    fwc_set_censorship_status($post_id, 'not censored');
  } else if ($censored > $uncensored) {
    fwc_set_censorship_status($post_id, 'censored');
  } else if ($censored == $uncensored && intval($censored) > 0) {
    fwc_set_censorship_status($post_id, 'may be censored');
  } else {
    fwc_set_censorship_status($post_id, '');
  }

  $bad_translation = get_post_meta($post_id, 'bad_translation_votes');
  $good_translation = get_post_meta($post_id, 'good_translation_votes');

  if ($bad_translation > $good_translation) {
    fwc_set_translation_status($post_id, 'bad translation');
  } else if ($good_translation > $bad_translation) {
    fwc_set_translation_status($post_id, 'good translation');
  } else {
    fwc_set_translation_status($post_id, '');
  }

  $tag_by_count = array(
    'nsfw',
    'lost-in-translation',
    'firewall-bug',
    'user-error'
  );

  $keep_tags = array();

  foreach ($tag_by_count as $tag) {
    $key = str_replace ( '-' , '_' , $tag ) . "_votes";
    $count = get_post_meta($post_id, $key);
    $count = intval(fwc_get_latest_value($count));
    if ($count > 0) {
      $keep_tags[] = $tag;
    }
  }
  wp_set_post_terms( $post_id, $keep_tags, 'post_tag');
}
