<?php

// Tool for migrating data from WordPress schema (0, 1, 2) to PSQL schema (3)

// Needs a PSQL database properly set up in the same environment, initialized
// to the schema in `/api/db_resources/config.sql` checked out at the same
// commit hash containing the creation of this file.

// Authenticate to the WordPress dashboard, preferably on a local install
// serving from a copy of the production MySQL database and stored image set,
// and hit:

// /wp-admin/admin-ajax.php?action=migrate_psql&page=1&test=1

// Debug any PSQL connection issues, and ensure the PSQL database is freshly
// initialized.

// Set `test=0` in the URL to actually run the tool, which loads successive
// pages until complete, taking approximately 15 minutes. Manual page
// advancement for error monitoring was much simpler to implement than Ajax
// requests on page that doesn't reload. =\

// WARNING This tool simply appends to the PSQL database. It's designed to be
// run from A to Z on the entire WordPress dataset, writing to a fresh
// database. It won't warn you if run on a nonempty production database.

function migrate_psql() {
	$test = (isset($_GET['test'])) ? (integer) $_GET['test'] : 1;
	$debug = (isset($_GET['debug'])) ? (integer) $_GET['debug'] : 0;
	$page = (isset($_GET['page']) and $_GET['page']) ? (integer) $_GET['page'] : 1;

	// Connect even if test run, otherwise `pg_escape_literal` fails
	// Configure as needed to match local PSQL database in use
	$database = pg_connect('host=localhost dbname=firewallcafe user=firewallcafe password=firewallcafe');
	// $database = pg_connect('host=localhost dbname=dbname user=user password=password');

	remove_all_filters('posts_orderby');
	$quantity = 30; // May need to reduce if memory overflow
	$query = new WP_Query(array(
		'order' => 'ASC',
		'orderby' => 'date',
		'offset' => ($page - 1) * $quantity,
		'posts_per_page' => $quantity,
		'post_type' => 'search-result',
		'post_status' => 'publish',
		'supress_filters' => TRUE,
	));
	$posts = $query->posts;

	migrate_psql_render_header();

	$render_all[] = array(
		'title' => 'Tool summary',
		'type' => 'summary open',
		'data' => array(
			'Test run' => ($test) ? 'Y' : 'N',
			'Debug on' => ($debug) ? 'Y' : 'N',
			'Page number retrieved' => $page,
			'Number of posts retrieved' => sizeof($posts),
			// 'WP SQL query' => $query->request,
		),
	);

	foreach ($posts as $post) {
		$render_search = migrate_psql_insert_search_result($test, $debug, $database, $post);
		$render_all = array_merge($render_all, $render_search);
	}

	migrate_psql_render_data($render_all);
	migrate_psql_render_footer($test, $page, !empty($posts));

	pg_close($database);

	exit;
}

