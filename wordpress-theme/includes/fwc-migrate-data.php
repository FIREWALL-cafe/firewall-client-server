<?php

// Crude migration tool from data schema versions 0 & 1 to version 2
// Saved for posterity
// Corresponding database backups:
// Before: firewallcafe_prod_20200107_143446.sql
// After: firewallcafe_prod_20200109_132735.sql

// Usage, must be authenticated:
// /wp-admin/admin-ajax.php?action=fwc_migrate_data

// See GET parameters for basic options
// When "wet" truthy, given page of 50 posts is migrated, then JS hack redirects to next page

$indent = 0;
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function fwc_migrate_data() {
	echo('<html><head><title>Migrate</title></head><body>');
	echo('<pre style="font-family: monospace; font-size: 12px; line-height: 1;">');

	$id = (int) $_GET['id'] or 0;
	$wet = (int) $_GET['wet'] or 0;
	$page = (int) $_GET['page'];
	if (!$page) {
		$page = 1;
	}
	
	if ($id) {
		$posts = array(get_post($id));
	} else {
		$posts = get_posts(
			array(
				'paged' => $page,
				'posts_per_page' => 50,
			)
		);
	}

	output(array(
		'dry run' => !$wet,
		'specific ID retrieved' => $id,
		'specific page retrieved' => $page,
		'number of posts' => sizeof($posts),
	), 'Stats', 'orange');

	foreach ($posts as $post) {
		print_r($post);
		$post_id = $post->ID;
		$post_meta = get_post_meta($post_id, '');
		$post_categories = map_to_slugs(
			wp_get_post_categories($post_id, array('fields' => 'all'))
		);
		$post_tags = map_to_slugs(
			wp_get_post_terms($post_id, 'post_tag')
		);
		$post_censorship_status = map_to_slugs(
			wp_get_post_terms($post_id, 'censorship_status')
		);
		$post_translation_status = map_to_slugs(
			wp_get_post_terms($post_id, 'translation_status')
		);
		$post_search_engine = map_to_slugs(
			wp_get_post_terms($post_id, 'search_engine')
		);
		$post_search_language = map_to_slugs(
			wp_get_post_terms($post_id, 'search_language')
		);
		$post_locations = map_to_slugs(
			wp_get_post_terms($post_id, 'locations')
		);
		$post_is_new_style = (array_key_exists('new_template_style', $post_meta)) ? intval($post_meta['new_template_style'][0]) : 0;
		
		$post_timestamps = array_unique($post_meta['timestamp']);
		$post_timestamps_quantity = sizeof($post_timestamps);

		// output($post, 'Full post object', 'lavender');
		// output($post_meta, 'Full post meta');
		// output(array_keys($post_meta), 'Full post meta keys only');
		// output($post_tags, 'Tags', 'lavender');
		// output($post_categories, 'Categories', 'lavender');
		// output($post_censorship_status, 'Censorship', 'lavender');
		// output($post_translation_status, 'Translation', 'lavender');
		// output($post_search_engine, 'Search engine', 'lavender');
		// output($post_search_language, 'Search language', 'lavender');
		// output($post_locations, 'Locations', 'lavender');

		if ($post->post_type != 'post') {
			output($post->post_type);
			output($post, 'Post object');
			output($post_meta, 'Post meta');
			output($post_tags, 'Post tags');
			leave();
		}

		$post_media = get_attached_media('image', $post_id);
		// output(sizeof($post_media), 'Post media size');
		// output($post_media, 'Post media');
		// $args = array(
		// 	'post_type' => 'attachment',
		// 	'numberposts' => -1,
		// 	'post_status' => null,
		// 	'post_parent' => $post->ID,
		// );
		// $attachments = get_posts($args);
		// echo(json_decode(array_values(get_post_meta($post_id, 'google_images')[0])[0])[0]->src);
		// Attachments (usually) saved in `/date/parent_id/search_engine-timestamp-number.extension`
		// Need to go by gallery IDs because attachments are all clustered onto one post
		// Clean the image array

		// preg_match('/(ids="[^"]+")/', $post->post_content, $matches);
		// output($matches, 'Galleries');
		// if (sizeof($matches) == 2) {
		// 	$data['images_google'] = substr($matches[0], 5, -1);
		// 	$data['images_baidu'] = substr($matches[1], 5, -1);
		// }

		$data_general = array(
			'tags' => [],
			'search_term_status_banned' => 0,
			'search_term_status_sensitive' => 0,
			'location' => NULL,
		);

		$get_votes = function ($post_meta, $key) {
			return isset($post_meta[$key][0]) ? intval($post_meta[$key][0]) : 0;
		};

		$data_general['votes_censored'] = $get_votes($post_meta, 'censored_votes');
		$data_general['votes_uncensored'] = $get_votes($post_meta, 'uncensored_votes');
		$data_general['votes_bad_translation'] = $get_votes($post_meta, 'bad_translation_votes');
		$data_general['votes_good_translation'] = $get_votes($post_meta, 'good_translation_votes');
		$data_general['votes_lost_in_translation'] = $get_votes($post_meta, 'lost_in_translation_votes');
		$data_general['votes_bad_result'] = $get_votes($post_meta, 'bad_result_votes');
		$data_general['votes_nsfw'] = $get_votes($post_meta, 'nsfw_votes');

		foreach ($post_tags as $tag) {
			if ($tag === 'bad-result') {
				tag_and_increment($data_general, 'votes_bad_result');
			}
			if ($tag === 'lost-in-translation') {
				tag_and_increment($data_general, 'votes_lost_in_translation');
			}
			if ($tag === 'nsfw') {
				tag_and_increment($data_general, 'votes_nsfw');
			}
			if ($tag === 'banned') { // only use this for old style posts
				tag_and_increment($data_general, 'search_term_status_banned');
				$data_general['search_term_status_banned'] = 1;
			}
			if ($tag === 'sensitive') { // only use for old style
				tag_and_increment($data_general, 'search_term_status_sensitive');
				$data_general['search_term_status_sensitive'] = 1;
			}
		}
		foreach ($post_categories as $tag) {
			if ($tag === 'badresult' or $tag === 'fwbug' or $tag === 'user') {
				tag_and_increment($data_general, 'votes_bad_result');
			}
			if ($tag === 'badtranslation') {
				tag_and_increment($data_general, 'votes_bad_translation');
			}
			if ($tag === 'banned') { // only use this for old style posts
				tag_and_increment($data_general, 'search_term_status_banned');
				$data_general['search_term_status_banned'] = 1;
			}
			if ($tag === 'good') {
				tag_and_increment($data_general, 'votes_good_translation');
			}
			if ($tag === 'lost') {
				tag_and_increment($data_general, 'votes_lost_in_translation');
			}
			// if ($tag === 'oslo') {
			// 	tag_and_increment($data_general, 'location_oslo');
			// 	$data_general['location'] = 'oslo';
			// }
			// if ($tag === 'nyc') {
			// 	tag_and_increment($data_general, 'location_new_york_city');
			// 	$data_general['location'] = 'new_york_city';
			// }
		}
		foreach ($post_censorship_status as $censor) {
			if ($tag === 'censored') {
				tag_and_increment($data_general, 'votes_censored');
			}
			if ($tag === 'not-censored' or $tag === 'uncensored') {
				tag_and_increment($data_general, 'votes_uncensored');
			}
		}
		// Update votes and filter tags according to taxonomy data
		// Update filter tags according to votes
		// Assemble new post(s) with specific and general data
		// Overwrite location based on installation dates
		// output($data_general, 'Data general');

		$counter = 1;
		output("Unwinding parent post ID $post->ID with $post_timestamps_quantity unique timestamps", '', 'cyan');
		$GLOBALS['indent'] = 1;

		foreach ($post_timestamps as $post_timestamp) {
			// Build a new search result
			$data = array(
				'copyright_takedown' => NULL,
				'data_migration_post_id_original' => $post_id,
				'data_migration_schema_original' => NULL,
				// Consider saving original timestamp
				// Need array of image attachments/hrefs for convenience?
				'images_google' => NULL,
				'images_baidu' => NULL, // stripslashes?
				'search_client_name' => NULL,
				'search_engine_initial' => NULL,
				'search_location' => NULL,
				'search_term_language_initial_code' => NULL,
				'search_term_language_initial_name' => NULL,
				'search_term_language_initial_confidence' => NULL,
				'search_term_language_initial_alternate' => NULL,
				'search_term_initial' => NULL,
				'search_term_status_banned' => NULL,
				'search_term_status_sensitive' => NULL,
				'search_term_popularity' => NULL, // legacy
				'search_term_translation' => NULL,
				'timestamp' => NULL,
			);

			if (array_key_exists('copyright_takedown', $post_meta)) {
				$data['copyright_takedown'] = $post_meta['copyright_takedown'];
			}

			// Normalize 13-digit timestamps found in old style posts
			$timestamp = intval($post_timestamp);
			if (($timestamp / 10000000000) >= 1) {
				// This should be `floor` but preexisting code uses `round`
				$timestamp = round($timestamp / 1000);
			}
			$data['timestamp'] = $timestamp;

			if ($post_is_new_style) {
				$data['data_migration_schema_original'] = 1;
				$data['search_location'] = get_meta($post_meta['location'], $timestamp);
				$data['search_client_name'] = get_meta($post_meta['client'], $timestamp);
				$data['search_engine_initial'] = get_meta($post_meta['search_engine'], $timestamp);
				$data['search_term_initial'] = $post->post_title;
				$data['search_term_translation'] = get_meta($post_meta['translation'], $timestamp);
				$data['search_term_language_initial_code'] = get_meta($post_meta['search_language'], $timestamp);
				$data['search_term_language_initial_name'] = get_meta($post_meta['search_language_name'], $timestamp);
				$data['search_term_language_initial_confidence'] = get_meta($post_meta['search_language_name'], $timestamp);
				$data['search_term_language_initial_alternate'] = get_meta($post_meta['search_language_alternate'], $timestamp);
				$data['search_term_status_banned'] = (get_meta($post_meta['banned'], $timestamp) === 'true') ? 1 : 0;
				$data['search_term_status_sensitive'] = (get_meta($post_meta['sensitive'], $timestamp) === 'true') ? 1 : 0;

				if (sizeof($post_timestamps) > 1) {
					$data['data_migration_unflattened'] = 1;
				} else {
					$data['data_migration_unflattened'] = 0;
				}
			} else {
				$data['data_migration_schema_original'] = 0;
				$data['search_client_name'] = $post->client;
				$data['search_location'] = $data_general['location'];
				$data['search_term_status_banned'] = $data_general['search_term_status_banned'];
				$data['search_term_status_sensitive'] = $data_general['search_term_status_sensitive'];
				$data['search_term_initial'] = $post->google_query;
				$data['search_term_translation'] = $post->baidu_query;
				$data['search_term_popularity'] = $post->popularity;
			}

			$distribute = function ($value, $spread) {
				if (intval($value) === 0) {
					return 0;
				} else {
					return max(1, floor(intval($value) / $spread));
				}
			};
			$across = $post_timestamps_quantity;

			$data['votes_censored'] = $distribute($data_general['votes_censored'], $across);
			$data['votes_uncensored'] = $distribute($data_general['votes_uncensored'], $across); 
			$data['votes_bad_translation'] = $distribute($data_general['votes_bad_translation'], $across);
			$data['votes_good_translation'] = $distribute($data_general['votes_good_translation'], $across);
			$data['votes_lost_in_translation'] = $distribute($data_general['votes_lost_in_translation'],  $across);
			$data['votes_bad_result'] = $distribute($data_general['votes_bad_result'], $across);
			$data['votes_nsfw'] = $distribute($data_general['votes_nsfw'], $across);

			$tags = $data_general['tags'];
			if ($data['search_term_status_banned']) {
				$tags[] = 'has_search_term_status_banned';
			}
			if ($data['search_term_status_sensitive']) {
				$tags[] = 'has_search_term_status_sensitive';
			}
			if ($data['search_term_language_initial_code']) {
				$tags[] = 'has_search_term_language_initial_code_'.$data['search_term_language_initial_code'];
			}

			$votes = [
				'votes_censored',
				'votes_uncensored',
				'votes_bad_translation',
				'votes_good_translation',
				'votes_lost_in_translation',
				'votes_bad_result',
				'votes_nsfw',
			];

			foreach ($votes as $vote) {
				$total = (int) $data[$vote];
				// echo $total;
				if ($total > 0) {
					$tags[] = 'has_'.$vote;
				}
			}

			$location = 'new_york_city';
			if ($timestamp > 1480593600) {
				$location = 'st_polten';
			}
			if ($timestamp > 1494504000) {
				$location = 'new_york_city';
			}
			if ($timestamp > 1495108800) {
				$location = 'oslo';
			}
			if ($timestamp > 1505649600) {
				$location = 'new_york_city';
			}
			if ($timestamp > 1527249600) {
				$location = 'oslo';
			}
			if ($timestamp > 1531828800) {
				$location = 'new_york_city';
			}
			if ($timestamp > 1546776000) {
				$location = 'hong_kong';
			}
			if ($timestamp > 1568635200) {
				$location = 'new_york_city';
			}
			if ($timestamp > 1568894400) {
				$location = 'ann_arbor';
			}
			if ($timestamp > 1569931200) {
				$location = 'new_york_city';
			}

			$data['search_location'] = $location;
			$tags[] = 'has_search_location_'.$location;
			$tags[] = 'has_search_year_'.date('Y', $timestamp);
			$tags = array_unique($tags);
			$tags = implode(',', $tags);
			output($tags, 'Tags to apply');

			if ($location === 'st_polten') {
				$image_timestamps = array_map(
					function ($element) {
						return intval(explode('-', $element->post_name)[1]);
					},
					$post_media
				);
				$image_timestamps = array_unique($image_timestamps);
				if (count($image_timestamps) > 1) {
					$data['data_migration_nearest_neighbor_images'] = 1;
					$image_timestamp = max($image_timestamps);
				} else if (count($image_timestamps) === 1) {
					$data['data_migration_nearest_neighbor_images'] = 0;
				} else {
					$data['data_migration_nearest_neighbor_images'] = 0;
					$image_timestamp = 0;
				}
			} else {
				$image_timestamp = $post_timestamp;
			}

			// output(array_map(function ($element) {
			// 	return $element->post_name;
			// }, $post_media), 'Reduced $post_media');

			$google_prefix = 'google-'.$image_timestamp.'-';
			$baidu_prefix = 'baidu-'.$image_timestamp.'-';

			$google_attachments = array_filter(
				$post_media, function ($element) use ($google_prefix) {
					return (
						(substr_count($element->post_name, '-') === 2)
						&&
						(strpos($element->post_name, $google_prefix) !== false)
					);
				}
			);
			$baidu_attachments = array_filter(
				$post_media, function ($element) use ($baidu_prefix) {
					return (
						(substr_count($element->post_name, '-') === 2)
						&&
						(strpos($element->post_name, $baidu_prefix) !== false)
					);
				}
			);

			if ($post_is_new_style) {
				$hrefs_google = get_meta($post_meta['google_images'], $timestamp);
				$hrefs_baidu = get_meta($post_meta['baidu_images'], $timestamp);
			} else {
				$hrefs_google = json_decode(stripslashes($post->google_images), 'as hash');
				$hrefs_baidu = json_decode(stripslashes($post->baidu_images), 'as hash');
			}

			$data['images_baidu'] = [];
			$counter_baidu = 0;
			foreach ($baidu_attachments as $attachment) {
				$href = ($post_is_new_style) ? $attachment->post_content : $hrefs_baidu[$counter_baidu];
				$data['images_baidu'][] = array(
					'original_href' => $href,
					'attachment_post_id' => $attachment->ID,
				);
				$counter_baidu += 1;
			}

			$data['images_google'] = [];
			$counter_google = 0;
			foreach ($google_attachments as $attachment) {
				$href = ($post_is_new_style) ? $attachment->post_content : $hrefs_google[$counter_google];
				$data['images_google'][] = array(
					'original_href' => $href,
					'attachment_post_id' => $attachment->ID,
				);
				$counter_google += 1;
			}

			// output($data, 'Meta to save');

			// Create new post with data
			$new_post_id = insert_post($data, $wet);
			output("Inserted new post with ID $new_post_id");
			// output($data, 'Passed data');
			// Update post filter tags based on vote values, locations, statuses

			if ($wet) {
				// Update new post meta
				foreach ($data as $meta_key => $meta_value) {
					update_post_meta($new_post_id, $meta_key, $meta_value);
				}
				wp_set_post_tags($new_post_id, $tags);
			}

			// Reassign attachments to new post
			if ($wet and 0) {
				foreach ($data['images_google'] as $item) {
					$media_post = wp_update_post(array(
						'ID' => $item['attachment_post_id'],
						'post_parent' => $new_post_id,
					));
				}
				foreach ($data['images_baidu'] as $item) {
					$media_post = wp_update_post(array(
						'ID' => $item['attachment_post_id'],
						'post_parent' => $new_post_id,
					));
				}
			}
			$counter += 1;
		}

		if ($wet) {
			// Delete old parent post meta
			foreach ($post_meta as $key => $value) {
				delete_post_meta($post_id, $key);
			}
			// Delete old parent post
			wp_delete_post($post_id, true /* force_delete */);
			// Delete tags and other taxonomies
		}

		// Decrease indentation level
		$GLOBALS['indent'] = 0;
	}

	if (!empty($posts) and $wet) {
		$page++;
		echo "</pre>";
		echo "<script type='text/javascript'>setTimeout(function() { window.location = '/wp-admin/admin-ajax.php?action=fwc_migrate_data&page=$page&wet=$wet'; }, 1000);</script>";
	}
	leave();
}

