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
//// Sets up metadata for individual search display. ////
/////////////////////////////////////////////////
function fwc_post_meta() {
	$client = get_post_meta(get_the_ID(), 'client', true); ?>
	Search by <?php echo esc_html($client); ?>
	on <a href="<?php the_permalink(); ?>" class="permalink"><?php fwc_get_search_timestamp(); ?></a>
	<?php echo fwc_get_search_popularity();
	edit_post_link('Edit', '&nbsp;&nbsp;|&nbsp;&nbsp;');
}

function fwc_get_search_popularity() {
	$popularity = get_post_meta(get_the_ID(), 'popularity', true);
	if ($popularity > 1) {
		return "($popularity overall searches)";
	} else {
		return '';
	}
}

function fwc_get_search_timestamp() {
	$timestamp = get_post_meta(get_the_ID(), 'timestamp', true);
	if ($timestamp) {
		echo date('M, j Y, g:ia', round($timestamp / 1000));
	} else {
		the_time('M, j Y, g:ia');
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

function fwc_import_post($row) {

	// TODO: Reconsider how we assign slugs. Adjust logic here.
	$slug = sanitize_title("$row->google_query-$row->baidu_query");

	$post = get_page_by_path($slug, OBJECT, 'post');
	if ($post) {
		fwc_update_post_content($post->ID, $row);
	} else {
		$title = "$row->google_query / $row->baidu_query";
		$post_id = wp_insert_post(array(
			'post_title' => $title,
			'post_name' => $slug,
			'post_status' => 'draft'
		));
		if (!empty($post_id)) {
			fwc_update_post_content($post_id, $row);
		}
	}
}

function fwc_update_post_content($post_id, $row) {
	// TODO: This overwrites existing searches with new content every time a search is repeated.
	// Consider modifying so that this begins appending new content instead.
	$timestamp = round($row->timestamp / 1000);
	$post_date = date('Y-m-d H:i:s', $timestamp  - (5 * 60 * 60)); // EST
	$post_date_gmt = date('Y-m-d H:i:s', $timestamp);
	if (!empty($_GET['date_only'])) {
		wp_update_post(array(
			'ID' => $post_id,
			'post_date' => $post_date,
			'post_date_gmt' => $post_date_gmt,
			'edit_date' => true
		));
	} else {
		fwc_update_popularity($post_id);
		update_post_meta($post_id, 'timestamp', $row->timestamp);
		update_post_meta($post_id, 'client', $row->client);
		update_post_meta($post_id, 'google_query', $row->google_query);
		update_post_meta($post_id, 'baidu_query', $row->baidu_query);

		// Prevent overwriting image sets with blank image sets if subsequent searches yield no results.
		if (!empty($row->google_images)) {
			update_post_meta($post_id, 'google_images', $row->google_images);
		}
		if (!empty($row->baidu_images)) {
			update_post_meta($post_id, 'baidu_images', $row->baidu_images);
		}

		$google_urls = json_decode($row->google_images);
		$google_attachments = fwc_download_images($post_id, $google_urls, "google-$row->timestamp");
		$baidu_urls = json_decode($row->baidu_images);
		$baidu_attachments = fwc_download_images($post_id, $baidu_urls, "baidu-$row->timestamp");
		$google_heading = "<h3 class=\"query-label\">Google: <strong>" . esc_html($row->google_query) . "</strong></h3>";
		$google_ids = implode(',', $google_attachments);
		$baidu_heading = "<h3 class=\"query-label\">Baidu: <strong>" . esc_html($row->baidu_query) . "</strong></h3>";
		$baidu_ids = implode(',', $baidu_attachments);
		wp_update_post(array(
			'ID' => $post_id,
			'post_content' => "$google_heading\n[gallery ids=\"$google_ids\" link=\"none\"]\n\n" .
			                  "$baidu_heading\n[gallery ids=\"$baidu_ids\" link=\"none\"]",
			'post_date' => $post_date,
			'post_date_gmt' => $post_date_gmt,
			'edit_date' => true,
			//'post_status' => 'publish'
		));
	}
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

// TODO: Handle URL-encoded images here
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

	if (!defined('FWC_SHARED_SECRET')) {
		die('No FWC_SHARED_SECRET defined');
	}
	if (empty($_POST['secret']) ||
	    $_POST['secret'] != FWC_SHARED_SECRET) {
		return false;
	}
	$row = (object) array(
		'timestamp' =>     $_POST['timestamp'],
		'client' =>        $_POST['client'],
		'google_query' =>  $_POST['google_query'],
		'baidu_query' =>   $_POST['baidu_query'],
		'google_images' => $_POST['google_images'],
		'baidu_images' =>  $_POST['baidu_images']
	);
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