function migrate_psql_insert_search_result($test, $debug, $database, $post) {
	$render = array();

	// Flatten search result post meta
	$post_meta = get_post_meta($post->ID, '');
	$post_meta = array_map(function ($element) {
		return $element[0];
	}, $post_meta);

	if ($debug) {
		$render[] = array(
			'type' => 'info',
			'title' => 'Search result post object',
			'data' => $post,
		);
		$render[] = array(
			'type' => 'info',
			'title' => 'Search result post meta',
			'data' => $post_meta,
		);
	}

	// Construct array with keys corresponding to database field names
	// Start with fields which are always present

	$data = array(
		'search_id' => 'DEFAULT',
		'search_timestamp' => $post_meta['timestamp'] * 1000,
			// Writes to WP were trimmed to 10 digits, future writes to API should use 13-digit precision
		'search_location' => pg_escape_literal($post_meta['search_location']),
		'search_client_name' => pg_escape_literal($post_meta['search_client_name']),
		'search_engine_initial' => pg_escape_literal($post_meta['search_engine_initial']),
		'search_term_initial' => pg_escape_literal($post_meta['search_term_initial']),
		'search_term_translation' => pg_escape_literal($post_meta['search_term_translation']),
		'search_term_status_banned' => $post_meta['search_term_status_banned'] ? 'TRUE' : 'FALSE',
		'search_term_status_sensitive' => $post_meta['search_term_status_sensitive'] ? 'TRUE' : 'FALSE',
		'search_schema_initial' => $post_meta['data_migration_schema_original'],
		'wordpress_search_result_post_id' => $post->ID,
		'wordpress_search_result_post_slug' => pg_escape_literal($post->post_name),
	);

	// Now add more complex fields if available

	// First 3 fields are unset (and default to NULL) for schema 0 posts which
	// never wrote Google Translate language detection data

	// 'search_term_initial_language_code'
	if (isset($post_meta['search_term_language_initial_code'])) {
		$data['search_term_initial_language_code'] = pg_escape_literal($post_meta['search_term_language_initial_code']);
	}

	// 'search_term_initial_language_confidence'
	// Schema 1 posts overwritten with language name and need to be patched
	if (isset($post_meta['search_term_initial_language_confidence']) &&
		is_numeric($post_meta['search_term_language_initial_confidence'])) {
		$data['search_term_initial_language_confidence'] = $post_meta['search_term_language_initial_confidence'];
	}

	// 'search_term_initial_language_alternate_code'
	// Empty string if detection data written but no alternate provided
	if (isset($post_meta['search_term_language_initial_alternate'])) {
		$data['search_term_initial_language_alternate_code'] = pg_escape_literal($post_meta['search_term_language_initial_alternate']);
	}

	// 'search_engine_translation'
	// Neever written for both schema 0 and 1 posts
	if (isset($post_meta['search_engine_initial'])) {
		if ($post_meta['search_engine_initial'] === 'google') {
			$data['search_engine_translation'] = '\'baidu\'';
		}
		if ($post_meta['search_engine_initial'] === 'baidu') {
			$data['search_engine_translation'] = '\'google\'';
		}
	}

	// 'search_term_translation_language_code'
	if (isset($post_meta['search_term_language_initial_code'])) {
		$code = $post_meta['search_term_language_initial_code'];
		if ($code === 'zh-CN' || $code === 'zh-TW') {
			$data['search_term_translation_language_code'] = '\'en\'';
		} else {
			$data['search_term_translation_language_code'] = '\'zh-CN\'';
		}
	}

	// 'wordpress_search_term_popularity'
	// Only written for schema 0 posts
	if (isset($post_meta['search_term_popularity'])) {
		$data['wordpress_search_term_popularity'] = $post_meta['search_term_popularity'];
	}
	
	// 'wordpress_copyright_takedown'
	// In very few cases field is a serialized string
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

	// 'wordpress_unflattened'
	// Only written for schema 1 posts containing multiple timestamps
	if (isset($post_meta['data_migration_unflattened'])) {
		$data['wordpress_unflattened'] = ($post_meta['data_migration_unflattened']) ? 'TRUE' : 'FALSE';
	}

	// 'wordpress_nearest_neighbor_images'
	// Some schema 0 posts from St. Polten had images with diff timestamps, only most recent were taken
	if (isset($post_meta['data_migration_nearest_neighbor_images'])) {
		$data['wordpress_nearest_neighbor_images'] = ($post_meta['data_migration_nearest_neighbor_images']) ? 'TRUE' : 'FALSE';
	}

	// 'wordpress_regular_post_id'
	// Schema 0 and 1 posts were migrated from regular post type to custom search result post type
	if (isset($post_meta['data_migration_post_id_original'])) {
		$data['wordpress_regular_post_id'] = $post_meta['data_migration_post_id_original'];
	}

	// Implode keys and values to construct PSQL query
	// Minimizes redundancy and potential for mistakes
	// TODO Insert only if not already present
	$imploded_keys = implode(",\n\t", array_keys($data));
	$imploded_values = implode(",\n\t", array_values($data));
	$query_string = "INSERT INTO searches (\n\t{$imploded_keys}\n) VALUES (\n\t{$imploded_values}\n) RETURNING search_id;";

	$render_type = 'success';

	if (!$test) {
		$query_request = pg_query($database, $query_string);
		if ($query_request) {
			$query_response = pg_fetch_object($query_request);
			if (isset($query_response->search_id)) {
				$search_id = $query_response->search_id;
			} else {
				$render_type = 'error';
				$search_id = 'DB BAD RESPONSE';
				$data['error'] = pg_last_error();
			}
		} else {
			$render_type = 'error';
			$search_id = 'DB BAD REQUEST';
		}
	} else {
		$search_id = 'TEST';
	}

	$render[] = array(
		'type' => $render_type,
		'title' => "Migrate search from WP ID {$post->ID} to new ID {$search_id}",
		'data' => $data
	);

	if ($search_id) {
		$render_votes = migrate_psql_insert_votes($test, $database, $search_id, $post_meta);
		$render_images = migrate_psql_insert_images($test, $database, $search_id, $post->ID, $post_meta);
	}

	return array_merge($render, $render_images, $render_votes);
}

