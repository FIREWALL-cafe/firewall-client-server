<?php

function fwc_get_vote_meta_keys() {
  $meta_keys = array(
    'censored_votes' => 'Censored Votes',
    'uncensored_votes' => 'Uncensored Votes',
    'bad_translation_votes' => 'Bad Translation Votes',
    'good_translation_votes' => 'Good Translation Votes',
    'lost_in_translation_votes' => 'Lost in Cultural Translation Votes',
    'nsfw_votes' => 'NSFW Votes',
    'bad_result_votes' => 'Bad Result Votes',
    // 'slow_search_votes' => 'Slow Search Votes',
    // 'no_result_votes' => 'No Result Votes',
  );

  return $meta_keys;
}

function fwc_post_meta_boxes_setup() {
  add_action( 'add_meta_boxes', 'fwc_add_post_meta_boxes' );

  $meta_keys = fwc_get_vote_meta_keys();
  foreach ($meta_keys as $key => $title) {
    $function = "fwc_save_" . $key . "_meta";
    add_action( 'save_post', $function, 10, 2 );
  }
}

function fwc_add_post_meta_boxes() {
  $meta_keys = fwc_get_vote_meta_keys();
  foreach ($meta_keys as $key => $title) {
    $function = "fwc_" . $key . "_meta_box";
    add_meta_box( $key, esc_html__( $title, '' ), $function, 'post', 'side', 'default' );
  }
}

function fwc_build_meta_box($key, $post_id) {
  $name = 'fwc_' . $key;
  $nonce = $name . "_nonce";
  $value = fwc_get_latest_meta($key, $post_id);

  ?><?php wp_nonce_field( basename( __FILE__ ), $nonce ); ?>
  <p>
    <label for="<?php echo $name; ?>"></label>
    <input class="widefat" type="text" name="<?php echo $name; ?>" id="<?php echo $name; ?>" value="<?php echo $value; ?>" size="30" />
  </p>
  <?php
}

function fwc_censored_votes_meta_box( $post ) {
  fwc_build_meta_box('censored_votes', $post->ID);
}
function fwc_uncensored_votes_meta_box( $post ) {
  fwc_build_meta_box('uncensored_votes', $post->ID);
}
function fwc_bad_translation_votes_meta_box( $post ) {
  fwc_build_meta_box('bad_translation_votes', $post->ID);
}
function fwc_good_translation_votes_meta_box( $post ) {
  fwc_build_meta_box('good_translation_votes', $post->ID);
}
function fwc_lost_in_translation_votes_meta_box( $post ) {
  fwc_build_meta_box('lost_in_translation_votes', $post->ID);
}
function fwc_firewall_bug_votes_meta_box( $post ) {
  fwc_build_meta_box('firewall_bug_votes', $post->ID);
}
function fwc_nsfw_votes_meta_box( $post ) {
  fwc_build_meta_box('nsfw_votes', $post->ID);
}
function fwc_bad_result_votes_meta_box( $post ) {
  fwc_build_meta_box('bad_result_votes', $post->ID);
}
