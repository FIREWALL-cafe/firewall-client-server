<?php

// Tool for migrating data from WordPress schema 0, 1, 2 to PSQL schema 3

// Requirements:
// * WordPress environment serving from a copy of the most recent production
//   MySQL database and uploaded image set
// * PSQL database in the same environment, initialized with the file
//   `/api/db_resources/config.sql`

// Steps:
// * Authenticate to the WordPress dashboard
// * Modify the PSQL database info below to match your setup
// * Hit: /wp-admin/admin-ajax.php?action=migrate_psql

// Options:
// * Debug migrating a single search, numbered chronologically from 1, which
//   shows granular data, but doesn't perform any database operations
// * Start/stop the loop to migrate all searches from the beginning one at a
//   time, delivering a summary of migration stats and errors, this takes
//   about an hour, and should be done on a freshly initialized database

// WARNING: This tool simply appends to the PSQL database. It won't warn if
// that database is nonempty. If there's an error, once it's debugged, the
// target database should be wiped, and the process started fresh.

function migrate_psql() {
	$page = (isset($_POST['page'])) ? $_POST['page'] : 0;
	$debug = (isset($_POST['debug'])) ? $_POST['debug'] : 1;

	if (!$page) {
		$path_template = get_template_directory_uri();
		$path_ui = "$path_template/includes/fwc-migrate-psql-ui.php";
		echo file_get_contents($path_ui);
	} else {
		// Connect even if debug run, otherwise `pg_escape_literal` fails
		// Configure as needed to match local PSQL database in use
		$database = pg_connect('host=localhost dbname=dbname user=user password=password');

		// Get WP post data
		remove_all_filters('posts_orderby'); // This was tough to find!
		$quantity = 1; // Get one post at a time
		$query = new WP_Query(array(
			'order' => 'ASC',
			'orderby' => 'date',
			'offset' => ($page - 1) * $quantity,
			'posts_per_page' => $quantity,
			'post_type' => 'search-result',
			'post_status' => 'publish',
			'supress_filters' => TRUE,
		));
		$query_posts = $query->posts;
		$query_sql = $query->request;

		// Try to migrate post, collect errors, and return them
		if (sizeof($query_posts)) {
			$summary = migrate_psql_insert_search($debug, $database, $query_posts[0]);
		} else {
			$summary = [];
		}

		echo json_encode(array(
			'page' => $page,
			'debug' => $debug,
			'data' => $summary,
		));

		pg_close($database);
	}

	exit;
}