function migrate_psql_insert_votes($test, $database, $search_id, $post_meta) {
	$render = array();
	$render_type = 'success';

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

	$data = array(
		'query_string' => 'EMPTY',
	);
	$vote_count = sizeof($votes_all);

	if ($vote_count) {
		$imploded_votes = implode(",\n\t", $votes_all);
		$query_string = "INSERT INTO have_votes\n\t(vote_id, search_id)\nVALUES \n\t{$imploded_votes};";
		// vote_timestamp, vote_client_name, vote_ip_address all NULL for migrated votes

		if (!$test) {
			$query_request = pg_query($database, $query_string);
			if (!$query_request) {
				$render_type = 'error';
				$data['error'] = pg_last_error();
			}
		}
	} else {
		$query_string = 'NO VOTES TO INSERT';
	}

	$data['query_string'] = $query_string;
	$render[] = array(
		'type' => $render_type,
		'title' => "Migrate votes to search ID {$search_id} quantity {$vote_count}",
		'data' => $data,
	);

	return $render;
}

function migrate_psql_insert_images($test, $database, $search_id, $post_id, $post_meta) {
	$render = array();

	// Collate lists of images, which only contain original URL and attachment post ID
	$images_google = unserialize($post_meta['images_google']);
	$images_baidu = unserialize($post_meta['images_baidu']);
	$images_all = array_merge($images_google, $images_baidu);

	foreach ($images_all as $image) {
		$render_type = 'success';
		$attachment_id = $image['attachment_post_id'];

		if (is_numeric($attachment_id)) {
			// Schema 1 and 0 attachments were never reattached to search result posts,
			// so get each attachment post individually
			$attachment = get_post($attachment_id);

			// Attachment slug format is "{$search_engine}-{$timestamp}-{$rank}"
			$attachment_slug = explode('-', $attachment->post_name);

			$data = array(
				'image_id' => 'DEFAULT',
				'search_id' => isset($search_id) ? $search_id : 'TEST',
				'image_search_engine' => "'{$attachment_slug[0]}'",
				'image_href' => pg_escape_literal($image['original_href']),
				'image_rank' => "'{$attachment_slug[2]}'",
				'image_mime_type' => "'{$attachment->post_mime_type}'",
				'image_wordpress_attachment_post_id' => $image['attachment_post_id'],
				'image_wordpress_attachment_post_guid' => "'{$attachment->guid}'",
			);

			$attachment_file_path = get_attached_file($attachment_id);
			if (file_exists($attachment_file_path)) {
				$attachment_file_handle = fopen($attachment_file_path, 'r');
				$attachment_file_data = fread($attachment_file_handle, filesize($attachment_file_path));
				$attachment_file_data_escaped = pg_escape_bytea($attachment_file_data);
				$data['image_data'] = "'{$attachment_file_data_escaped}'";
				unset($attachment_file_data_escaped); // Try to expedite garbage collection
				fclose($attachment_file_handle);
			} else {
				$data['image_data'] = 'NULL';
				$render_type = 'error';
			}

			// Implode keys and values to construct PSQL query
			// Minimizes redundancy and potential for mistakes
			// TODO Insert only if not already present
			$imploded_keys = implode(",\n\t", array_keys($data));
			$imploded_values = implode(",\n\t", array_values($data));
			$query_string = "INSERT INTO images (\n\t{$imploded_keys}\n) VALUES (\n\t{$imploded_values}\n) RETURNING image_id;";

			if (!$test) {
				$query_response = pg_query($database, $query_string);
				if (!$query_response) {
					$render_type = 'error';
					$data['error'] = pg_last_error();
				}
			}
		} else {
			$render_type = 'error';
			$data['error'] = 'Attachment not found';
		}

		// Try to expedite garbage collection for this massive string
		unset($data['image_data']);
		$data['image_data'] = 'TRUNCATED';

		$render_type .= ' image';
		$render[] = array(
			'type' => $render_type,
			'title' => "Migrate image from WP ID {$attachment_id} to search ID {$search_id}",
			'data' => $data,
		);
	}

	return $render;
}

