<?php

get_header();
the_post();

$field_media_gallery = get_field('media-gallery');
$field_date_and_time = get_field('date-and-time');

?>

<section>
	<div class="migrate-container cleared">
		<div class="migrate-event-single cleared">
			<h1 class="migrate-event-title"><?php echo $post->post_title; ?></h1>
			<?php if (!empty($field_date_and_time)) { ?>
			<h2 class="migrate-event-excerpt">
				<?php echo($field_date_and_time); ?>
			</h2>
			<?php } ?>
			<div class="migrate-event-content">
				<?php the_content(); ?>
			</div>
			<?php if (!empty($field_media_gallery)) { ?>
			<div class="migrate-event-single-media">
				<?php
				foreach ($field_media_gallery as $key => $value) {
					$image_url = $value['url'];
					$image_caption = $value['caption'];

					echo('<div class="migrate-event-single-photo-container">');
					echo('<img id="image-'.$key.'" class="migrate-event-single-photo" src="'.$image_url.'" />');
					if (!empty($image_caption)) {
						echo('<div class="migrate-event-single-photo-description">'.$image_caption.'</div>');
					}
					echo('</div>');
				}
				?>
			</div>
			<?php } ?>
		</div>
	</div>
</section>

<?php

get_footer();

?>