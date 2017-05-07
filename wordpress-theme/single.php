<?php

get_header();
the_post();

?>
<section id="library" class="search">
	<div class="container">
		<?php the_title( '<h2>', '</h2>' ); ?>
		<div class="post-content">
			<?php the_content(); ?>
		</div>
		<div class="post-meta">
			<?php fwc_post_meta(); ?>
		</div>
	</div>
</section>
<?php

get_footer();