function migrate_psql_insert_search($debug, $database, $post) {
	$summary = array(
		'action' => 'insert_search',
		'errors' => [], // Granular error data
		'debug' => [], // Granular test data,
		'quantity' => 1,
	);

	// Flatten search result post meta
	$post_meta = get_post_meta($post->ID, '');
	$post_meta = array_map(function ($element) {
		return $element[0];
	}, $post_meta);

	if ($debug) {
		$summary['debug'][] = array(
			'title' => 'Search post object',
			'data' => $post,
		);
		$summary['debug'][] = array(
			'title' => 'Search post meta',
			'data' => $post_meta,
		);
	}

	// Construct array with keys corresponding to database field names
	// Start with fields which are always present
	$data = array(
		'search_id' => 'DEFAULT',
		'search_timestamp' => $post_meta['timestamp'] * 1000,
			// Writes to WP were trimmed to 10-digit precision from schema 1 onward
			// Writes to API should use 13-digit precision from schema 3 onward
		'search_location' => pg_escape_literal($post_meta['search_location']),
		'search_client_name' => pg_escape_literal($post_meta['search_client_name']),
		'search_term_initial' => pg_escape_literal($post_meta['search_term_initial']),
		'search_term_translation' => pg_escape_literal($post_meta['search_term_translation']),
		'search_term_status_banned' => $post_meta['search_term_status_banned'] ? 'TRUE' : 'FALSE',
		'search_term_status_sensitive' => $post_meta['search_term_status_sensitive'] ? 'TRUE' : 'FALSE',
		'search_schema_initial' => $post_meta['data_migration_schema_original'],
		'wordpress_search_result_post_id' => $post->ID,
		'wordpress_search_result_post_slug' => pg_escape_literal($post->post_name),
	);

	// Now add more complex fields if available
	// First 3 fields are not included (and default to NULL upon insert) for posts
	// with initial schema 0 for which Google Translate language detection data
	// was never sent

	// Field 'search_term_initial_language_code'
	if (isset($post_meta['search_term_language_initial_code'])) {
		$data['search_term_initial_language_code'] = pg_escape_literal($post_meta['search_term_language_initial_code']);
	}

	// Field 'search_term_initial_language_confidence'
	// Schema 1 posts overwritten with language name and need to be patched
	if (isset($post_meta['search_term_language_initial_confidence'])) {
		$data['search_term_initial_language_confidence'] = $post_meta['search_term_language_initial_confidence'];
	}

	// Field 'search_term_initial_language_alternate_code'
	// Empty string if detection data was sent but empty
	if (isset($post_meta['search_term_language_initial_alternate'])) {
		$data['search_term_initial_language_alternate_code'] = pg_escape_literal($post_meta['search_term_language_initial_alternate']);
	}

	// Field 'search_engine_translation'
	// Was never sent for posts with initial schema 0 and 1
	if (isset($post_meta['search_engine_initial'])) {
		if ($post_meta['search_engine_initial']) {
			$data['search_engine_initial'] = pg_escape_literal($post_meta['search_engine_initial']);
		}
		if ($post_meta['search_engine_initial'] === 'google') {
			$data['search_engine_translation'] = pg_escape_literal('baidu');
		}
		if ($post_meta['search_engine_initial'] === 'baidu') {
			$data['search_engine_translation'] = pg_escape_literal('google');
		}
	}

	// Field 'search_term_translation_language_code'
	// Mirrors corresponding logic in `firewall-client.js`
	if (isset($post_meta['search_term_language_initial_code'])) {
		$code = $post_meta['search_term_language_initial_code'];
		if ($code === 'zh-CN' || $code === 'zh-TW') {
			$data['search_term_translation_language_code'] = '\'en\'';
		} else {
			$data['search_term_translation_language_code'] = '\'zh-CN\'';
		}
	}

	// Field 'wordpress_search_term_popularity'
	// Only written for posts with initial schema 0, see docs
	if (isset($post_meta['search_term_popularity'])) {
		$data['wordpress_search_term_popularity'] = $post_meta['search_term_popularity'];
	}

	// Field 'wordpress_copyright_takedown'
	// In very few cases this field is a serialized string
	if (isset($post_meta['copyright_takedown'])) {
		$unserialized = unserialize($post_meta['copyright_takedown']);
		if (is_array($unserialized) && isset($unserialized[0])) {
			if ($unserialized[0] === 'yes') {
				$data['wordpress_copyright_takedown'] = 'TRUE';
			}
			if ($unserialized[0] === 'no') {
				$data['wordpress_copyright_takedown'] = 'FALSE';
			}
		}
	}

	// Field 'wordpress_unflattened'
	// Only written for schema 1 posts containing multiple timestamps, see docs
	if (isset($post_meta['data_migration_unflattened'])) {
		$data['wordpress_unflattened'] = ($post_meta['data_migration_unflattened']) ? 'TRUE' : 'FALSE';
	}

	// Field 'wordpress_regular_post_id'
	// Posts with initial schema 0 and 1 were migrated from regular post type to
	// custom search result post type with schema 2
	if (isset($post_meta['data_migration_post_id_original'])) {
		$data['wordpress_regular_post_id'] = $post_meta['data_migration_post_id_original'];
	}

	// Implode keys and values to construct PSQL query
	// Minimizes redundancy and potential for mistakes
	// TODO Insert only if not already present
	$imploded_keys = implode(', ', array_keys($data));
	$imploded_values = implode(', ', array_values($data));
	$query_string = "INSERT INTO searches ({$imploded_keys}) VALUES ({$imploded_values}) RETURNING search_id;";

	if ($debug) {
		$summary['debug'][] = array(
			'title' => 'Search data payload',
			'data' => $data,
		);
		$summary['debug'][] = array(
			'title' => 'Search query string',
			'data' => $query_string,
		);
		$search_id = 0;
	} else {
		$search_id = NULL;
		$query_request = pg_query($database, $query_string);
		if ($query_request) {
			$query_response = pg_fetch_object($query_request);
			if (isset($query_response->search_id)) {
				$search_id = $query_response->search_id;
			} else {
				$summary['errors'][] = array(
					'title' => 'DB bad response',
					'data' => pg_last_error(),
				);
			}
		} else {
			$summary['errors'][] = array(
				'title' => 'DB bad request',
				'data' => pg_last_error(),
			);
		}
	}

	if (is_numeric($search_id)) {
		$summary_votes = migrate_psql_insert_votes($debug, $database, $search_id, $post_meta);
		$summary_images = migrate_psql_insert_images($debug, $database, $search_id, $post->ID, $post_meta);
	}

	return [$summary, $summary_votes, $summary_images];
}

