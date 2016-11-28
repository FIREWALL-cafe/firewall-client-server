<?php

get_header();
the_post();

?>
<section id="home">
	<div class="container">
		<div class="columns">
			<div class="content">
				
				<?php the_content(); ?>
				
			</div>
		</div>
		<?php edit_post_link('Edit'); ?>
	</div>
</section>
<?php

get_footer();
