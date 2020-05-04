<?php

function fwc_get_latest_value($array) {
  $data = end($array);
  if (gettype($data) == 'string' || gettype($data) == 'boolean') {
    return $data;
  } else {
    return end($data);
  }
}

function fwc_get_latest_timestamp() {
  $timestamps = get_post_meta(get_the_ID(), 'timestamp');
  $timestamp = fwc_get_latest_value($timestamps);
  return $timestamp;
}

function fwc_get_first_timestamp() {
  return array_values(get_post_meta(get_the_ID(), 'timestamp'))[0];
}

function fwc_get_first_meta($key) {
  $meta = get_post_meta(get_the_ID(), $key);
  return array_values($meta)[0];
}

function fwc_get_latest_meta($key, $post_id=null) {
    if ($post_id) {
      $meta = get_post_meta($post_id, $key);
    } else {
      $meta = get_post_meta(get_the_ID(), $key);
    }
  return fwc_get_latest_value($meta);
}

function fwc_get_meta_by_timestamp($key, $timestamp) {
  $dataset = get_post_meta(get_the_ID(), $key);
  $meta = array_filter($dataset, function($data) use ($timestamp) {
    if (! is_array($data)) {
      return false;
    }
    return key($data) == $timestamp;
  });
  return fwc_get_latest_value($meta);
}

function fwc_format_date($timestamp) {
    return date('M j, Y, g:ia', $timestamp - (4*60*60));
}

function fwc_format_date_new($timestamp) {
  return date('j M. Y', $timestamp - (4*60*60));
}

function fwc_get_svg($slug) {
  $svg = get_template_part("includes/icon", "$slug.svg");
  return $svg;
}

function fwc_render_gallery($object) {
	if (strlen($object['ids'])) {
		echo '<div class="gallery gallery-columns-3 gallery-size-thumbnail">';
		foreach ($object['src'] as $src) {
			echo <<<END
<figure class="gallery-item">
	<div class="gallery-icon landscape">
		<a href="#">
			<img src="$src" class="attachment-thumbnail size-thumbnail" alt="" />
		</a>
	</div>
</figure>
END;
		}
		echo '</div>';
	} else {
		echo '<div class="gallery empty">No images available</div>';
	}
}

?>