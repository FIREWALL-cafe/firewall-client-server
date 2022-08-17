window.firewall = {
	currentPage: 1,
	currentPosts: 0,
	currentKeyword: '',
	currentFilters: 0,
	currentIds: [],
	totalPages: 'N/A',
	totalPosts: 'N/A',
	perPage: 25,
	blocked: false
};

document.addEventListener('DOMContentLoaded', function (event) {
	var lazyImages = [].slice.call(document.querySelectorAll('img.lazy-load'));

	if ('IntersectionObserver' in window) {
		firewall.lazyImageObserver = new IntersectionObserver(function (entries, observer) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					let lazyImage = entry.target;
					lazyImage.src = lazyImage.dataset.src;
					// lazyImage.srcset = lazyImage.dataset.srcset;
					lazyImage.classList.remove('lazy-load');
					lazyImage.classList.add('lazy-loaded');
					lazyImage.parentElement.classList.remove('lazy-load');
					lazyImage.parentElement.classList.add('lazy-loaded');
					firewall.lazyImageObserver.unobserve(lazyImage);
				}
			});
		});

		lazyImages.forEach(function (lazyImage) {
			firewall.lazyImageObserver.observe(lazyImage);
		});
	} else {
		// Possibly fall back to a more compatible method here
	}
});

