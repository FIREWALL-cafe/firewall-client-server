<?php
get_header();
$first = true;
global $post;
?>

<section id="library">
	<div class="container">
		<h2>Search Library</h2>
		<div class="columns">
			<h3c class="tag-navigation-opener">Search Categories ></h3>
			<div class="tag-navigation-container">
				<?php fwc_library_nav_tags(); ?>
			</div>
			<div class="content">
				<?php while ( have_posts() ) { the_post(); ?>
					<section id="search-<?php echo esc_attr($post->post_name); ?>" class="search">
						<?php
						$link = get_the_permalink();
						$prefix = "<h2 class=\"post-title\"><a href=\"$link\">";
						the_title($prefix, '</a></h2>');
						?>
						<div class="post-content">
							<?php the_content(); ?>
						</div>
						<div class="post-meta">
							<?php fwc_post_meta(); ?>
						</div>
					</section>
				<?php } ?>
				<section id="pagination">
					<div class="container">
						<div class="nav-previous"><?php next_posts_link( 'Older posts' ); ?></div>
						<div class="nav-next"><?php previous_posts_link( 'Newer posts' ); ?></div>
					</div>
				</section>
			</div>
		</div>
	</div>
</section>
<?php

get_footer();
