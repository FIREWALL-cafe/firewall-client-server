<?php

define('FWC_SHARED_SECRET', 'b43ce0bdfb64d54130679f9632f37de94cfe2032');

function fwc_after_setup_theme() {
	add_theme_support( 'html5', array( 'gallery', 'caption' ) );
	add_filter('wp_get_attachment_image_attributes', function($attr) {
		if (isset($attr['sizes'])) unset($attr['sizes']);
		if (isset($attr['srcset'])) unset($attr['srcset']);
		return $attr;
	}, PHP_INT_MAX);
	add_filter('wp_calculate_image_sizes', '__return_false', PHP_INT_MAX);
	add_filter('wp_calculate_image_srcset', '__return_false', PHP_INT_MAX);
	remove_filter('the_content', 'wp_make_content_images_responsive');
}
add_action( 'after_setup_theme', 'fwc_after_setup_theme' );

function fwc_register_menu() {
  register_nav_menu( 'header-menu', __( 'Header Menu' ) );
}
add_action( 'init', 'fwc_register_menu' );


/////////////////////////////////////////////////
//// Adds FWC custom taxonomies.
/////////////////////////////////////////////////
function fwc_add_custom_taxonomies() {
  register_taxonomy('censorship_status', 'post', array(
    'hierarchical' => false,
    'labels' => array(
      'name' => _x( 'Censorship Statuses', 'taxonomy general name' ),
      'singular_name' => _x( 'Censorship Status', 'taxonomy singular name' ),
      'search_items' =>  __( 'Search By Censorship Status' ),
      'all_items' => __( 'All Censorship Statuses' ),
      'edit_item' => __( 'Edit Censorship Status' ),
      'update_item' => __( 'Update Censorship Status' ),
      'add_new_item' => __( 'Add New Censorship Status' ),
      'new_item_name' => __( 'New Censorship Status' ),
      'menu_name' => __( 'Censorship Statuses' ),
    ),
    'rewrite' => array(
      'slug' => 'censorship',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));

  register_taxonomy('translation_status', 'post', array(
    'hierarchical' => false,
    'labels' => array(
      'name' => _x( 'Translation Statuses', 'taxonomy general name' ),
      'singular_name' => _x( 'Translation Status', 'taxonomy singular name' ),
      'search_items' =>  __( 'Search By Translation Status' ),
      'all_items' => __( 'All Translation Statuses' ),
      'edit_item' => __( 'Edit Translation Status' ),
      'update_item' => __( 'Update Translation Status' ),
      'add_new_item' => __( 'Add New Translation Status' ),
      'new_item_name' => __( 'New Translation Status' ),
      'menu_name' => __( 'Translation Statuses' ),
    ),
    'rewrite' => array(
      'slug' => 'translation',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));

  // Add Search Language taxonomy to searches.
  register_taxonomy('search_language', 'post', array(
    // Hierarchical taxonomy (like categories)
    'hierarchical' => false,
    // This array of options controls the labels displayed in the WordPress Admin UI
    'labels' => array(
      'name' => _x( 'Search Languages', 'taxonomy general name' ),
      'singular_name' => _x( 'Search Language', 'taxonomy singular name' ),
      'search_items' =>  __( 'Search By Search Language' ),
      'all_items' => __( 'All Search Languages' ),
      'edit_item' => __( 'Edit Search Language' ),
      'update_item' => __( 'Update Search Language' ),
      'add_new_item' => __( 'Add New Search Language' ),
      'new_item_name' => __( 'New Search Language' ),
      'menu_name' => __( 'Search Languages' ),
    ),
    // Control the slugs used for this taxonomy
    'rewrite' => array(
      'slug' => 'search-language',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));

  register_taxonomy('search_engine', 'post', array(
    // Hierarchical taxonomy (like categories)
    'hierarchical' => false,
    // This array of options controls the labels displayed in the WordPress Admin UI
    'labels' => array(
      'name' => _x( 'Search Engines', 'taxonomy general name' ),
      'singular_name' => _x( 'Search Engine', 'taxonomy singular name' ),
      'search_items' =>  __( 'Search By Search Engine' ),
      'all_items' => __( 'All Search Engines' ),
      'edit_item' => __( 'Edit Search Engine' ),
      'update_item' => __( 'Update Search Engine' ),
      'add_new_item' => __( 'Add New Search Engine' ),
      'new_item_name' => __( 'New Search Engine' ),
      'menu_name' => __( 'Search Engines' ),
    ),
    // Control the slugs used for this taxonomy
    'rewrite' => array(
      'slug' => 'search-engine',
      'with_front' => false,
      'hierarchical' => false
    ),
  ));
}
add_action( 'init', 'fwc_add_custom_taxonomies', 0 );

function fwc_set_censorship_status($post_id, $status) {
	wp_set_post_terms( $post_id, $status, 'censorship_status', false );
}

function fwc_set_translation_status($post_id, $status) {
	wp_set_post_terms( $post_id, $status, 'translation_status', false );
}

/////////////////////////////////////////////////
//// Post metadata.
/////////////////////////////////////////////////

function fwc_get_search_count() {
	$timestamps = get_post_meta(get_the_ID(), 'timestamp');
	$count = count($timestamps);
	return $count;
}

function fwc_post_search_history() {
  $count = fwc_get_search_count();
  $initial_search_date = fwc_get_first_timestamp();

  // Display chart of search history here.
  if ($count > 1) {
	echo "<p>This term has been searched ".$count." times, most recently by ".fwc_get_latest_meta('client')." on ".fwc_format_date(fwc_get_latest_timestamp()).".</br>";
	echo "It was first searched by ".fwc_get_meta_by_timestamp('client', $initial_search_date)." on ".fwc_format_date($initial_search_date).".</br>";
  } else {
  	echo "<p>This term was searched by ".fwc_get_latest_meta('client')." on ".fwc_format_date($initial_search_date).".</p>";
  }


  // echo "This is the [ranking]th most popular search using Firewall.</p>";
}

function fwc_post_search_language() {
  $search_language = fwc_get_latest_meta('search_language');
  echo $search_language;
}

function fwc_post_search_engine() {
	$search_engine = fwc_get_latest_meta('search_engine');
	echo $search_engine;
}

function fwc_post_translation_history() {
	// $translation_history =
}

function fwc_post_previous_searches() {
	$timestamps = get_post_meta(get_the_ID(), 'timestamp');

	array_pop($timestamps);
	$timestamps = array_reverse($timestamps);

	foreach ($timestamps as $timestamp) {
		echo "<div class=\"post-history\">";
		echo "<h4>Search by ".fwc_get_meta_by_timestamp('client', $timestamp)." on ".fwc_format_date($timestamp)."</h4>";
		echo "<em>Search Engine:</em> ".fwc_get_meta_by_timestamp('search_engine', $timestamp)."</br>";
		print_r(fwc_get_meta_by_timestamp('google_images', $timestamp));
		print_r(fwc_get_meta_by_timestamp('baidu_images', $timestamp));
		echo "</div>";
	}
}

//TODO: REVISE BELOW
function fwc_post_meta() {
	$client = fwc_get_latest_meta('client');
	?>
	Search by <?php echo esc_html($client); ?>
	on <a href="<?php the_permalink(); ?>" class="permalink"><?php echo fwc_format_date(fwc_get_latest_meta('timestamp')); ?></a>
	<?php // echo fwc_get_search_popularity();
	edit_post_link('Edit', '&nbsp;&nbsp;|&nbsp;&nbsp;');
}

function fwc_post_popularity_meta() {
	$total_count = esc_html(fwc_get_search_count());
	$google_count = esc_html(fwc_get_search_count_google());
	$baidu_count = esc_html(fwc_get_search_count_baidu());
	$ranking = esc_html(fwc_get_search_ranking());
	// $initial_search_date = esc_html(fwc_get_initial_search_date());
	?>
	This term has been searched <?php echo $total_count; ?> times since <?php echo "initial_search_date"; ?>.
	<?php
	if ($google_count > 0 && $baidu_count > 0) {
		echo "It's been searched ".$google_count."times using Google and".$baidu_count."times using Baidu.";
	}
	?>


	<?php fwc_build_search_chart(); ?>

	That means it's the <?php
}

/////////////////////////////////////////////////
//// Metadata & formatting utilities
/////////////////////////////////////////////////

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

function fwc_get_latest_meta($key) {
	$meta = get_post_meta(get_the_ID(), $key);
	return fwc_get_latest_value($meta);
}

function fwc_get_meta_by_timestamp($key, $timestamp) {
	$dataset = get_post_meta(get_the_ID(), $key);
	$meta = array_filter($dataset, function($data) use ($timestamp) {
		return key($data) == $timestamp;
	});
	return fwc_get_latest_value($meta);
}

function fwc_format_date($timestamp) {
	return date('M j, Y, g:ia', $timestamp - (4*60*60));
}

/////////////////////////////////////////////////
//// Post voting buttons.
/////////////////////////////////////////////////

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
add_action('wp_enqueue_scripts', 'fwc_post_vote_scripts');

function fwc_post_vote() {
	fwc_enable_cors();
	check_ajax_referer( 'fwc-post-vote-nonce', 'security' );

	$key = $_POST['meta_key'];
	$post_id = $_POST['post_id'];

	$new = fwc_post_vote_update($post_id, $key);
}
add_action('wp_ajax_fwc_post_vote', 'fwc_post_vote');
add_action('wp_ajax_nopriv_fwc_post_vote', 'fwc_post_vote');

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
		$count = intval(get_post_meta($post_id, $key));
		if ($count > 0) {
			$keep_tags[] = $tag;
		}
	}
	wp_set_post_terms( $post_id, $keep_tags, 'post_tag', false );
}

/////////////////////////////////////////////////
//// Submit new posts.
/////////////////////////////////////////////////

function fwc_submit_images() {
	fwc_enable_cors();

	if (!defined('FWC_SHARED_SECRET')) {
		die('No FWC_SHARED_SECRET defined');
	}

	if (empty($_POST['secret']) ||
	    $_POST['secret'] != FWC_SHARED_SECRET) {
		return false;
	}

	echo "images: " . substr($_POST['google_images'], 0, 100) . "\n";

	$row = (object) array(
		'timestamp' => $_POST['timestamp'],
		'search_engine' => $_POST['search_engine'],
		'client' => $_POST['client'],
		'query' => $_POST['query'],
		'translation' => $_POST['translated'],
		'google_images' => stripslashes($_POST['google_images']),
		'baidu_images' => stripslashes($_POST['baidu_images']),
		'lang_from' => $_POST['lang_from'],
		'lang_confidence' => $_POST['lang_confidence'],
		'lang_alternate' => $_POST['lang_alternate'],
	);
	// $row = fwc_test_post_data();
	fwc_import_post($row);

	die(1);
}
add_action('wp_ajax_fwc_submit_images', 'fwc_submit_images');
add_action('wp_ajax_nopriv_fwc_submit_images', 'fwc_submit_images');

function fwc_import_post($row) {
	$slug = sanitize_title("$row->query");
	echo "Query: ".$slug."</br>";

	$post = get_page_by_path($slug, OBJECT, 'post');

	if ($post) {
		$post_id = $post->ID;
		echo "Post ID: ".$post_id."</br>";
		echo "Post already exists. Updating post with new data.</br>";
		fwc_update_post_content($post_id, $row);
	} else {
		$title = "$row->query";
		$post_id = wp_insert_post(array(
			'post_title' => $title,
			'post_name' => $slug,
			'post_status' => 'draft'
		));
		echo "Post ID: ".$post_id."</br>";
		echo "New post. Adding post with current data.</br>";

		if (!empty($post_id)) {
			fwc_initialize_post_content($post_id, $row);
		}
	}
}

function fwc_initialize_post_content($post_id, $row) {
	fwc_initialize_post_metadata($post_id, $row);
	fwc_build_post_content($post_id, $row);
}

function fwc_initialize_post_metadata($post_id, $row) {
	fwc_update_post_metadata($post_id, $row);

	add_post_meta( $post_id, 'new_template_style', 1, true);

	$zero_votes = array(
		'censored_votes',
		'uncensored_votes',
		'maybe_censored_votes',
		'bad_translation_votes',
		'good_translation_votes',
		'lost_in_translation_votes',
		'firewall_bug_votes',
		'nsfw_votes',
	);

	foreach ($zero_votes as $key) {
		add_post_meta( $post_id, $key, 0, true);
	}
}

function fwc_build_post_content($post_id, $row) {
	$google_images = json_decode($row->google_images, 'as hash');
	$baidu_images = json_decode($row->baidu_images, 'as hash');

	$google_images_html = fwc_build_image_set($post_id, $row, $google_images, 'google');
	$baidu_images_html = fwc_build_image_set($post_id, $row, $baidu_images, 'baidu');

	$post_content = $google_images_html . $baidu_images_html;

	$timestamp = round($row->timestamp / 1000);
	$post_date = date('Y-m-d H:i:s', $timestamp - (5 * 60 * 60));
	$post_date_gmt = date('Y-m-d H:i:s', $timestamp);

	$post_data = array(
		'ID' => $post_id,
		'post_content' => $post_content,
		'post_date' => $post_date,
		'post_date_gmt' => $post_date_gmt,
		'edit_date' => true,
		'post_status' => 'publish'
	);

	wp_update_post($post_data);
}

function fwc_build_image_set($post_id, $row, $images, $label) {
	echo "Building ".$label." image set</br>";
	if ($label == $row->search_engine) {
		$term = $row->query;
	} else {
		$term = $row->translation;
	}

	$urls = array_keys($images);
	echo "Term: ".$term."</br>";
	echo "URLS: ".implode(', ', $urls)."</br>";

	$attachments = fwc_save_images($post_id, $images, "$label-$row->timestamp");

	$heading = "<h3 class=\"query-label\">". ucwords($label) . ": <strong>" .
		esc_html($term) . "</strong></h3>";
	$ids = implode(',', $attachments);

	$image_set = "$heading\n[gallery ids=\"$ids\" link=\"none\"]\n\n";
	return $image_set;
}

/////////////////////////////////////////////////
//// Update posts.
/////////////////////////////////////////////////

function fwc_update_post_metadata($post_id, $row) {
	$timestamp = round($row->timestamp / 1000);
	add_post_meta($post_id, 'timestamp', $timestamp, false);

	$search_language = $row->lang_from;
	fwc_update_post_search_language($post_id, $search_language);

	$metadata = array(
		'client' => $row->client,
		'translation' => $row->translation,
		'search_engine' => $row->search_engine,
		'google_images' => $row->google_images,
		'baidu_images' => $row->baidu_images,
		'search_language' => $search_language,
		'search_language_confidence' => $row->lang_confidence,
		'search_language_alternate' => $row->lang_alternate,
	);
	fwc_add_post_timestamped_meta($post_id, $metadata, $timestamp);
}

function fwc_add_post_timestamped_meta($post_id, $metadata, $timestamp) {
	foreach ($metadata as $meta_key => $data) {
		add_post_meta( $post_id, $meta_key, array( $timestamp => $data ), false );
	}
}

function fwc_update_post_search_language($post_id, $search_language) {
	if ($search_language == 'en') {
		// Attach to appropriate Search Language taxonomy.
	}
}

function fwc_update_post_content($post_id, $row) {
	fwc_update_post_metadata($post_id, $row);
	fwc_build_post_content($post_id, $row);
}

function fwc_update_popularity($post_id) {
	$popularity = get_post_meta($post_id, 'popularity', true);
	if (!$popularity) {
		update_post_meta($post_id, 'popularity', 1);
	} else {
		$popularity = intval($popularity) + 1;
		update_post_meta($post_id, 'popularity', $popularity);
	}
}

/////////////////////////////////////////////////
//// Manage WP Media Library.
/////////////////////////////////////////////////

function fwc_save_images($parent_id, $images, $prefix) {
	$image_ids = array();
	$upload_dir = wp_upload_dir();
	$num = 0;
	foreach ($images as $image) {

		$href = $image['href'];
		$src = $image['src'];

		echo "$href: ";
		if (substr($src, 0, 5) == 'data:') {
			echo "data URI<br>";
			$image = fwc_derive_data_uri($src);
		} else {
			echo "download<br>";
			$image = fwc_download_image($src);
		}

		if (is_array($image)) {
			extract($image);

			// Now we have:
			// $binary_data
			// $content_type

			$num++;
			$image_num = $num;
			if ($image_num < 10) {
				$image_num = '0' . $image_num;
			}
			if ($content_type == 'image/jpeg') {
				$ext = 'jpg';
			} else if ($content_type == 'image/gif') {
				$ext = 'gif';
			} else if ($content_type == 'image/png') {
				$ext = 'png';
			} else {
				echo "Unexpected content-type: $content_type<br>";
				continue;
			}
			$date = current_time('d');
			$dir = $upload_dir['path'] . "/$date/$parent_id";
			if (! file_exists($dir)) {
				wp_mkdir_p($dir);
			}
			$path = "$dir/$prefix-$image_num.$ext";
			file_put_contents($path, $binary_data);
			echo "Saved: $path<br>";
			$image_id = fwc_attach_image($parent_id, $path, $href);
			$image_ids[] = $image_id;
		}
	}
	return $image_ids;
}

function fwc_derive_data_uri($src) {

	// Example $data:
	// data:image/jpeg;base64,[base64 data]
	// data:image/jpeg;charset=utf8;base64,[base64 data]

	// Remove the "data:" prefix
	$data = substr($src, 5);

	// Derive the type
	$semicolon_pos = strpos($data, ';');
	$content_type = substr($data, 0, $semicolon_pos);

	// Remove the header
	$comma_pos = strpos($data, ',');
	$base64_data = substr($data, $comma_pos);

	$binary_data = base64_decode($base64_data);

	if ($binary_data) {
		return array(
			'binary_data' => $binary_data,
			'content_type' => $content_type
		);
	}
	return null;
}

function fwc_download_image($src) {
	// $url = urldecode($url);
	echo "downloading $src: ";
	$response = wp_remote_get($src, array(
		'timeout' => '30',
		'user-agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:44.0) Gecko/20100101 Firefox/44.0'
	));
	$status = wp_remote_retrieve_response_code($response);
	echo $status . "<br>";
	if ($status == 200) {
		$body = wp_remote_retrieve_body($response);
		return array(
			'binary_data' => $body,
			'content_type' => $response['headers']['content-type']
		);
	}
	return null;
}

function fwc_attach_image($parent_id, $path, $href) {
	$filetype = wp_check_filetype(basename( $path ), null);
	$wp_upload_dir = wp_upload_dir();
	$attachment = array(
		'guid'           => $wp_upload_dir['url'] . '/' . basename( $path ),
		'post_mime_type' => $filetype['type'],
		'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $path ) ),
		'post_content'   => $href,
		'post_status'    => 'inherit'
	);
	$attach_id = wp_insert_attachment( $attachment, $path, $parent_id );
	require_once( ABSPATH . 'wp-admin/includes/image.php' );
	$attach_data = wp_generate_attachment_metadata( $attach_id, $path );
	wp_update_attachment_metadata( $attach_id, $attach_data );
	return $attach_id;
}

function fwc_intermediate_image_sizes($sizes) {
	if (defined('FWC_IMPORTING_IMAGES')) {
		return array(
			'thumbnail'
		);
	}
	return $sizes;
}
add_filter('intermediate_image_sizes', 'fwc_intermediate_image_sizes');


/////////////////////////////////////////////////
//// Utilities
/////////////////////////////////////////////////

function fwc_test_post_data() {
	$row = (object) array(
		'timestamp' => 1494457634573,
		'search_engine' => 'google',
		'client' => 'Rachel',
		'query' => 'resist',
		'translation' => '抗',
		'google_images' => '["https%3A%2F%2Fi.kinja-img.com%2Fgawker-media%2Fimage%2Fupload%2Fs--41FDizDL--%2Fc_scale%2Cfl_progressive%2Cq_80%2Cw_800%2Focib1pq0fvtrducbxl7d.png","http%3A%2F%2Fnoorimages.com%2Fwp-content%2Fuploads%2F2017%2F02%2FResist-COVER-584x389.jpg","https%3A%2F%2Fsecure3.convio.net%2Fgpeace%2Fimages%2Fcontent%2Fpagebuilder%2FBanner_870x215.jpeg","https%3A%2F%2Fpbs.twimg.com%2Fprofile_images%2F691718142842818560%2FM4uF-40W.jpg","http%3A%2F%2Fmurverse.com%2Fwp-content%2Fuploads%2F2017%2F02%2Fdevelopers-will-resist.gif","https%3A%2F%2Factionnetwork.org%2Fuser_files%2Fuser_files%2F000%2F010%2F929%2Foriginal%2Fresisttrump_torch_s.png","https%3A%2F%2Ffrontierpartisans.com%2Fwp-content%2Fuploads%2F2017%2F03%2Fresist.jpg","http%3A%2F%2Fjannaldredgeclanton.com%2Fblog%2Fwp-content%2Fuploads%2F2017%2F02%2Fresist_together.jpeg","http%3A%2F%2Fi299.photobucket.com%2Falbums%2Fmm295%2Fnateblackwood%2Fresist-4.gif","http%3A%2F%2Fi3.cpcache.com%2Fproduct_zoom%2F2044095010%2Fresist_womens_light_tshirt.jpg%3Fcolor%3DLightPink%26c%3Dfalse","http%3A%2F%2Fwww.resistsubmission.com%2Fuploads%2F1%2F2%2F5%2F6%2F12564774%2F1479833405.png","https%3A%2F%2Fcdn-images-1.medium.com%2Fmax%2F800%2F1*wb21Tt9cJpHJsvIg4uPl9A.png","http%3A%2F%2Fresist.org%2Fsites%2Fdefault%2Ffiles%2Fstyles%2Fresponsive_large__normal%2Fpublic%2Fresist_logo_about.png%3Fitok%3DwtOJjWZl","http%3A%2F%2Ftrailmix.cc%2Fhome%2Fwp-content%2Fuploads%2F2016%2F11%2Fresist-t-shirts-men-s-premium-t-shirt.jpg","https%3A%2F%2Fresistmedia.org%2Fwp-content%2Fuploads%2F2016%2F10%2FRESIST-Logo-Large.png","http%3A%2F%2Fwww.configuringlight.org%2Fwp-content%2Fuploads%2FProject-Resist-9-of-37.jpg","http%3A%2F%2Fd3n8a8pro7vhmx.cloudfront.net%2Fshowingupforracialjustice%2Fpages%2F289%2Fmeta_images%2Foriginal%2FRESIST.jpg%3F1449689832","http%3A%2F%2Fwww.greenpeace.org%2Fusa%2Fwp-content%2Fuploads%2F2017%2F01%2FRESIST_digital_1200x1200_8.png","https%3A%2F%2Fsecure.meetupstatic.com%2Fs%2Fimg%2F44714141242236135880%2Fpro%2Fresist%2Fresist-emoji-site-gif.gif","http%3A%2F%2Fi3.cpcache.com%2Fproduct%2F2044406379%2Fkeep_calm_and_resist_button.jpg"]',
		'baidu_images' => '["https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=1661433408,841215226&fm=23&gp=0.jpg","https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=397247676,4141938607&fm=23&gp=0.jpg","https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=3432971353,2951899866&fm=23&gp=0.jpg","https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=1381996996,2638262872&fm=23&gp=0.jpg","https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=3953418884,2574051217&fm=23&gp=0.jpg","https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=2567270588,2987941832&fm=23&gp=0.jpg","https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=4289996477,835387402&fm=23&gp=0.jpg","https://ss0.bdstatic.com/70cFuHSh_Q1YnxGkpoWK1HF6hhy/it/u=1049604512,740526578&fm=23&gp=0.jpg","https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=3887855297,599606009&fm=23&gp=0.jpg","https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=2627347408,4170062475&fm=23&gp=0.jpg","https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=2977936469,3441322417&fm=23&gp=0.jpg","https://ss3.bdstatic.com/70cFv8Sh_Q1YnxGkpoWK1HF6hhy/it/u=2043553209,347159970&fm=23&gp=0.jpg","https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=2002118507,2942484244&fm=23&gp=0.jpg","https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=144345291,2844992582&fm=23&gp=0.jpg","https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=3830985130,4095017312&fm=23&gp=0.jpg","https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=2749677791,1561546566&fm=23&gp=0.jpg","https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=1154095850,504966351&fm=23&gp=0.jpg","https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=1388251949,3163270590&fm=23&gp=0.jpg"]',
		'lang_from' => 'en',
		'lang_confidence' => '1',
		'lang_alternate' => '',
	);
	return $row;
}

function fwc_enable_cors() {
	header('x-test: 1');
	header("Access-Control-Allow-Origin: *");
}
add_action('wp_headers', 'fwc_enable_cors');


/////////////////////////////////////////////////
//// Imports images from CSV file. ////
/////////////////////////////////////////////////
function fwc_import_images() {
	echo '<pre>';
	set_time_limit(0);
	define('FWC_IMPORTING_IMAGES', 1);
	$index = 0;
	if (!empty($_GET['index'])) {
		$index = $_GET['index'];
	}
	$dir = get_stylesheet_directory_uri();
	$csv = new CSV_File("$dir/images.csv");
	$curr = 0;
	while ($row = $csv->next_row($verbose)) {
		echo "$curr\n";

		// TODO: Edit below to allow empty image sets.
		if (empty($row) ||
		    empty($row->timestamp) ||
		    empty($row->query) ||
		    empty($row->translated) ||
		    empty($row->google_images) ||
		    empty($row->baidu_images)) {
			echo "Skipping $curr\n";
			continue;
		}

		$verbose = false; //($curr == 3095);
		if ($curr == $index) {
			if (!empty($_GET['import'])) {
				echo "Importing $row->query / $row->translated<br><br>";
				fwc_import_post($row);
				echo "Done.<br><br>";
				if (!empty($_GET['continue'])) {
					$date_only = (empty($_GET['date_only'])) ? '' : '&date_only=1';
					$next = $index + 1;
					$next_url = "?action=import_images&index=$next&import=1&continue=1$date_only";
					echo "<script>window.location = '$next_url';</script>";
				}
			} else {
				// TODO: Revise to manage new post data structure.
				echo "Google: $row->query<br><br>";
				$gi = json_decode($row->google_images);
				foreach ($gi as $src) {
					echo "<img src=\"$src\" style=\"height: 100px; width: auto;\">";
				}
				echo "<br><br>Baidu: $row->baidu_query<br><br>";
				$bi = json_decode($row->baidu_images);
				foreach ($bi as $src) {
					echo "<img src=\"$src\" style=\"height: 100px; width: auto;\">";
				}
				echo "<br><br>";
				echo "<a href=\"?action=import_images&amp;index=$index&amp;import=1\">import</a> | ";
				echo "<a href=\"?action=import_images&amp;index=$index&amp;import=1&amp;continue=1\">import and continue</a><br><br>";
			}
			if ($index > 0) {
				$prev = $index - 1;
				echo "<a href=\"?action=import_images&amp;index=$prev\">prev</a> | ";
			}
			$next = $index + 1;
			echo "<a href=\"?action=import_images&amp;index=$next\">next</a>";
			break;
		}
		$curr++;
	}
	exit;
}
add_action('wp_ajax_import_images', 'fwc_import_images');

class CSV_File {
	function __construct($path) {
		$this->path = $path;
		$this->fh = fopen($path, 'r');
		$this->headings = fgetcsv($this->fh);
	}

	function next_row($verbose = false) {
		if ($verbose)
			echo "before get\n";
		$row = fgetcsv($this->fh);
		if ($verbose)
			echo "after get\n";
		if (empty($row)) {
			if ($verbose)
				echo "returning null\n";
			return null;
		}
		$labeled = array();
		foreach ($row as $index => $value) {
			$key = $this->headings[$index];
			$labeled[$key] = $value;
		}
		if ($verbose)
			echo "returning labeled\n";
		return (object) $labeled;
	}
}
