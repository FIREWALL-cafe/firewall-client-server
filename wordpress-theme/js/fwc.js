$(document).ready(function () {
	// TODO Can eliminate this with improved CSS
	$(window).on('load', function () {
		$('.gallery').each(function (i, gallery) {
			var w = 0;
			$(gallery).find('.gallery-item').each(function(j, item) {
				w += $(item).width() + 1;
			});
			$(gallery).width(w);
		});
	});

	$('section.search').each(function (i, search) {
		var url = $(search).find('a.permalink').attr('href');
		$(search).find('.query-label strong').each(function(j, query) {
			var queryHTML = $(query).html();
			$(query).html('<a href="' + url + '">' + queryHTML + '</a>');
		});
	});

	$tagNav = $('.tag-navigation-container');
	$tagNavOpener = $('.tag-navigation-opener');
	$tagNavOpener.on('click', function () {
		$tagNav.toggleClass('open');
		if ($tagNav.hasClass('open')) {
			$tagNavOpener.html('Show fewer categories');
		} else {
			$tagNavOpener.html('Show more categories');
		}
	});

	$('.migrate-search-archive-controls .control').on('click', function () {
		var $this = $(this);
		$this.toggleClass('active');
		if ($this.hasClass('active')) {
			$this.find('input').prop('checked', true);
		} else {
			$this.find('input').prop('checked', false);
		}
		filterListItems();
	});

	// TODO This is extremely brute force and unoptimized
	function filterListItems() {
		// Get list of all active filters, reduce to key-value pairs
		var $activeFilters = $('.migrate-search-archive-controls .filter.active');
		var activeFilters = [];
		var indexesToFilterInByKey = {};
		var indexesToFilterInArray = [];
		var indexesToFilterInIntersection = [];

		$activeFilters.each(function (index, element) {
			var key = $(element).data('key');
			var value = $(element).data('value');
			activeFilters.push({
				key: key,
				value: value
			});
		});

		if (activeFilters.length) {
			// Iterate through JSON data to find indexes of entries matching key-value
			firewall.searchArchive.forEach(function (entry, index) {
				activeFilters.forEach(function (filter, index) {
					var needle = filter.value.toLowerCase();
					var needle = (filter.key === 'tags') ? '>'+needle+'<' : needle;
					var haystack = entry[filter.key].toLowerCase();
					var match = (haystack.indexOf(needle) != -1) ? true : false;
					if (match) {
						// Add index to array corresponding to the key being filtered on
						if (typeof indexesToFilterInByKey[filter.key] === 'undefined') {
							indexesToFilterInByKey[filter.key] = [];
						}
						indexesToFilterInByKey[filter.key].push(entry.index);
					}
				});
			});
			// Reduce each filter-key index array to unique elements and collect in separate array
			Object.keys(indexesToFilterInByKey).forEach(function (key, index) {
				var uniqueIndexes = indexesToFilterInByKey[key].filter(function (element, index, array) {
					return array.indexOf(element) === index;
				});
				indexesToFilterInArray.push(uniqueIndexes);
			});
			// Take intersection of all filter-key index arrays
			indexesToFilterInArray.forEach(function (indexArray) {
				// An element of the current filter-key index array is added to final array
				// only if it is contained in all other filter-key index arrays
				indexArray.forEach(function (item, index) {
					var containedInAllArrays = true;
					indexesToFilterInArray.forEach(function (indexArray) {
						if (indexArray.indexOf(item) === -1) {
							containedInAllArrays = false;
						}
					});
					if (containedInAllArrays) {
						indexesToFilterInIntersection.push(item);
					}
				});
			});
			// Collapse intersection of indexes array to unique elements
			indexesToFilterInIntersection = indexesToFilterInIntersection.filter(function (element, index, array) {
				return array.indexOf(element) === index;
			});

			// Apply class to entries whose index has been filtered in
			$('.migrate-search-archive-result').removeClass('filter-in');
			indexesToFilterInIntersection.forEach(function (element, index) {
				$('.migrate-search-archive-result[data-index='+element+']').addClass('filter-in');
			});
			$('#filtered-count').html(indexesToFilterInIntersection.length);
			console.log(indexesToFilterInIntersection);
		} else {
			$('.migrate-search-archive-result').addClass('filter-in');
			$('#filtered-count').html($('.migrate-search-archive-result').length);
		}
	}

	function renderListItem(data) {
		var template = 
'<tr class="migrate-search-archive-result" data-index="'+data.index+'">\
	<td class="tiny">\
		<div class="middle">\
			<div class="images-all">\
				<h3>Google results</h3>\
				<div class="images images-google"></div>\
				<h3>Baidu results</h3>\
				<div class="images images-baidu"></div>\
			</div>\
			<div class="tags">\
				Tags:<br />'+data.tags+'\
			</div>\
			<div class="more">\
				<a href="'+data.permalink+'" target="_blank">VOTE or see search history</a>\
			</div>\
		</div>\
	</td>\
	<td>'+data.title+'</td>\
	<td>'+data.translation+'</td>\
	<td>'+data.date+'</td>\
</tr>';
		return $(template).appendTo('#migrate-search-archive-results-table');
	}

	function bindListItem($element, data) {
		$element.on('click', function () {
			var width = $('#migrate-search-archive-results-table').width();
			$element.find('.middle').css('width', width);
			var $baidu = $element.find('.middle .images-baidu');
			var $google = $element.find('.middle .images-google');
			if (!$baidu.html()) {
				$baidu.html(data.galleries[1]);
			}
			if (!$google.html()) {
				$google.html(data.galleries[0]);
			}
			$element.toggleClass('active');
		});
	}

	window.firewall = {};
	var rawJson = $('#json').html();
	if (rawJson) {
		firewall.searchArchive = JSON.parse(rawJson);

		// TODO Use a fake checkbox instead so that state doesn't persist after pageload
		$('.migrate-search-archive-controls .control input').prop('checked', false);

		firewall.searchArchive.forEach(function (element, index) {
			bindListItem(renderListItem(element), element);
		});
		filterListItems();
	}
});
