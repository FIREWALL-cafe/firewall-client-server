<?php
/*
Template Name: Home
*/

get_header();
the_post();

?>

<section id="home">
	<div class="container">
		<div class="content">
			<?php the_content(); ?>
		</div>
	</div>
</section>

<?php

get_footer();

?>