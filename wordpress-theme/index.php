<?php

get_header();

// Get tag id and name values, used in JS to make filtered queries to the API
global $tags_by_slug;
$tags = get_terms(
	'post_tag',
	array(
		'hide_empty' => false,
	)
);
$tags_by_slug = [];
foreach ($tags as $tag) {
	$tags_by_slug[$tag->slug] = array(
		'tag_id' => $tag->term_id,
		'tag_name' => $tag->name,
	);
}

$render_filter_control = function ($tag_slug) use ($tags_by_slug) {
	if (array_key_exists($tag_slug, $tags_by_slug)) {
		$tag = $tags_by_slug[$tag_slug];
	} else {
		$tag = array(
			'tag_id' => 0,
			'tag_name' => 'N/A',
		);
	}
	$tag_id = $tag['tag_id'];
	$tag_name = $tag['tag_name'];

	echo <<<END
<li class="migrate-search-archive-control migrate-search-archive-filter">
	<label>
		<input
			type="checkbox"
			autocomplete="off"
			class="migrate-search-archive-control-filter-input"
			data-id="$tag_id"
			data-slug="$tag_slug"
			/>
		$tag_name
	</label>
</li>
END;
};

?>

<section id="library">
	<h2>Search Archive</h2>
	<h3 class="migrate-highlight">
		Participant searches from various pop-up exhibitions starting in February 2016 onwards are archived here. <span class="migrate-emphasize-red">CLICK</span> on individual rows to see image results, <span class="migrate-emphasize-red">VOTE</span> on whether you think they are censored, and <span class="migrate-emphasize-red">SEE</span> previous search history.
	</h3>
	<div class="migrate-search-archive-flex cleared">
		<div class="migrate-search-archive-controls cleared">
			<ul>
				<li class="migrate-search-archive-controls-filter-group">
					<h3>Filter by keyword</h3>
					<form id="keywordSearch" action="#">
						<input
							type="text"
							id="keywordInput"
							placeholder="Keyword"
							autocomplete="off"
							disabled
							/>
						<input
							type="submit"
							id="keywordButton"
							value="Submit"
							autocomplete="off"
							disabled
							/>
					</form>
				</li>
				<li class="migrate-search-archive-controls-filter-group">
					<h3>Filter by location</h3>
					<ul>
						<?php $render_filter_control('has_search_location_miami_beach'); ?>
						<?php $render_filter_control('has_search_location_new_york_city'); ?>
						<?php $render_filter_control('has_search_location_oslo'); ?>
						<?php $render_filter_control('has_search_location_st_polten'); ?>
						<?php $render_filter_control('has_search_location_hong_kong'); ?>
						<?php $render_filter_control('has_search_location_ann_arbor'); ?>
						<?php $render_filter_control('has_search_location_vienna'); ?>
						<?php $render_filter_control('has_search_location_asheville'); ?>
						<?php $render_filter_control('has_search_location_poughkeepsie'); ?>
					</ul>
				</li>
				<li class="migrate-search-archive-controls-filter-group">
					<h3>Filter by user votes</h3>
					<ul>
						<?php $render_filter_control('has_votes_censored'); ?>
						<?php $render_filter_control('has_votes_uncensored'); ?>
						<?php $render_filter_control('has_votes_bad_translation'); ?>
						<?php $render_filter_control('has_votes_good_translation'); ?>
						<?php $render_filter_control('has_votes_lost_in_translation'); ?>
						<?php $render_filter_control('has_votes_nsfw'); ?>
						<?php $render_filter_control('has_votes_bad_result'); ?>
					</ul>
				</li>
				<li class="migrate-search-archive-controls-filter-group">
					<h3>Filter by year</h3>
					<ul>
						<?php $render_filter_control('has_search_year_2021'); ?>
						<?php $render_filter_control('has_search_year_2020'); ?>
						<?php $render_filter_control('has_search_year_2019'); ?>
						<?php $render_filter_control('has_search_year_2018'); ?>
						<?php $render_filter_control('has_search_year_2017'); ?>
						<?php $render_filter_control('has_search_year_2016'); ?>
					</ul>
				</li>
			</li>
			</ul>
			<hr />
		</div>
		<div class="migrate-search-archive-results cleared">
			<div class="migrate-search-archive-pagination">
				<p>
					<b>
						<span id="filtered-count">N/A</span>
						<!-- of -->
						<!-- <span id="total-count">N/A</span> -->
						<span id="mode"></span>
						results shown
					</b>
					<input
						type="button"
						id="loadMore"
						value="Load more"
						autocomplete="off"
						disabled
						/>
					<input
						type="button"
						id="clearFilters"
						value="Clear filters"
						autocomplete="off"
						disabled
						/>
				</p>
			</div>
			<table
				class="migrate-search-archive-results-table"
				id="migrate-search-archive-results-table"
				>
				<thead>
					<tr>
						<th class="migrate-search-archive-result-tiny"></th>
						<th>Search term</th>
						<th>Translation</th>
						<th>Date (GMT)</th>
					</tr>
				</thead>
			</table>
			<div class="lazy-loads indicator" style="margin-top: 10rem; display: none;"><!-- --></div>
		</div>
	</div>
</section>
<?php

get_footer();

?>