function migrate_psql_insert_votes($debug, $database, $search_id, $post_meta) {
	$vote_keys_ids = array(
		'votes_censored' => 1,
		'votes_uncensored' => 2,
		'votes_bad_translation' => 3,
		'votes_good_translation' => 4,
		'votes_lost_in_translation' => 5,
		'votes_bad_result' => 6,
		'votes_nsfw' => 7,
	);

	$votes_all = array_reduce(
		array_keys($vote_keys_ids),
		function ($carry, $key) use ($search_id, $post_meta, $vote_keys_ids) {
			$vote_string = "($vote_keys_ids[$key], $search_id)";
			$vote_count = $post_meta[$key];
			$vote_stack = array_fill(0, $vote_count, $vote_string);
			return array_merge($carry, $vote_stack);
		},
		[]
	);

	$vote_count = sizeof($votes_all);
	$summary = array(
		'action' => 'insert_votes',
		'errors' => [], // Granular error data
		'debug' => [], // Granular test data,
		'quantity' => $vote_count,
	);

	if ($vote_count) {
		$imploded_votes = implode(', ', $votes_all);
		$query_string = "INSERT INTO have_votes (vote_id, search_id) VALUES {$imploded_votes};";
		// vote_timestamp, vote_client_name, vote_ip_address all NULL for migrated votes

		if (!$debug) {
			$query_request = pg_query($database, $query_string);
			if (!$query_request) {
				$summary['errors'][] = array(
					'title' => 'DB bad request',
					'data' => pg_last_error(),
				);
			}
		}
	} else {
		$query_string = '-- NO VOTES TO INSERT --';
	}

	if ($debug) {
		$summary['debug'][] = array(
			'title' => 'Votes query string',
			'data' => $query_string,
		);
	}

	return $summary;
}

