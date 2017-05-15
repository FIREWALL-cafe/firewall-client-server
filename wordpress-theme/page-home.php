<?php
/*
Template Name: Library
*/

get_header();
the_post();

?>
<section id="home">
	<div class="container">
		<div class="columns">
			<div class="sidebar">
				<?php the_field( 'sidebar_content' ); ?>
			</div>
			<div class="content content--wide">
				<?php the_content(); ?>
				<?php

				while (have_rows( 'images' )) {
					the_row();
					$img = get_sub_field( 'image' );
					echo "<img src=\"{$img['sizes']['large']}\" alt=\"\">";
				}

				?>
			</div>
		</div>
		<?php edit_post_link('Edit'); ?>
	</div>
</section>
<?php

get_footer();
