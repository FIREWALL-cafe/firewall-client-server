$(document).ready(function() {
	$('.gallery').each(function(i, gallery) {
		var w = 0;
		$(gallery).find('.gallery-item').each(function(j, item) {
			w += $(item).width() + 1;
		});
		$(gallery).width(w);
	});
	
	$('section.search').each(function(i, search) {
		var url = $(search).find('a.permalink').attr('href');
		$(search).find('.query-label strong').each(function(j, query) {
			var queryHTML = $(query).html();
			$(query).html('<a href="' + url + '">' + queryHTML + '</a>');
		});
	});
});
