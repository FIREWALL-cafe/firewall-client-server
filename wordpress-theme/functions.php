<?php

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


/////////////////////////////////////////////////
//// Sets up metadata for individual search display. ////
/////////////////////////////////////////////////
function fwc_post_meta() {
	$client = get_post_meta(get_the_ID(), 'client', true);
	?>
	Search by <?php echo esc_html($client); ?>
	on <a href="<?php the_permalink(); ?>" class="permalink"><?php fwc_get_search_timestamp(); ?></a>
	<?php echo fwc_get_search_popularity();
	edit_post_link('Edit', '&nbsp;&nbsp;|&nbsp;&nbsp;');
}

function fwc_post_language_meta() {

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

function fwc_get_search_ranking() {
	// Get the search ranking among all searches in terms of popularity.
}

// Total times the term has been searched.
function fwc_get_search_count() {
	$count = get_post_meta(get_the_ID(), 'count', true);
	return $count;
}

function fwc_get_initial_search_date() {
	$initial_search_date = get_post_meta(get_the_ID(), 'initial_search_date', true);
	return $initial_search_date;
}

// Total times the term has been searched through Google.
function fwc_get_search_count_google() {
	$count_google = get_post_meta(get_the_ID(), 'count_google', true);
	return $count_google;
}

// Total times the term has been searched through Baidu.
function fwc_get_search_count_baidu() {
	$count_baidu = get_post_meta(get_the_ID(), 'count_baidu', true);
	return $count_baidu;
}

function fwc_get_search_popularity() {
	$popularity = get_post_meta(get_the_ID(), 'popularity', true);
	if ($popularity > 1) {
		return "($popularity overall searches)";
	} else {
		return '';
	}
}

// Most recent search datetime.
function fwc_get_search_timestamp() {
	$timestamp = get_post_meta(get_the_ID(), 'timestamp', true);
	if ($timestamp) {
		echo date('M j, Y, g:ia', round($timestamp / 1000));
	} else {
		the_time('M j, Y, g:ia');
	}
}

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
		    empty($row->google_query) ||
		    empty($row->baidu_query) ||
		    empty($row->google_images) ||
		    empty($row->baidu_images)) {
			echo "Skipping $curr\n";
			continue;
		}

		$verbose = false; //($curr == 3095);
		if ($curr == $index) {
			if (!empty($_GET['import'])) {
				echo "Importing $row->google_query / $row->baidu_query<br><br>";
				fwc_import_post($row);
				echo "Done.<br><br>";
				if (!empty($_GET['continue'])) {
					$date_only = (empty($_GET['date_only'])) ? '' : '&date_only=1';
					$next = $index + 1;
					$next_url = "?action=import_images&index=$next&import=1&continue=1$date_only";
					echo "<script>window.location = '$next_url';</script>";
				}
			} else {
				// TODO: Handle missing image sets & placeholders here.

				echo "Google: $row->google_query<br><br>";
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


/////////////////////////////////////////////////
//// Import spreadsheet row and build or update post. ////
/////////////////////////////////////////////////
function fwc_import_post($row) {
	$slug = sanitize_title("$row->query");
	echo "Query: ".$slug."</br>";

	$post = get_page_by_path($slug, OBJECT, 'post');
	$post_id = $post->ID;
	echo "Post ID: ".$post_id."</br>";

	if ($post) {
		echo "Post already exists. Updating post with new data.</br>";
		fwc_update_post_content($post->ID, $row);
	} else {
		$title = "$row->query";
		$post_id = wp_insert_post(array(
			'post_title' => $title,
			'post_name' => $slug,
			'post_status' => 'draft'
		));

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

	add_post_meta( $post_id, 'censored_votes', 0, true);
	add_post_meta( $post_id, 'uncensored_votes', 0, true);
	add_post_meta( $post_id, 'maybe_censored_votes', 0, true);

	$initial_search_date = date('Y-m-d H:i:s', $timestamp - (5 * 60 * 60));
	$initial_search_date_gmt = date('Y-m-d H:i:s', $timestamp);
	echo "Initial search date: ".$initial_search_date."</br>";
	add_post_meta( $post_id, 'initial_search_date', $initial_search_date, true);
	add_post_meta( $post_id, 'initial_search_date_gmt', $initial_search_date_gmt, true);
}

function fwc_update_post_metadata($post_id, $row) {
	$timestamp = round($row->timestamp / 1000);
	echo "Timestamp: ".$timestamp."</br>";
	add_post_meta( $post_id, 'timestamp', $timestamp, false );

	$client = array( $timestamp => $row->client );
	echo "Client: ".$client."</br>";
	add_post_meta( $post_id, 'client', $client, false );

	$translation = array( $timestamp => $row->translation );
	echo "Translation: ".$translation."</br>";
	add_post_meta( $post_id, 'translation', $translation, false );

	$search_language = $row->lang_from;
	$search_language_confidence = $row->lang_confidence;
	$search_language_alternate = $row->lang_alternate;
	echo "Search language: ".$search_language."</br>";
	if ($search_language == 'en') {
		// Add to English
	}

	$search_language = array( $timestamp => $search_language );
	$search_language_confidence = array( $timestamp => $search_language_confidence );
	$search_language_alternate = array( $timestamp => $search_language_alternate );

	add_post_meta( $post_id, 'search_language', $search_language, false);
	add_post_meta( $post_id, 'search_language_confidence', $search_language_confidence, false);
	add_post_meta( $post_id, 'search_language_alternate', $search_language_alternate, false);

	echo "Search engine: ".$row->search_engine;
	$search_engine = array( $timestamp => $row->search_engine );
	add_post_meta( $post_id, 'search_engine', $search_engine, false );

	$google_images = array( $timestamp => $row->google_images );
	add_post_meta( $post_id, 'google_images', $google_images, false);

	$baidu_images = array( $timestamp => $row->baidu_images );
	add_post_meta( $post_id, 'baidu_images', $baidu_images, false);
}

function fwc_update_post_content($post_id, $row) {
	fwc_update_post_metadata($post_id, $row);
	fwc_build_post_content($post_id, $row);
}

function fwc_build_post_content($post_id, $row) {

	$google_images_html = fwc_build_image_set($post_id, $row, $row->google_images, 'google');
	$baidu_images_html = fwc_build_image_set($post_id, $row, $row->baidu_images, 'baidu');

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
		'post_status' => 'draft'
	);

	wp_update_post($post_data);
}

function fwc_build_image_set($post_id, $row, $images, $label) {
	if ($label == $row->search_engine) {
		$term = $row->query;
	} else {
		$term = $row->translation;
	}
	$urls = json_decode($images);
	$attachments = fwc_download_images($post_id, $urls, "$label-$row->timestamp");

	$heading = "<h3 class=\"query-label\">". ucwords($label) . ": <strong>" .
		esc_html($term) . "</strong></h3>";
	$ids = implode(',', $attachments);

	$image_set = "$heading\n[gallery ids=\"$ids\" link=\"none\"]\n\n";
	return $image_set;
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

function fwc_download_images($parent_id, $urls, $prefix) {
	$image_ids = array();
	$upload_dir = wp_upload_dir();
	$num = 0;
	foreach ($urls as $url) {
		echo "$url: ";
		$response = wp_remote_get($url, array(
			'timeout' => '30',
			'user-agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.11; rv:44.0) Gecko/20100101 Firefox/44.0'
		));
		$status = wp_remote_retrieve_response_code($response);
		echo $status . "<br>";
		if ($status == 200) {
			$num++;
			$image_num = $num;
			if ($image_num < 10) {
				$image_num = '0' . $image_num;
			}
			if ($response['headers']['content-type'] == 'image/jpeg') {
				$ext = 'jpg';
			} else if ($response['headers']['content-type'] == 'image/gif') {
				$ext = 'gif';
			} else if ($response['headers']['content-type'] == 'image/png') {
				$ext = 'png';
			} else {
				echo "Unexpected content-type: {$response['headers']['content-type']}<br>";
				continue;
			}
			$body = wp_remote_retrieve_body($response);
			$date = current_time('d');
			$dir = $upload_dir['path'] . "/$date/$parent_id";
			if (!file_exists($dir)) {
				wp_mkdir_p($dir);
			}
			$path = "$dir/$prefix-$image_num.$ext";
			file_put_contents($path, $body);
			echo "Saved: $path<br>";
			$image_ids[] = fwc_attach_image($parent_id, $path);
		}
	}
	return $image_ids;
}

function fwc_attach_image($parent_id, $path) {
	$filetype = wp_check_filetype(basename( $path ), null);
	$wp_upload_dir = wp_upload_dir();
	$attachment = array(
		'guid'           => $wp_upload_dir['url'] . '/' . basename( $path ),
		'post_mime_type' => $filetype['type'],
		'post_title'     => preg_replace( '/\.[^.]+$/', '', basename( $path ) ),
		'post_content'   => '',
		'post_status'    => 'inherit'
	);
	$attach_id = wp_insert_attachment( $attachment, $path, $parent_id );
	require_once( ABSPATH . 'wp-admin/includes/image.php' );
	$attach_data = wp_generate_attachment_metadata( $attach_id, $path );
	wp_update_attachment_metadata( $attach_id, $attach_data );
	return $attach_id;
}

function fwc_submit_images() {
	fwc_enable_cors();

	// if (!defined('FWC_SHARED_SECRET')) {
	// 	die('No FWC_SHARED_SECRET defined');
	// }

	// if (empty($_POST['secret']) ||
	//     $_POST['secret'] != FWC_SHARED_SECRET) {
	// 	return false;
	// }

	$row = (object) array(
		'timestamp' => $_POST['timestamp'],
		'search_engine' => $_POST['search_engine'],
		'client' => $_POST['client'],
		'query' => $_POST['query'],
		'translation' => $_POST['translated'],
		'google_images' => $_POST['google_images'],
		'baidu_images' => $_POST['baidu_images'],
		'lang_from' => $_POST['lang_from'],
		'lang_confidence' => $_POST['lang_confidence'],
		'lang_alternate' => $_POST['lang_alternate'],
	);

	// $row = (object) array(
	// 	'timestamp' => 1494002936099,
	// 	'search_engine' => 'google',
	// 	'client' => 'Rachel',
	// 	'query' => 'smog',
	// 	'translation' => '烟雾',
	// 	'testing' => 'test',
	// 	'google_images' => '["https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fen%2F0%2F0d%2FEnemy_poster.jpg","https%3A%2F%2Fimages-na.ssl-images-amazon.com%2Fimages%2FM%2FMV5BMTQ2NzA5NjE4N15BMl5BanBnXkFtZTgwMjQ4NzMxMTE%40._V1_UY1200_CR92%2C0%2C630%2C1200_AL_.jpg","https%3A%2F%2Fimg.clipartfest.com%2F0c170ac7dd190527f5170a84b1b16506_chess-two-rows-of-pawns-with-enemy_2716-1810.jpeg","http%3A%2F%2Fwiki.teamliquid.net%2Fcommons%2Fimages%2Fthumb%2Fa%2Fa6%2FEnemyGG.png%2F600px-EnemyGG.png","https%3A%2F%2Ffateclick.com%2Fimages%2Farticle%2F20160629173902286.jpg"]',
	// 	'baidu_images' => '["https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=3001856329,28893401&fm=23&gp=0.jpg","https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=399869671,3588326122&fm=23&gp=0.jpg","https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=4059498633,2217812550&fm=23&gp=0.jpg","https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=3044178884,1121413162&fm=23&gp=0.jpg","https://ss2.bdstatic.com/70cFvnSh_Q1YnxGkpoWK1HF6hhy/it/u=1038633627,702716351&fm=23&gp=0.jpg"]',
	// 	'lang_from' => 'en',
	// 	'lang_confidence' => '0.98828125',
	// 	'lang_alternate' => '',
	// );

	fwc_import_post($row);
	die(1);
}
add_action('wp_ajax_fwc_submit_images', 'fwc_submit_images');
add_action('wp_ajax_nopriv_fwc_submit_images', 'fwc_submit_images');

function fwc_intermediate_image_sizes($sizes) {
	if (defined('FWC_IMPORTING_IMAGES')) {
		return array(
			'thumbnail'
		);
	}
	return $sizes;
}
add_filter('intermediate_image_sizes', 'fwc_intermediate_image_sizes');

function fwc_enable_cors() {
	header('x-test: 1');
	header("Access-Control-Allow-Origin: *");
}
add_action('wp_headers', 'fwc_enable_cors');

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
