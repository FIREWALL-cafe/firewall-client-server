<?php

/*
Template Name: Events New
*/

get_header();

$query = new WP_Query(
	array(
		'order' => 'ASC',
		'orderby' => 'menu_order',
		'post_type' => 'event',
		'posts_per_page' => -1,
	)
);
$events = array(
	'upcoming' => array(),
	'past-events' => array(),
	'past-exhibitions' => array(),
);

while ($query->have_posts()) {
	$query->the_post();
	$event_categories = get_the_terms($post->ID, 'event-category');
	foreach ($event_categories as $event_category) {
		$events[$event_category->slug][] = $post;
	}
	wp_reset_postdata();
}

function render_event($event) {
	// Post description trimmed to 20 words and ellipsized
	$formatted_content = wp_trim_words(apply_filters('the_content', $event->post_content));
	$trimmed_content = wp_trim_words($formatted_content, 20);
	$template_link = get_the_permalink($event->ID);

	$field_date_and_time = get_field('date-and-time', $event->ID);
	$template_date_and_time = '';
	if (!empty($field_date_and_time)) {
		$template_date_and_time = <<<END
<h4 class="migrate-event-excerpt">
	$field_date_and_time
</h4>
END;
	}

	$field_media_gallery = get_field('media-gallery', $event->ID);
	$template_media_gallery = '';
	if (!empty($field_media_gallery)) {
		$images_markup = '';
		foreach ($field_media_gallery as $image) {
			$image_src = $image['sizes']['medium'];
			$images_markup .= '<img class="migrate-event-photo" src="'.$image_src.'" />';
		}

		$template_media_gallery = <<<END
<div class="migrate-event-media">
	$images_markup
</div>
END;
	}

	$template = <<<END
<div class="migrate-event">
	<h3 class="migrate-event-title">
		$event->post_title
	</h3>
	$template_date_and_time
	<div class="migrate-event-content">
		$trimmed_content
		<a class="migrate-event-link" href="$template_link">
			More
		</a>
	</div>
	$template_media_gallery
</div>
END;

	echo $template;
}

function render_empty() {
	echo '<div class="migrate-event">None found</div>';
}

?>

<section id="events">
	<div class="migrate-container cleared">
		<div class="migrate-column-1 cleared">
			<h2>Upcoming Events</h2>
			<?php
			foreach ($events['upcoming'] as $event) {
				render_event($event);
			}
			if (!count($events['upcoming'])) {
				render_empty();
			}
			?>
		</div>
	</div>
	<div class="migrate-container cleared">
		<div class="migrate-column-2 cleared">
			<h2>Past Events</h2>
			<?php
			foreach ($events['past-events'] as $event) {
				render_event($event);
			}
			if (!count($events['past-events'])) {
				render_empty();
			}
			?>
		</div>
		<div class="migrate-column-2 cleared">
			<h2>Past Exhibitions</h2>
			<?php
			foreach ($events['past-exhibitions'] as $event) {
				render_event($event);
			}
			if (!count($events['past-exhibitions'])) {
				render_empty();
			}
			?>
		</div>
	</div>
</section>

<?php

get_footer();

?>