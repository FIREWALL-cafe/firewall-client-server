<?php

get_header();
$first = true;
global $post;

while ( have_posts() ) {

	the_post();

	?>
	<section id="search-<?php echo esc_attr($post->post_name); ?>" class="search">
		<div class="container">
			<?php
			if ($first) {
				$first = false;
				?>
				<h2>Search Library</h2>
				<div class="library-nav">
					<h3>View searches by category:</h3>
					<div class="library-nav-tags-container">
						<?php fwc_library_nav_tags(); ?>
					</div>
				</div>
				<?php
			}
			?>
			<div class="post-content">
				<?php the_content(); ?>
			</div>
			<div class="post-meta">
				<?php fwc_post_meta(); ?>
			</div>
		</div>
	</section>
<?php

}

?>
<section id="pagination">
	<div class="container">
		<div class="nav-previous"><?php next_posts_link( 'Older posts' ); ?></div>
		<div class="nav-next"><?php previous_posts_link( 'Newer posts' ); ?></div>
	</div>
</section>
<?php

get_footer();
