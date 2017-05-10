<?php
/*
Template Name: Exhibition
*/

get_header();
the_post();

?>
<section id="home">
	<div class="container">
		<h2><?php the_title(); ?></h2>
			<div class="columns">
				<div class="sidebar">
					<?php the_content(); ?>
			</div>
			<div class="content content--wide">
				<?php
				
				while (have_rows( 'images' )) {
					the_row();
					$img = get_sub_field( 'image' );
					echo "<img src=\"{$img['sizes']['large']}\" alt=\"\">";
					$caption = get_sub_field( 'caption' );
					echo "hello $caption";
				}
				
				?>
			</div>
		</div>
		<?php edit_post_link('Edit'); ?>
	</div>
</section>
<?php

get_footer();
