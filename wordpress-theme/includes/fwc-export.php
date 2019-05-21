<?php

function fwc_export($args) {

    if (count($args) == 0) {
        echo "Usage: wp fwc-export [path/to/export]\n";
        exit;
    }

    global $post;
    set_time_limit(0);

    if (substr($args[0], -1, 1) == '/') {
        // Strip trailing slash
        $args[0] = substr($args[0], 0, -1);
    }

    $export_root = $args[0];
    $csv_path = "$export_root/fwc-export.csv";
    $csv = fopen($csv_path, 'w');

    if (! $csv) {
        echo "Error: could not open $csv_path";
        exit;
    }

    $header = array(
        'id',
        'timestamp',
        'date_time',
        'client',
        'location',
        'search_query',
        'search_count',
        'search_engine',
        'search_language',
        'censorship_status',
        'bad_result',
        'banned',
        'lost_in_translation',
        'nsfw',
        'sensitive'
    );
    fputcsv($csv, $header);

    $count = 0;
    $page = 1;
    $done = false;

    while (! $done) {

        $query = new WP_Query(array(
            'posts_per_page' => 250,
            'paged' => $page
        ));

        while ($query->have_posts()) {
            $query->the_post();

            $post_id = get_the_ID();
            $post_slug = rawurldecode($post->post_name);
            $search_query = get_the_title();
            $search_count = fwc_get_search_count();

            $censorship_status = 'unknown';
            $censorship_status_terms = get_the_terms($post_id, 'censorship_status');
            if (is_array($censorship_status_terms) && count($censorship_status_terms) > 0) {
                $term = $censorship_status_terms[0];
                $censorship_status = $term->name;
            }

            $bad_result = has_term('bad-result', 'post_tag', $post_id) ? '1' : '0';
            $banned = has_term('banned', 'post_tag', $post_id) ? '1' : '0';
            $lost_in_translation = has_term('lost-in-translation', 'post_tag', $post_id) ? '1' : '0';
            $nsfw = has_term('nsfw', 'post_tag', $post_id) ? '1' : '0';
            $sensitive = has_term('sensitive', 'post_tag', $post_id) ? '1' : '0';

            $timestamps = get_post_meta($post_id, 'timestamp');
            foreach ($timestamps as $timestamp) {

                $date_time = date('Y-m-d H:i:s', $timestamp);
                $client = fwc_get_meta_by_timestamp('client', $timestamp);
                $location = fwc_get_meta_by_timestamp('location', $timestamp);
                $search_engine = fwc_get_meta_by_timestamp('search_engine', $timestamp);
                $search_language = fwc_get_meta_by_timestamp('search_language_name', $timestamp);

                $row = array(
                    $post_id,
                    $timestamp,
                    $date_time,
                    $client,
                    $location,
                    $search_query,
                    $search_count,
                    $search_engine,
                    $search_language,
                    $censorship_status,
                    $bad_result,
                    $banned,
                    $lost_in_translation,
                    $nsfw,
                    $sensitive
                );
                fputcsv($csv, $row);
            }

            $img_dir = "$export_root/images/{$post_id}-{$post_slug}";
            if (! file_exists($img_dir)) {
                mkdir($img_dir, 0755, true);
            }

            $attachments = get_posts(array(
               'post_type' => 'attachment',
               'numberposts' => -1,
               'post_status' => null,
               'post_parent' => $post_id,
            ));

            foreach ($attachments as $att) {
                $path = get_attached_file($att->ID);
                $filename = basename($path);
                $export_path = "$img_dir/$filename";
                if (! file_exists($export_path)) {
                    copy($path, $export_path);
                }
            }
            $count++;
        }

        $total = $query->found_posts;
        echo "$count/$total rows\n";
        $page++;
        $done = ($page > $query->max_num_pages);
    }

    fclose($csv);
    exit;
}

if (defined('WP_CLI') && WP_CLI) {
    WP_CLI::add_command('fwc-export', 'fwc_export', array(
        'shortdesc' => 'Exports archived search queries to a CSV file and image directories'
    ));
}
