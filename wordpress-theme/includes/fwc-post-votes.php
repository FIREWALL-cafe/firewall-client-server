<?php

function fwc_post_vote_buttons() {
  $vote_buttons = array(
    'votes_censored' => 'censored',
    'votes_uncensored' => 'uncensored',
    'votes_bad_translation' => 'bad-translation',
    'votes_good_translation' => 'good-translation',
    'votes_lost_in_translation' => 'lost-in-translation',
    'votes_nsfw' => 'nsfw',
    'votes_bad_result' => 'bad-result',
  );

  foreach ($vote_buttons as $key => $slug) {
    fwc_post_vote_button($slug, $key, fwc_get_latest_meta($key));
  }
}

function fwc_post_vote_button($slug, $key, $vote_count_for_single_search) {
  $post_id = get_the_ID();
  if (!$vote_count_for_single_search) { $vote_count_for_single_search = 0; }

  // Collect all votes for posts with this search term
  $args = array(
    'meta_key' => 'search_term_initial',
    'meta_value' => fwc_get_latest_meta('search_term_initial'),
    'post_type' => 'any',
  );
  $query = new WP_Query($args);
  $vote_count_for_search_term = 0;
  foreach ($query->posts as $post) {
    $vote_count_for_search_term += intval(fwc_get_latest_meta($key, $post->ID));
  }

  echo "<div class=\"vote-button-container\">";
  echo "<span class=\"fwc-nav-tag fwc-vote-button\" data-key=\"$key\" data-post=\"$post_id\">";
  $template_directory_uri = get_template_directory_uri();
  echo "<img src=\"$template_directory_uri/img/vote-buttons-$slug.svg\">";;
  echo "</span>";
  echo "<p class=\"vote-count tooltip\" tooltip=\"Votes for current search result\">$vote_count_for_single_search</p>";
  echo "<p class=\"vote-count-historic tooltip\" tooltip=\"Votes for this search term all-time\"><span>$vote_count_for_search_term</span></p>";
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

  // Add a tag to this post, used to easily retrieve all posts with this vote type
  wp_set_post_terms($post_id, 'has_'.$meta_key, 'post_tag', true /* append to existing tags */);

  die((string)$new);
}

// TODO Can remove
function fwc_get_post_tags($view) {
  $post_id = get_the_ID();
  $result = '';

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
        if ($view == 'archive') {
          $result .= "<span class=\"post-tag $color\">$term->name</span>";
        } else {
          $result .= "<a href=\"".get_term_link($term->term_id)."\" class=\"post-tag $color\">$term->name</a>";
        }
      }
    }
  }

  return $result;
}