function migrate_psql_render_header() {
	$template = <<<END
<html>
<head>
	<title>Migrate WordPress to PSQL</title>
	<style>
		body {
			font-size: 0.9rem;
			line-height: 1.25;
			margin: 1rem;
			font-family: sans-serif;
			color: rgba(0, 0, 0, 0.7);
		}

		.block {
			padding: 1rem;
			margin: 0 0 1rem;
			position: relative;
			overflow: hidden;
			height: 1rem;
			clear: both;
		}

		.block.open {
			overflow: visible;
			height: auto;
		}

		.block.image {
			width: 30rem;
			float: left;
			margin-right: 1rem;
			clear: none;
		}

		.toggle {
			position: absolute;
			top: 1rem;
			right: 1rem;
			line-height: 1;
			cursor: pointer;
		}

		.title {
			margin-top: 0;
			margin-bottom: 1rem;
			font-size: 1rem;
			line-height: 1rem;
			font-weight: bold;
		}

		.block.open .title {
			margin-bottom: 0.25rem;
		}

		.data {
			white-space: pre;
			font-family: 'Consolas', monospace;
			color: rgba(0, 0, 0, 0.9);
		}

		button {
			width: 100%;
			margin-right: 1rem;
			display: inline-block;
			text-align: center;
			text-transform: uppercase;
			line-height: 3rem;
			font-size: 2rem;
			font-weight: bold;
			background-color: #ddaacc;
			margin-bottom: 1rem;
			border: 0;
			cursor: pointer;
		}

		button[disabled] {
			opacity: 0.4;
			cursor: not-allowed;
		}

		.error {
			background-color: #ffccbb;
		}

		.success {
			background-color: #ccffbb;
		}

		.info {
			background-color: #cceeff;
		}

		.summary {
			background-color: #ffeecc;
		}

		.default {
			background-color: #eeeeee;
		}
	</style>
</head>
<body style="margin: 1rem;">
	<button id="continue" disabled>Next page</button>
END;

	echo $template;
}

function migrate_psql_render_footer($test, $page, $remaining) {
	$page++;
	$template = <<<END
	<script type='text/javascript'>
		if ($remaining) {
			function next() {
				window.location = '/wp-admin/admin-ajax.php?action=migrate_psql&page={$page}&test={$test}';
				document.removeChild(document.documentElement);
			}

			document.addEventListener('DOMContentLoaded', function () {
				// If test run and posts remaining, activate next page button
				var button = document.getElementById('continue');
				button.addEventListener('click', function () {
					button.setAttribute('disabled', '');
					next();
				});
				button.removeAttribute('disabled');

				document.querySelectorAll('.toggle').forEach(function (element) {
					element.addEventListener('click', function (event) {
						event.target.parentNode.classList.toggle('open');
					});
				});
			});
		}
	</script>
</body>
</html>
END;

	echo $template;
}

function migrate_psql_render_data($data) {
	// Get a list of errors, while decorating blocks with ID for links
	$errors = array_reduce(
		array_keys($data),
		function ($carry, $key) use (&$data) {
			$id = (string) bin2hex(random_bytes(8));
			$data[$key]['id'] = $id;
			if (isset($data[$key]['type']) && $data[$key]['type'] === 'error') {
				$carry[] = $id;
			}
			return $carry;
		},
		array()
	);
	$error_count = (string) sizeof($errors);
	$error_links = array_reduce(
		array_keys($errors),
		function ($carry, $item) use ($errors) {
			$link = "<a href=\"#{$errors[$item]}\">Error $item</a>\t";
			return $carry . $link;
		},
		''
	);

	array_unshift($data, array(
		'type' => 'info open',
		'title' => "$error_count total page errors",
		'data' => $error_links,
		'id' => 0,
	));

	foreach ($data as $item) {
		$title_text = (isset($item['title'])) ? $item['title'] : '[title empty]';
		$data_text = (isset($item['data'])) ? var_export($item['data'], TRUE) : '[data empty]';

		$template = <<<END
<div class="block {$item['type']}" id="{$item['id']}">
	<div class="toggle">Toggle</div>
	<h2 class="title">{$title_text}</h2>
	<div class="data">{$data_text}</div>
</div>
END;

		echo $template;
	}
}

add_action('wp_ajax_migrate_psql', 'migrate_psql');

?>
