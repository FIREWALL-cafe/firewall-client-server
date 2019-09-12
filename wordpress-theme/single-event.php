<?php

get_header();
the_post();

$images = get_attached_media('image', $post->ID);
$image_srcs = '';

foreach ($images as $image) {
	$image_srcs .= '<img class="migrate-event-photo" src="'.$image->guid.'" />';
}

$template_images = <<<END
<h3>Event Photos</h3>
<div class="migrate-event-single-media">
	$image_srcs
</div>
END;

if (!count($images)) {
	$template_images = '';
}

?>

<section id="library" class="search">
	<div class="migrate-container">
		<div class="migrate-event-single cleared">
			<h1 class="migrate-event-title"><?php echo $post->post_title; ?></h1>
			<div class="migrate-event-content">
				<?php the_content(); ?>
			</div>
			<?php echo $template_images; ?>
			<div class="cleared">
			</div>
		</div>
	</div>
</section>

<?php

get_footer();

?>