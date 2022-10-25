<?php
/*
Template Name: Single Search
Template Post Type: search-result
*/

get_header();
the_post();

$post_id = get_the_ID();
$post = get_post($post_id);
$post_meta = get_post_meta($post_id);
$history = fwc_post_previous_searches_get(
	$post_meta['search_term_initial'],
	$post_meta['timestamp'][0]
);

?>

<section id="library" class="search migrate-search-library">
	<div class="migrate-search-library-close">
		<span class="migrate-search-library-close-legend"><span class="migrate-emphasize-red">CLOSE</span> window when finished</span>
	</div>
	<div class="container">
		<div class="post-voting-controls" id="#votes">
			<h2><span class="migrate-emphasize-red">VOTE</span> by clicking buttons below that match what you think about this search result.</h2>
			<h2><span class="migrate-emphasize-red">SCROLL</span> to see more details and history about this search term.</h2>
			<div class="post-vote-buttons-container">
				<?php fwc_post_vote_buttons($post_id); ?>
			</div>
		</div>
		<div class="migrate-everything-else">
		<h2 style="width: 50%; float: left; margin-bottom: 1.5rem; word-wrap: break-word;">Original search term:<br /> <b><?php echo $post->post_title; ?></b></h2>
		<h2 style="width: 50%; float: right; margin-bottom: 1.5rem; word-wrap: break-word;">Translated search term:<br /> <b><?php echo $post->post_excerpt; ?></b></h2>
		<div class="post-content" id="images-gallery">
			<?
			$galleries = get_post_galleries($post_id, false);
			?>
			<h3>Google:</h3>
			<?php echo fwc_render_gallery($galleries[0]); ?>
			<h3>Baidu:</h3>
			<?php echo fwc_render_gallery($galleries[1]); ?>
		</div>
		<div class="post-details"  style="margin-bottom: 1.5rem;">
			<table style="width: 100%; text-align: left;">
				<tr style="font-weight: bold;">
					<th>User name</th>
					<th>Location</th>
					<th>Time</th>
					<th>Language</th>
					<th>Total searches</th>
				<tr>
				<tr>
					<td><?php echo $post_meta['search_client_name'][0]; ?></td>
					<td><?php echo ucwords(implode(' ', explode('_', $post_meta['search_location'][0]))); ?></td>
					<td><?php echo date('Y-m-d H:i:s', $post_meta['timestamp'][0]); ?></td>
					<td><?php echo $post_meta['search_term_language_initial_name'][0]; ?></td>
					<td><?php echo sizeof($history) ?: 'N/A'; ?></td>
				<tr>
			</table>
		</div>
		<!-- <div class="post-tags" style="margin-bottom: 1.5rem;">
			<h2 class="post-section-title">Search tags:</h2>
			<div class="post-section">
				<?php // echo fwc_get_post_tags('single'); ?>
			<div class="post-section">
		</div> -->
		<?php fwc_post_previous_searches_render($history, $post_meta['timestamp'][0]); ?>
		</div>
	</div>
	</div>
</section>

<script type="text/javascript">
	function closeWindow() {
		window.close();
	}
	// close window after 5 minutes
	// clear the timeout if window is refreshed or closed before timeout ends
	window.onbeforeunload = setTimeout(closeWindow, 5*(60)*(1000));
</script>

<?php

get_footer();

?>
