<?php

require_once(__DIR__.'/fwc-meta-utilities.php');

// Utility for taking screenshots of a full set of image search results

// Sizing:
// Image height baseline is 300px
// Spacing horizontally between images is 25px (1/12 baseline)
// Spacing vertically between images 100px (1/3 baseline)
// Spacing around all images is 25px (1/12 baseline)

// Usage:
// * Install Chrome extension "Window Resizer" <https://chrome.google.com/webstore/detail/window-resizer/kkelicaakdanhinjdeammmilcgefonfh>
// * Install Chrome extension "Full Page Screen Capture" <https://chrome.google.com/webstore/detail/full-page-screen-capture/fdpohaocaechififmbbbbbknoalclacl>
// * Choose the search result you want to screenshot and copy the slug at the end of the URL, e.g. "opium-1578692367"
// * Make sure you're logged in to the WordPress dashboard
// * Add the slug at the end of this URL: <https://firewallcafe.com/wp-admin/admin-ajax.php?action=fwc_search_result_screenshot?slug=>
// * Click on the "Window Resizer" extension, at the bottom click on "Resize window" to switch to "Resize viewport", and just to the left in the second (height) input enter "750"
// * Click on "Full Page Screen Capture" to screenshot the page, which opens a new window
// * Click on the icon with an arrow over a horizontal bar to save the resulting PNG

function fwc_search_result_screenshot() {
	$stylesheet_directory = get_stylesheet_directory_uri();
	echo <<<END
<html>
	<head>
		<link rel="stylesheet" href="$stylesheet_directory/reset.css" />
		<link rel="stylesheet" href="$stylesheet_directory/style.css" />
		<title>Firewall Cafe search result screenshot utility</title>
	</head>
	<body>
		<section class="search migrate-search-library migrate-search-library-special">
END;

	if (!isset($_GET['slug'])) {
		echo 'Please provide a search result slug, e.g. <b>opium-1578692367</b>';
	} else {
		$slug = $_GET['slug'];
		$args = array(
			'name' => $slug,
			'post_type' => 'search-result',
			'post_status' => 'publish',
			'numberposts' => 1
		);

		$posts = get_posts($args);

		if (!isset($posts[0])) {
			echo "No search results found for slug <b>$slug</b>";
		} else {
			$post = $posts[0];
			$post_id = $post->ID;
			$galleries = get_post_galleries($post_id, false);

			echo('<div class="post-content" id="images-gallery" style="margin-bottom: 0 !important;">');
			fwc_render_gallery($galleries[0]);
			fwc_render_gallery($galleries[1]);
			echo('</div>');

			echo <<<END
			</div>
		</section>
		<script src="$stylesheet_directory/js/jquery-2.2.0.min.js"></script>
		<script type="text/javascript">
			$(window).load(function () {
				// Remove image attributes inserted by WordPress
				$('img').each(function (index, element) {
					$(element).removeAttr('width').removeAttr('height');
				});

				// Get width of widest gallery
				var widthMax = 0;
				$('.gallery').each(function (index, element) {
					var widthSum = 0;
					$(this).find('img').each(function (index, element) {
						widthSum += $(this).width();
						widthSum += 25;
					});
					widthMax = Math.max(widthSum, widthMax);
				});
				$('.migrate-search-library-special').width(widthMax);
			});
		</script>
END;
		}
	}

	echo <<<END
		</body>
</html>
END;

	wp_die();
	exit;
}

add_action('wp_ajax_fwc_search_result_screenshot', 'fwc_search_result_screenshot');

?>