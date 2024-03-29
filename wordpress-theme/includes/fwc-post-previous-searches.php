<?php

function fwc_post_previous_searches_get($search_term, $timestamp) {
	$args = array(
		'meta_key' => 'search_term_initial',
		'meta_value' => $search_term,
		'post_type' => 'search-result',
		'post_status' => 'publish',
		'order' => 'ASC',
	);

	$query = new WP_Query($args);
	$posts = array_reverse($query->posts);
	return $posts;
}

function fwc_post_previous_searches_render($posts, $timestamp) {
	if (sizeof($posts) > 1) {
		echo '<div class="post-histories-container post-section">';
		echo '<h3>Previous searches:</h3>';

		foreach ($posts as $post) {
			$post_meta = get_post_meta($post->ID);
			if ($timestamp != $post_meta['timestamp'][0]) {
				echo "<div class=\"post-history migrate-highlight\">";
				echo "<h3>Search by <b>".$post_meta['search_client_name'][0];
				echo "</b> in <b>".ucwords(implode(' ', explode('_', $post_meta['search_location'][0])));
				echo "</b> on <b>".date('Y-m-d H:i:s', $post_meta['timestamp'][0]);
				echo "</b></h3>";
				$galleries = get_post_galleries($post->ID, false);
				echo '<div class="post-content" id="images-gallery">';
				echo '<h3>Google:</h3>';
				echo fwc_render_gallery($galleries[0]);
				echo '<h3>Baidu:</h3>';
				echo fwc_render_gallery($galleries[1]);
				echo '</div>';
				echo '</div>';
			}
		}

		echo '</div>';
	}
}

function fwc_post_previous_searches() {
  $timestamps = get_post_meta(get_the_ID(), 'timestamp');

  array_pop($timestamps);
  $timestamps = array_reverse($timestamps);

  foreach ($timestamps as $timestamp) {
    echo "<div class=\"post-history migrate-highlight\">";
    echo "<h3>Search by ".fwc_get_meta_by_timestamp('client', $timestamp)." on ".fwc_format_date($timestamp);

    $location = fwc_get_meta_by_timestamp('location', $timestamp);
    if ($location) {
      echo " in ".$location;
    }
    echo "</h3>";

    $search_engine = ucwords(fwc_get_meta_by_timestamp('search_engine', $timestamp));
    $search_language = ucwords(fwc_get_meta_by_timestamp('search_language_name', $timestamp));
    $banned = fwc_get_meta_by_timestamp('banned', $timestamp);
    $sensitive = fwc_get_meta_by_timestamp('sensitive', $timestamp);

    echo "<div class=\"post-history-detail\"><strong>Search engine:</strong> $search_engine</div>";
    echo "<div class=\"post-history-detail\"><strong>Search language:</strong> $search_language</div>";
    echo "<div class=\"post-history-detail\"><strong>Banned search term:</strong> $banned</div>";
    echo "<div class=\"post-history-detail\"><strong>Sensitive search term:</strong> $sensitive</div>";

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
    echo "</div>";
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