function migrate_psql_insert_images($debug, $database, $search_id, $post_id, $post_meta) {
	// Collate list of images, original image URL and WP attachment post ID
	$images_google = unserialize($post_meta['images_google']);
	$images_baidu = unserialize($post_meta['images_baidu']);
	$images_all = array_merge($images_google, $images_baidu);

	// First 478 schema 0 posts had image attachments with mixed filenames, and so
	// attachments weren't successfully migrated to schema 2, but files were
	// retained, below is black magic to reconstitute them.
	if (!sizeof($images_all) && ((integer) $post_meta['timestamp'] < 1455923877)) {
		$post_id_original = $post_meta['data_migration_post_id_original'];
		$search_term_initial = $post_meta['search_term_initial'];
		$path_uploads = wp_upload_dir()['basedir'];
		$glob_directory = glob("$path_uploads/2016/02/*/$post_id_original/*");

		$files = array();

		if (sizeof($glob_directory)) {
			$files = $glob_directory;
		} else {
			// Directory globs are guaranteed to be specific even with filenames that
			// don't contain a timestamp, but there are thousands of "free" images not
			// grouped in directories. Even though some of these will be assigned to
			// multiple searches, let's migrate them anyway.
			$glob_files_plain = glob(str_replace(' ', '-', "$path_uploads/2016/02/*-$search_term_initial-*"));

			if (sizeof($glob_files_plain) && sizeof($glob_files_plain) < 50) {
				$files = $glob_files_plain;
			} else {
				$search_term_initial_encoded = strtolower(rawurlencode($search_term_initial));
				$search_term_initial_encoded = str_replace('%20', ' ', $search_term_initial_encoded);
				$search_term_initial_encoded = str_replace('%22', '"', $search_term_initial_encoded);
				$search_term_initial_encoded = str_replace('%27', '\'', $search_term_initial_encoded);
				$glob_files_encoded = glob("$path_uploads/2016/02/*-$search_term_initial_encoded-*");

				if (sizeof($glob_files_encoded) && sizeof($glob_files_encoded) < 50) {
					$files = $glob_files_encoded;
				}
			}
		}

		if (sizeof($files)) {
			$images_all = $files;
		}
	}

	// In the migration to schema 2, there was a block to deal with searches from
	// a 2016 Dec. installation in St. Polten. If images were missing, images
	// saved later for the same search term would be attached instead. What I
	// didn't realize at the time was that no St. Polten searches had ever saved
	// any images at all, and the "nearest neighbor" images were from 2017 Mar. or
	// later. Remove all 738 images from these searches, to reflect reality. =(
	if ($post_meta['search_location'] === 'st_polten') {
		$images_all = [];
	}

	$summary = array(
		'action' => 'insert_images',
		'errors' => [], // Granular error data
		'debug' => [], // Granular test data,
		'quantity' => sizeof($images_all),
	);

	if ($debug) {
		$summary['debug'][] = array(
			'title' => 'Insert images list',
			'data' => $images_all,
		);
	}

	foreach ($images_all as $image) {
		$attachment_file_path = '';
		if (is_array($image) && array_key_exists('attachment_post_id', $image)) {
			// Schema 0, 1 attachments were mistakenly never reattached to search
			// result posts, but the list of attachment IDs lets us get each attachment
			// post individually regardless of schema
			$attachment_id = $image['attachment_post_id'];
			if (is_numeric($attachment_id)) {
				$attachment = get_post($attachment_id);
				$attachment_mime_type = $attachment->post_mime_type;
				$attachment_file_path = get_attached_file($attachment_id);
				// Some images saved an entire data URL to the href field, truncate if so
				$attachment_href = (strpos($image['original_href'], 'data:') === 0) ?
					pg_escape_literal('DATA URL') : pg_escape_literal($image['original_href']);
			} else {
				$summary['errors'][] = array(
					'title' => 'Insert image no numeric attachment ID',
					'data' => $image,
				);
			}
		} else {
			// No reliable way to recover deep data for images without corresponding
			// attachment posts, because of array index mismatches etc., so just give
			// up =(
			$attachment_id = 'NULL';
			$attachment_file_path = $image;
			$attachment_href = 'NULL';
			$attachment_mime_type = 'NULL';
		}

		if ($attachment_file_path) {
			// Standard name format is "{$search_engine}-{$timestamp}-{$rank}.{$extension}"
			// where rank is a zero-padded two-digit number, but sometimes timestamp
			// is instead the search term imploded with a hyphen separator
			$attachment_file_name = basename($attachment_file_path);
			$attachment_file_parts = explode('-', $attachment_file_name);
			$attachment_file_prefix = $attachment_file_parts[0];
			$attachment_file_suffix = end($attachment_file_parts);
			$attachment_file_suffix_parts = explode('.', $attachment_file_suffix);
			$attachment_file_extension = strtolower(end($attachment_file_suffix_parts));
			if ($attachment_mime_type === 'NULL') {
				if ($attachment_file_extension === 'jpeg' || $attachment_file_extension === 'jpg') {
					$attachment_mime_type = 'image/jpeg';
				}
				if ($attachment_file_extension === 'gif') {
					$attachment_mime_type = 'image/gif';
				}
				if ($attachment_file_extension === 'png') {
					$attachment_mime_type = 'image/png';
				}
			}
			$attachment_file_path_short = strstr($attachment_file_path, '/wp-content');

			$data = array(
				'image_id' => 'DEFAULT',
				'search_id' => $search_id,
				'image_search_engine' => pg_escape_literal($attachment_file_prefix),
				'image_href' => $attachment_href,
				'image_rank' => pg_escape_literal($attachment_file_suffix_parts[0]),
				'image_mime_type' => pg_escape_literal($attachment_mime_type),
				'wordpress_attachment_post_id' => $attachment_id,
				'wordpress_attachment_file_path' => pg_escape_literal($attachment_file_path_short),
			);

			if (file_exists($attachment_file_path) && filesize($attachment_file_path)) {
				// Most images are about 20 kB, but some are much larger and overflow memory
				// For example: /wp-content/uploads/2016/02/29/6155/google-1455923877214-03.jpg
				// Cap images at 1 MB and insert an empty file marker for larger images to
				// deal with later, namely `'\'\\x\''`, can query these image rows with:
				// `SELECT image_id FROM images WHERE octet_length(image_data) < 1;`
				$attachment_file_size = filesize($attachment_file_path);

				if ($attachment_file_size < 1024000) {
					$attachment_file_handle = fopen($attachment_file_path, 'r');
					$attachment_file_data = fread($attachment_file_handle, filesize($attachment_file_path));
					$attachment_file_data_escaped = pg_escape_bytea($attachment_file_data);
					$data['image_data'] = "'{$attachment_file_data_escaped}'";
					unset($attachment_file_data_escaped); // Try to expedite garbage collection
					fclose($attachment_file_handle);
				} else {
					$empty = pg_escape_bytea('');
					$data['image_data'] = "'{$empty}'";
				}

				// Implode keys and values to construct PSQL query
				// Minimizes redundancy and potential for mistakes
				// TODO Insert only if not already present
				$imploded_keys = implode(', ', array_keys($data));
				$imploded_values = implode(', ', array_values($data));
				$query_string = "INSERT INTO images ({$imploded_keys}) VALUES ({$imploded_values}) RETURNING image_id;";

				if ($debug) {
					$image_data_length = strlen($data['image_data']);
					unset($data['image_data']);	// Expedite garbage collection for massive string
					$data['image_data'] = "BYTEA LENGTH $image_data_length";
					$summary['debug'][] = array(
						'title' => 'Insert image data payload',
						'data' => $data,
					);
				} else {
					$query_response = pg_query($database, $query_string);
					if (!$query_response) {
						$summary['errors'][] = array(
							'title' => 'Insert image DB bad request',
							'marker' => $attachment_file_path,
							'data' => pg_last_error(),
						);
					}
				}
			} else {
				$summary['errors'][] = array(
					'title' => 'Insert image not found or empty',
					'marker' => $attachment_file_path,
				);
			}
		}
	}

	return $summary;
}

add_action('wp_ajax_migrate_psql', 'migrate_psql');

?>
