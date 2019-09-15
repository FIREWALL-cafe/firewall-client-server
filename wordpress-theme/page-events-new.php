<?php

/*
Template Name: Events New
*/

get_header();
the_post();

$query = new WP_Query(array('post_type' => 'event'));
$events = array(
	'ongoing' => array(),
	'future' => array(),
	'past' => array(),
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

	$formatted_content = apply_filters('the_content', $event->post_content);
	$template_link = get_the_permalink($event->ID);
	$template_images = <<<END
<div class="migrate-event-media">
	$image_srcs
</div>
END;

	if (!count($images)) {
		$template_images = '';
		$template_link_text = 'View individual event page &rarr;';
	} else {
		$template_link_text = 'View individual event and media page &rarr;';
	}

	$template = <<<END
<div class="migrate-event">
	<h3 class="migrate-event-title">
		$event->post_title
	</h3>
	<div class="migrate-event-content">
		$formatted_content
	</div>
	$template_images
	<div class="cleared">
	<a class="migrate-event-link" href="$template_link">
		$template_link_text
	</a>
	</div>
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