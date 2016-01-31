var query = null;
var queryEn = null;
var socket = null;
var config = null;
var ignoreSubmit = false;
var getImagesTimeout = null;

chrome.storage.local.get('firewall', function(storedConfig) {
	if (storedConfig && storedConfig.firewall) {
		config = storedConfig.firewall;
	} else {
		config = {
			langFrom: 'en',
			langTo: 'zh-CN',
			server: 'https://translate.firewallcafe.com/'
		}
	}
	setupUI();
	setupSocket();
});

function setupUI() {
	$('#fsr, #lh, #ft').append(
		'<div id="firewall">' +
			'<a href="#firewall" id="firewall-show">Firewall</a>' +
			'<form action="." id="firewall-form">' +
				'<label><span>From:</span><input name="lang-from" id="firewall-from" value="' + config.langFrom + '"></label>' +
				'<label><span>To:</span><input name="lang-to" id="firewall-to" value="' + config.langTo + '"></label>' +
				'<label><span>Server:</span><input name="lang-server" id="firewall-server" value="' + config.server + '"></label>' +
				'<input type="submit" value="Save">' +
			'</form>' +
		'</div>'
	);

	$('#firewall-show').click(function(e) {
		e.preventDefault();
		$('#firewall-form').toggleClass('visible');
	});

	$('#firewall-form').submit(function(e) {
		e.preventDefault();
		config.langFrom = $('#firewall-from').val();
		config.langTo   = $('#firewall-to').val();
		config.server   = $('#firewall-server').val();
		chrome.storage.local.set({
			firewall: config
		});
		$(this).removeClass('visible');
	});
}

function setupSocket() {
	if (!config.server) {
		return;
	}
	socket = io(config.server);
	console.log('Listening for translations to ' + config.langFrom);
	socket.on('translation', function(translation) {
		if (translation.langTo == config.langFrom) {
			query = translation.result.toLowerCase().trim();
			config.query = query;
			if (translation.langFrom == 'en') {
				config.queryEn = translation.query;
			}
			chrome.storage.local.set({
				firewall: config
			});
			if (location.hostname == 'www.google.com') {
				var inputQuery = 'input[name=q]';
			} else if (location.hostname == 'image.baidu.com') {
				var inputQuery = 'input[name=word]';
			}
			if ($(inputQuery).length == 0 ||
			    $(inputQuery).first().closest('form').length == 0) {
				return;
			}
			ignoreSubmit = true;
			$(inputQuery).first().val(translation.result);
			$(inputQuery).first().closest('form').submit();
		}
	});
}

setInterval(function() {
	if (!config || !socket || ignoreSubmit) {
		return;
	}
	var regex = /[^a-zA-Z0-9](q|word)=([^&]+)/;
	var queryMatch = location.hash.match(regex);
	if (!queryMatch) {
		queryMatch = location.search.match(regex);
	}
	if (!queryMatch) {
		return;
	}
	queryMatch = decodeURIComponent(queryMatch[2]).replace(/\+/g, ' ');
	queryMatch = queryMatch.toLowerCase().trim();
	if (queryMatch != query && queryMatch != config.query) {
		query = queryMatch;
		console.log('Search for ' + query);

		if (getImagesTimeout) {
			clearTimeout(getImagesTimeout);
			getImagesTimeout = null;
		}

		socket.emit('search', {
			langFrom: config.langFrom,
			langTo: config.langTo,
			query: query
		});
		if (config.langFrom == 'en') {
			getImages(query);
		}
	}
	if (config.queryEn) {
		var queryEn = config.queryEn;
		getImages(queryEn, query);
		config.queryEn = null;
		chrome.storage.local.set({
			firewall: config
		});
	}
}, 100);

function getImages(queryEn, queryCn) {
	console.log('Gathering images for ' + queryEn);
	var images = [];
	$('.imglist img').each(function(i, img) {
		if (i < 11 &&
		    $(img).data('query') != queryEn) {
			$(img).data('query', queryEn);
			images.push(img.src);
		}
	});
	$('#rg .rg_l').each(function(i, link) {
		if (i < 11 &&
		    $(link).data('query') != queryEn) {
			$(link).data('query', queryEn);
			var href = $(link).attr('href');
			var src = href.match(/imgurl=([^&]+)/);
			if (src) {
				images.push(src[1]);
			}
		}
	});
	if (images.length == 0) {
		console.log('No images found, trying again...');
		if (getImagesTimeout) {
			clearTimeout(getImagesTimeout);
		}
		getImagesTimeout = setTimeout(function() {
			getImages(queryEn, queryCn);
		}, 1000);
		return;
	}
	var source = location.hostname.replace('www.', '')
	                              .replace('image.', '')
	                              .replace('.com', '');
	var images = {
		query: queryEn,
		source: source,
		images: images
	};
	if (queryCn) {
		images.query_cn = queryCn;
	}
	socket.emit('images', images);
}
