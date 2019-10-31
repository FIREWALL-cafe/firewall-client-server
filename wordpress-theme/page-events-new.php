<?php

/*
Template Name: Events New
*/

get_header();
the_post();

$query = new WP_Query(
	array(
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
	$images = array();
	wp_reset_postdata();
}

function render_event($event) {
	// TODO Still investigating how to separate template/data concerns
	$images = get_attached_media('image', $event->ID);
	$image_srcs = '';

	foreach ($images as $image) {
		$image_srcs .= '<img class="migrate-event-photo" src="'.$image->guid.'" />';
	}

	$formatted_content = wp_trim_words(apply_filters('the_content', $event->post_content));
	$trimmed_content = wp_trim_words($formatted_content, 20); // Post description trimmed to 20 words and ellipsized
	$template_link = get_the_permalink($event->ID);

	if (empty($images)) {
		$template_images = '';
	} else {
		$template_images = <<<END
<div class="migrate-event-media">
	$image_srcs
</div>
END;
	}

	if (empty($event->post_excerpt)) {
		$template_excerpt = '';
	} else {
		$template_excerpt = <<<END
<h4 class="migrate-event-excerpt">
	$event->post_excerpt
</h4>
END;
	}

	$template = <<<END
<div class="migrate-event">
	<h3 class="migrate-event-title">
		$event->post_title
	</h3>
	$template_excerpt
	<div class="migrate-event-content">
		$trimmed_content
		<a class="migrate-event-link" href="$template_link">
			More
		</a>
	</div>
	$template_images
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