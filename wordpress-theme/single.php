<?php

get_header();
the_post();

$post_id = get_the_ID();
$post = get_post($post_id);

$new_template_style = get_post_meta($post_id, 'new_template_style');

if ($new_template_style) {
	$translation_data = get_post_meta($post_id, 'translation');
	$translation = array_values($translation_data[0])[0];
}

?>
<section id="library" class="search">
	<div class="container">
		<div class="post-voting-controls">
			<h2><span class="migrate-emphasize-red">VOTE</span> by clicking buttons below that match what you think about these search results. <span class="migrate-emphasize-red">SCROLL</span> to see more details and history about these search results.</h2></h2>
			<div class="post-vote-buttons-container">
				<?php fwc_post_vote_buttons($post_id); ?>
			</div>
		</div>
		<?php
		if ($new_template_style) {
			the_title('<h2 class="post-title">Search Term: <span>', "</span> / Translation: <span>$translation</span></h2>");
		} else {
			the_title('<h2 class="post-title">', '</h2>');
		}
		?>
		<div class="post-content" id="images">
			<?php the_content(); ?>
		</div>
		<?php if ($new_template_style) {
			fwc_get_reverse_search($translation);
		} ?>
		<div class="post-tags">
			<h2 class="post-section-title">Search Tags</h2>
			<?php echo fwc_get_post_tags(); ?>
		</div>
		<?php if ($new_template_style) { ?>
		<?php fwc_get_reverse_search($translation); ?>
		<div class="post-details">
			<h2 class="post-section-title">Search Details</h2>
			<div class="post-section">
				<?php fwc_post_search_details(); ?>
			</div>
			<div class="post-section">
				<h3>Search Language</h3>
				<?php fwc_post_search_language(); ?>
			</div>
			<div class="post-section">
				<h3>Search Engine</h3>
				<?php fwc_post_search_engine(); ?>
			</div>
			<div class="post-section">
				<h3>Search History</h3>
				<?php fwc_post_search_history(); ?>
			</div>
		</div>
		<?php } else { ?>
		<div class="post-meta">
			<?php fwc_post_meta(); ?>
		</div>
		<?php } ?>
		<?php if ($new_template_style && fwc_get_search_count() > 1) { ?>
		<h2 class="post-section-title">Previous Searches</h2>
		<div class="post-histories-container post-section">
			<?php fwc_post_previous_searches(); ?>
		</div>
		<?php } ?>
	</div>
</section>

<?php

get_footer();

?>