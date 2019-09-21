<?php

get_header();
global $post;

?>

<section id="library">
    <div class="container">
        <h2>Search Archive</h2>
        <h3 class="migrate-highlight">
            Participant searches from various pop-up exhibitions starting in February 2016 onwards are archived here. <span class="migrate-emphasize-red">CLICK</span> on individual rows to see image results, <span class="migrate-emphasize-red">VOTE</span> on whether you think they are censored, and <span class="migrate-emphasize-red">SEE</span> previous search history.
        </h3>
    </div>
    <div class="migrate-search-archive-flex cleared">
        <div class="migrate-search-archive-controls cleared">
            <p class="migrate-search-archive-pagination">
                <?php
                echo 'Displaying <span id="filtered-count">';
                echo $wp_query->post_count;
                echo '</span> of ';
                echo wp_count_posts()->publish;
                echo ' total searches';
                ?>
            <p>
                <?php
                echo 'See ';
                echo next_posts_link('older');
                if (get_previous_posts_link()) {
                    echo ' or ';
                    echo get_previous_posts_link('newer');
                }
                echo ' searches';
                ?>
            </p>
            <ul>
                <li class="migrate-search-archive-controls-filter-group">
                    <h3>Filter by language</h3>
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
                <li class="migrate-search-archive-controls-filter-group">
                    <h3>Filter by tag</h3>
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
                            data-value="may be censored"
                            >
                            <input type="checkbox" />
                            Possibly censored
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
                            data-value="bad-result"
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
        'tags' => fwc_get_post_tags('archive'),
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
