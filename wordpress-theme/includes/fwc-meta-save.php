<?php

function fwc_save_meta($post_id, $post, $key) {
  $name = "fwc_" . $key;
  $nonce = $name . "_nonce";
  if ( !isset( $_POST[$nonce] ) || !wp_verify_nonce( $_POST[$nonce], basename( __FILE__ ) ) ) {
    return $post_id;
  }

  $post_type = get_post_type_object( $post->post_type );
  if ( !current_user_can( $post_type->cap->edit_post, $post_id ) ) {
    return $post_id;
  }

  $value = intval(fwc_get_latest_meta($key, $post_id));
  $new_value = intval( isset( $_POST[$name] ) ? $_POST[$name] : $value );

  if ( $new_value != $value ) {
    update_post_meta( $post_id, $key, $new_value );
    fwc_post_update_tags($post_id, $key, $new_value);
  }
}

function fwc_save_censored_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'censored_votes');
}
function fwc_save_uncensored_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'uncensored_votes');
}
function fwc_save_bad_translation_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'bad_translation_votes');
}
function fwc_save_good_translation_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'good_translation_votes');
}
function fwc_save_lost_in_translation_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'lost_in_translation_votes');
}
function fwc_save_firewall_bug_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'firewall_bug_votes');
}
function fwc_save_nsfw_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'nsfw_votes');
}
function fwc_save_bad_result_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'bad_result_votes');
}
function fwc_save_no_result_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'no_result_votes');
}
function fwc_save_banned_search_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'banned_search_votes');
}
function fwc_save_slow_search_votes_meta($post_id, $post) {
  fwc_save_meta($post_id, $post, 'slow_search_votes');
}

