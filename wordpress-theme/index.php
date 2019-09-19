<?php

get_header();
global $post;

?>

<section id="library">
    <div class="container">
        <h2>Search Archive</h2>
        <p>
            <?php
            echo 'Displaying <span id="filtered-count">';
            echo $wp_query->post_count;
            echo '</span> of ';
            echo wp_count_posts()->publish;
            echo ' archived searches, see ';
            echo next_posts_link('older');
            if (get_previous_posts_link()) {
                echo ' or ';
                echo get_previous_posts_link('newer');
            }
            echo ' searches';
            ?>
        </p>
    </div>
    <div class="migrate-search-archive-flex cleared">
        <div class="migrate-search-archive-controls cleared">
            <h3>Filters</h3>
            <ul>
                <li>
                    Source Language
                    <ul>
                        <li
                            class="control filter"
                            data-key="language"
                            data-value="Chinese"
                            >
                            <input type="checkbox" />
                            Chinese
                        </li>
                        <li
                            class="control filter"
                            data-key="language"
                            data-value="English"
                            >
                            <input type="checkbox" />
                            English
                        </li>
                    </ul>
                </li>
                <li>Tags
                    <ul>
                        <li
                            class="control filter"
                            data-key="tags"
                            data-value="Censored"
                            >
                            <input type="checkbox" />
                            Censored
                        </li>
                        <li
                            class="control filter"
                            data-key="tags"
                            data-value="Uncensored"
                            >
                            <input type="checkbox" />
                            Uncensored
                        </li>
                        <li
                            class="control filter"
                            data-key="tags"
                            data-value="Bad Translation"
                            >
                            <input type="checkbox" />
                            Bad Translation
                        </li>
                        <li
                            class="control filter"
                            data-key="tags"
                            data-value="Good Translation"
                            >
                            <input type="checkbox" />
                            Good Translation
                        </li>
                        <li
                            class="control filter"
                            data-key="tags"
                            data-value="Lost In Translation"
                            >
                            <input type="checkbox" />
                            Lost In Translation
                        </li>
                        <li
                            class="control filter"
                            data-key="tags"
                            data-value="NSFW"
                            >
                            <input type="checkbox" />
                            NSFW
                        </li>
                        <li
                            class="control filter"
                            data-key="tags"
                            data-value="Bad Result"
                            >
                            <input type="checkbox" />
                            Bad Result
                        </li>
                    </li>
                </li>
            </ul>
        </div>
        <div class="migrate-search-archive-results cleared">
            <table class="migrate-search-archive-results-table" id="migrate-search-archive-results-table">
                <thead>
                    <tr>
                        <th class="tiny"></th>
                        <th>Original</th>
                        <th>Translation</th>
                        <th>Date</th>
                    </tr>
                </thead>
            </table>
        </div>
    </div>
</section>
<?php

/*
Inject posts data into a JSON array then parsed by fwc.js and used to render
the table of search results
*/

$json = array();
$index = 0;

while (have_posts()) {
    the_post();

    if (get_post_meta($post->ID, 'new_template_style')) {
      $translation_data = get_post_meta($post->ID, 'translation');
      $translation = array_values($translation_data[0])[0];
    } else {
        $translation = 'translation unavailable';
    }

    $language_data = get_the_terms($post->ID, 'search_language');
    if (gettype($language_data) == 'array') {
        $language = $language_data[0]->name;
    } else {
        $language = 'English';
    }

    $location_data = get_the_terms($post->ID, 'locations');
    if (gettype($location_data) == 'array') {
      $location = $location_data[0]->name;
    } else {
      $location = 'location unavailable';
    }

    $json[$index] = array(
        'index' => $index,
        'title' => $post->post_title,
        'translation' => $translation,
        'language' => $language,
        'location' => $location,
        'tags' => fwc_get_post_tags(),
        'timestamp' => $post->post_modified,
        'date' => fwc_format_date_new(fwc_get_latest_meta('timestamp')),
        'permalink' => get_the_permalink(),
        'galleries' => get_post_galleries($post->ID, true),
    );

    $index++;
}
?>
<script id="json" type="application/json">
    <?php echo json_encode($json); ?>
</script>

<?php

get_footer();

?>