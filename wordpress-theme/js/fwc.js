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
		var maxGalleryWidth = 0;
		$('.gallery').each(function (index, gallery) {
			var galleryWidth = 0;
			$(gallery).find('.gallery-item').each(function(index, item) {
				galleryWidth += $(item).outerWidth(true /* includeMargin */);
			});
			$(gallery).width(galleryWidth);
		});

		$('.gallery.empty').each(function (index, element) {
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
		var indexesToFilterInByKey = {};
		var indexesToFilterInArray = [];
		var indexesToFilterInIntersection = [];
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
		if (data.date_gmt) {
			var d = '';
			var x = new Date(data.date_gmt);
			d += x.getUTCFullYear();
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
			var d = 'N/A';
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
			<div class="more migrate-more">\
				<a href="'+data.link+'" target="_blank">VOTE & SEE Search History</a>\
			</div>\
		</div>\
	</td>\
	<td>'+data.title.rendered+'</td>\
	<td>'+data.excerpt.rendered.slice(3, -5)+'</td>\
	<td>'+d+'</td>\
</tr>';
		return $(template).appendTo('#migrate-search-archive-results-table');
	}

	function renderGallery(gallery) {
		if (gallery['ids'].length) {
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
			return '<div class="gallery empty"><span>No images available</span></div>';
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
		$('#filtered-count').html(firewall.currentPosts || 'N/A');
		$('#total-count').html(firewall.totalPosts || 'N/A');
		if (firewall.totalPosts > firewall.currentPosts) {
			$('#loadMore').prop('disabled', false);
		} else {
			$('#loadMore').prop('disabled', true);
		}
		if (firewall.currentKeyword || firewall.currentFilters) {
			$('#mode').html('filtered');
			$('#clearFilters').prop('disabled', false);
		} else {
			$('#mode').html('total');
			$('#clearFilters').prop('disabled', true);
		}
	}

	function getPosts(callback, type) {
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