function tag_and_increment(&$data, $key) {
	$data['tags'][] = 'has_'.$key;
	if (array_key_exists($key, $data) and $data[$key] === 0) {
		$data[$key] += 1;
	}
}

function insert_post($data, $wet) {
	$post_date_gmt = date('Y-m-d H:i:s', $data['timestamp']); // NYC would use `($data['timestamp'] - (5*60*60))`

	$gallery_google = implode(',', generate_gallery($data['images_google']));
	$gallery_baidu = implode(',', generate_gallery($data['images_baidu']));

	$post_name_hyphenated = implode('-', explode(' ', $data['search_term_initial']));

	$serialized = array(
		'post_type' => 'search-result',
		'post_title' => $data['search_term_initial'],
		'post_excerpt' => $data['search_term_translation'],
		'post_name' => $post_name_hyphenated.'-'.$data['timestamp'], // Unique identifier
		'post_status' => 'publish',
		'post_date' => $post_date_gmt,
		'post_date_gmt' => $post_date_gmt,
		'post_content' => "Google\n[gallery ids=\"".$gallery_google."\"]\nBaidu\n[gallery ids=\"".$gallery_baidu."\"]",
	);
	output($serialized, 'Serialized post data');

	if ($wet) {
		$post_id = wp_insert_post($serialized);
	} else {
		$post_id = '[no post ID, dry run]';
	}

	return $post_id;
}

