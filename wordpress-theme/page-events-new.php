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

?>

<section id="events">
	<div class="migrate-container cleared">
		<div class="migrate-column-2 cleared">
			<h2>Ongoing Events</h2>
			<?php
			foreach ($events['ongoing'] as $event) {
				render_event($event);
			}
			if (!count($events['ongoing'])) {
				echo '<div class="migrate-event">No ongoing events</div>';
			}
			?>
			<h2>Future Events</h2>
			<?php
			foreach ($events['future'] as $event) {
				render_event($event);
			}
			if (!count($events['future'])) {
				echo '<div class="migrate-event">No future events</div>';
			}
			?>
		</div>
		<div class="migrate-column-2 cleared">
			<h2>Past Events</h2>
				<?php
				foreach ($events['past'] as $event) {
					render_event($event);
				}
				if (!count($events['past'])) {
					echo '<div class="migrate-event">No past events</div>';
				}
				?>
		</div>
	</div>
</section>

<?php

get_footer();

?>