$(document).ready(function () {
	// TODO Can eliminate this with improved CSS
	$(window).on('load', function () {
		$('.gallery').each(function (index, gallery) {
			var galleryWidth = 0;
			$(gallery).find('.gallery-item').each(function(index, item) {
				galleryWidth += $(item).outerWidth(true /* includeMargin */);
			});
			$(gallery).width(galleryWidth);
		});

		$('.gallery-empty').each(function (index, element) {
			var width = $(element).siblings('.gallery').width();
			width = (width) ? (width - 100) : '100%';
			$(element).width(width);
		});
	});

	// TODO Can remove entirely?
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

	// TODO Extremely brute force and unoptimized
	function filterListItems() {
		$('#migrate-search-archive-results-table .migrate-search-archive-result').remove();
		// Get list of all active filters, reduce to key-value pairs
		var $activeFilters = $('.migrate-search-archive-control-filter-input:checked');
		var activeFilters = [];
		firewall.currentPage = 1;

		$activeFilters.each(function (index, element) {
			var key = $(element).data('key');
			var value = $(element).data('id');
			activeFilters.push({
				key: key,
				value: value
			});
		});
		$('.migrate-search-archive-result').addClass('filter-in');

		if (activeFilters.length) {
			firewall.currentFilters = 1;
			$('#keywordButton, #keywordInput').prop('disabled', true);
			firewall.currentIds = activeFilters.map(function (element, index) {
				return parseInt(element.value, 10);
			});
		} else {
			firewall.currentFilters = 0;
			firewall.currentIds = [];
			$('#keywordButton, #keywordInput').prop('disabled', false);
		}

		getPosts(function () {}, '');
	}

	function renderListItem(data) {
		let d = '';
		if (data.search_timestamp) {
			let x = new Date(+data.search_timestamp);
			d += x.getUTCFullYear().toString();
			d += '/';
			d += (x.getUTCMonth() + 1).toString().padStart(2, '0');
			d += '/';
			d += x.getUTCDate().toString().padStart(2, '0');
			d += ' ';
			d += x.getUTCHours().toString().padStart(2, '0');
			d += ':';
			d += x.getUTCMinutes().toString().padStart(2, '0');
			d += ':';
			d += x.getUTCSeconds().toString().padStart(2, '0');
		} else {
			d = 'N/A';
		}
		
		var template = 
'<tr class="migrate-search-archive-result" data-index="'+data.index+'">\
	<td class="migrate-search-archive-result-tiny">\
		<div class="migrate-search-archive-result-middle">\
			<div class="images-all">\
				<h3>Google:</h3>\
				<div class="images images-google"></div>\
				<h3>Baidu:</h3>\
				<div class="images images-baidu"></div>\
			</div>\
			<div class="more migrate-more">'+
				(data.wordpress_search_result_post_slug
					? '<a href="https://firewallcafe.com/archive/'+data.wordpress_search_result_post_slug+'" target="_blank">VOTE & SEE Search History</a>'
					: '')+
			'</div>\
		</div>\
	</td>\
	<td>'+data.search_term_initial+'</td>\
	<td>'+data.search_term_translation+'</td>\
	<td>'+d+'</td>\
</tr>';
		return $(template).appendTo('#migrate-search-archive-results-table');
	}

	function renderGallery(gallery) {
		if (gallery['src'].length) {
			var result = '';
			result += '<div class="gallery gallery-columns-3 gallery-size-thumbnail">';
				for (var i = 0; i < gallery['src'].length; i++) {
result += '<figure class="gallery-item">\
<div class="gallery-icon landscape">\
<img src="'+gallery['src'][i]+'" class="attachment-thumbnail size-thumbnail" alt="" />\
</div>\
</figure>';
				}
			result += '</div>';
			return result;
		} else {
			return '<div class="gallery gallery-empty"><span>No images available</span></div>';
		}
	}

	function bindListItem($element, data) {
		$element.addClass('filter-in');
		$element.on('click', function () {
			var width = $('#migrate-search-archive-results-table').width();
			$element.find('.migrate-search-archive-result-middle').css('width', width);
			var $baidu = $element.find('.migrate-search-archive-result-middle .images-baidu');
			var $google = $element.find('.migrate-search-archive-result-middle .images-google');
			if (!$google.html()) {
				$google.html(renderGallery(data.galleries[0]));
			}
			if (!$baidu.html()) {
				$baidu.html(renderGallery(data.galleries[1]));
			}

			$element.find('img.lazy-load').get().forEach(function (lazyImage) {
				firewall.lazyImageObserver.observe(lazyImage);
			});

			$element.toggleClass('active');
		});
	}

	function resetCounts() {
		$('#filtered-count').html('N/A');
		$('#total-count').html('N/A');
	}

	function renderCounts() {
		$('#filtered-count').html(
			typeof firewall.currentPosts === 'number'
			? firewall.currentPosts
			: 'N/A'
		);

		if (firewall.currentPosts === 0)
			$('#loadMore').prop('disabled', true);
		else
		$('#loadMore').prop('disabled', false);
			

		if (firewall.currentKeyword || firewall.currentFilters) {
			$('#mode').html('filtered');
			$('#clearFilters').prop('disabled', false);
		} else {
			$('#mode').html('total');
			$('#clearFilters').prop('disabled', true);
		}
	}

	function getPosts(callback, type) {
		firewall.blocked = true;
		$('.lazy-loads.indicator').show();
		$('#loadMore').prop('disabled', true);

		const requestData = {
			page_size: firewall.perPage,
			page: firewall.currentPage
		};
		
		if (type.length) {
			firewall.currentPage = 1;
			firewall.totalPages = 0;
			firewall.totalPosts = 0;
			firewall.currentKeyword = type;
			$('#migrate-search-archive-results-table .migrate-search-archive-result').remove();
		}

		if (type === true) { // load more
			firewall.currentPage += 1;
			requestData.page = firewall.currentPage;
			if (firewall.currentKeyword) {
				requestData.search = firewall.currentKeyword;
			}
		}

		if (type === '') {
			firewall.totalPosts = 0;
			firewall.currentPage = 1;
			$('#migrate-search-archive-results-table .migrate-search-archive-result').remove();
		}

		firewall.currentPosts = 0;
		resetCounts();

		const filters = $('.migrate-search-archive-control-filter-input:checked');
		const url = new URL('https://api.firewallcafe.com/searches/filter');
		const params = {};

		// If filter by keyword is empty, filter by category
		if (!firewall.currentKeyword) {
			filters.each((k, filter) => {
				const slug = $(filter).data('slug');
				if (slug.includes('has_search_location_')) {
					const term = slug.replace('has_search_location_', '');
					params['search_locations'] = params['search_locations'] 
						? params['search_locations'].concat([term])
						: [term];
				} else if (slug.includes('has_votes_')) {
					const term = slug.replace('has_votes_', '');
					const voteIds = {
						'censored': 1,
						'uncensored': 2,
						'bad_translation': 3,
						'good_translation': 4,
						'lost_in_translation': 5,
						'nsfw': 6,
						'wtf': 7,
					}; // or put in array and derive the id by adding 1

					params['vote_ids'] = params['vote_ids']
						? params['vote_ids'].concat(voteIds[term])
						: [voteIds[term]];
				} else if (slug.includes('has_search_year_')) {
					const term = slug.replace('has_search_year_', '');
					params['years'] = params['years']
						? params['years'].concat([term])
						: [term];
				}
			});

			for (let k in params) {
				url.searchParams.append(k, decodeURI(JSON.stringify(params[k])));
			}
		} else { // If filter by keyword
			url.searchParams.append('keyword', firewall.currentKeyword);
		}

		url.searchParams.append('page_size', requestData.page_size);
		url.searchParams.append('page', requestData.page);

		fetch(url)
			.then(res => res.json())
			.then(data => {
				data.forEach(function (element, index) {
					element.index = index;
					bindListItem(renderListItem(element), element);
				});
				firewall.searchArchive = data;
				firewall.totalPosts = data.length
					? data[0].total
					: 0;
				firewall.currentPosts = firewall.totalPosts === 0
					? 0
					: data.length * requestData.page;
				renderCounts();

				$('#keywordInput').prop('disabled', false);
				$('#keywordInput').focus();
				firewall.blocked = false;
				$('.lazy-loads.indicator').hide();	

				callback();
			})
	}

	function getPosts_deprecated(callback, type) {
	// function getPosts(callback, type) {
		var startTime = Date.now();
		firewall.blocked = true;
		$('.lazy-loads.indicator').show();
		$('#loadMore').prop('disabled', true);

		var ajaxRequestData = {
			// type: 'search-result',
			per_page: firewall.perPage,
			page: firewall.currentPage
		};

		if (type.length) { // search query
			firewall.currentPage = 1;
			firewall.totalPages = 0;
			firewall.totalPosts = 0;
			firewall.currentKeyword = type;
			ajaxRequestData['search'] = type;
			$('#migrate-search-archive-results-table .migrate-search-archive-result').remove();
		}	
		if (type === true) { // load more
			firewall.currentPage += 1;
			ajaxRequestData['page'] = firewall.currentPage;
			if (firewall.currentKeyword) {
				ajaxRequestData['search'] = firewall.currentKeyword;
			}
		}
		if (type === '') {
			firewall.totalPosts = 0;
			firewall.currentPage = 1;
			$('#migrate-search-archive-results-table .migrate-search-archive-result').remove();
		}
		if (firewall.currentIds.length) {
			ajaxRequestData['tags'] = firewall.currentIds;
		}

		var ajaxParameters = {
			// url: '/wp-json/wp/v2/posts',
			url: '/wp-json/wp/v2/search-result',
			method: 'GET',
			data: ajaxRequestData
		};

		firewall.currentPosts = 0;
		resetCounts();

		$.ajax(ajaxParameters).done(function (ajaxResponseData, textStatus, jqXHR) {
			firewall.totalPages = parseInt(jqXHR.getResponseHeader('X-WP-TotalPages'), 10);
			firewall.totalPosts = parseInt(jqXHR.getResponseHeader('X-WP-Total'), 10);
			// var raw = JSON.stringify(ajaxResponseData);
			// Remove content, probably not necessary
			ajaxResponseData.forEach(function (element) {
				delete element.content;
			});
			// console.log(ajaxResponseData.map(function (element) { return element.tags; }));
			ajaxResponseData.forEach(function (element, index) {
				element.index = index;
				bindListItem(renderListItem(element), element);
			});
			firewall.searchArchive = ajaxResponseData;
			firewall.currentPosts = ajaxResponseData.length + (firewall.perPage * (firewall.currentPage - 1));
			renderCounts();

			$('#keywordInput').prop('disabled', false);
			$('#keywordInput').focus();
			firewall.blocked = false;
			$('.lazy-loads.indicator').hide();	

			callback();
		});
	}

	$('input[type=checkbox').on('input', function () {
		var $this = $(this);
		filterListItems();
	});

	$('#keywordInput').on('input', function () {
		if ($('#keywordInput').val().length) {
			$('#keywordButton').prop('disabled', false);
			firewall.currentKeyword = $('#keywordInput').val();
		} else {
			$('#keywordButton').prop('disabled', true);
			firewall.currentKeyword = '';
		}
	});

	$('#keywordSearch').on('submit', function (event) {
		event.preventDefault();
		$('#keywordButton').prop('disabled', true);
		firewall.currentIds = [];
		firewall.currentPage = 1;
		firewall.currentFilter = 0; // clear all
		$('input[type=checkbox]').prop('checked', false);
		getPosts(function () {
			$('#keywordButton').prop('disabled', false);
		}, firewall.currentKeyword);
	});

	$('#loadMore').on('click', function () {
		$('#loadMore').prop('disabled', true);
		getPosts(function () {}, true);
	});

	$('#clearFilters').on('click', function () {
		$('#clearFilters').prop('disabled', true);
		$('#keywordButton').prop('disabled', true);
		firewall.currentIds = [];
		firewall.currentPage = 1;
		firewall.currentKeyword = '';
		firewall.currentFilter = 0; // Clear all
		$('#keywordInput').val('')
		$('input[type=checkbox]').prop('checked', false);
		getPosts(function () {
			$('#keywordButton').prop('disabled', false);
		}, '');
	});

	if (window.location.hash === '#votes') {
		$('.migrate-search-library-close').show();
		$('.migrate-search-library-close').on('click', function () {
			window.close();
		});
	}

	if (window.location.href.slice(-8) === 'archive/') {
		getPosts(function () {}, '');
	}

	$('.tooltip').on('mouseover', function () {
		$(this).addClass('visible');
	});

	$('.tooltip').on('mouseout', function () {
		$(this).removeClass('visible');
	});
});