function generate_gallery($images) {
	$reduced = [];
	foreach ($images as $item) {
		$reduced[] = $item['attachment_post_id'];
	}
	return $reduced;
}

function get_meta($meta_values, $timestamp) {
	$matches = array_filter($meta_values, function ($element) use ($timestamp) {
		$array = unserialize($element);
		return isset(unserialize($element)[$timestamp]);
	});

	$value = end($matches);
	return unserialize($value)[$timestamp];

	// if (gettype($value) == 'string' || gettype($data) == 'boolean') {
	// 	return $value;
	// } else {
	// 	return end($value);
	// }
}

function map_to_slugs($array) {
	return array_map(function ($value) {
		if (property_exists($value, 'slug')) {
			return $value->slug;
		}
		if (array_key_exists('slug', $value)) {
			return $value['slug'];
		}
		return NULL;
	}, $array);
}

function output($variable, $heading=NULL, $background='') {
	$has = ($heading) ? '#edd' : '#ded';
	$background = ($background) ? $background : $has;
	echo('<div class="migration block" style="background: '.$background.'; border: 1px solid #ccc; margin-bottom: 0.5rem; margin-left: '.($GLOBALS['indent']*2).'rem; padding: 0.5rem;">');
	if ($heading) {
		echo("<h1 style='font-size: 14px; margin: 0;'>$heading</h1>");
	}
	if ($variable) {
		print_r($variable);
	} else {
		echo('[empty]');
	}
	echo('</div>');
}

function leave() {
	echo('</pre>');
	echo('</body></html>');
	exit;
}

add_action('wp_ajax_fwc_migrate_data', 'fwc_migrate_data');

?>