<?php

get_header();
the_post();

$images = get_attached_media('image', $post->ID);
$excerpt = $post->post_excerpt;

?>

<section>
	<div class="migrate-container cleared">
		<div class="migrate-event-single cleared">
			<h1 class="migrate-event-title"><?php echo $post->post_title; ?></h1>
			<?php if (!empty($excerpt)) { ?>
			<h2 class="migrate-event-excerpt">
				<?php echo($excerpt); ?>
			</h2>
			<?php } ?>
			<div class="migrate-event-content">
				<?php the_content(); ?>
			</div>
			<?php if (!empty($images)) { ?>
			<div class="migrate-event-single-media">
				<?php
				foreach ($images as $image) {
					echo('<div class="migrate-event-single-photo-container">');
					echo('<img class="migrate-event-single-photo" src="'.$image->guid.'" />');
					$image_description = $image->post_content;
					if ($image_description) {
						echo('<div class="migrate-event-single-photo-description">'.$image->post_content.'</div>');
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