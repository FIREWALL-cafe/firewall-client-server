<?php

get_header();
the_post();

?>
<section id="library" class="search">
	<div class="container">
      // TODO: Consider editing this to reflect individual info about search.
		<h2>Search Library</h2>
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
