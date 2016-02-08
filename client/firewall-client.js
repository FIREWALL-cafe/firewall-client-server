var data = null;

var query = '';
var queryEn = null;
var ignoreSubmit = false;
var getImagesTimeout = null;
var lastImages = [];

chrome.storage.local.get('firewallClient', function(storedData) {
	if (storedData && storedData.firewallClient) {
		data = storedData.firewallClient;
	} else {
		data = {
			query: {},
			clientId: 'Unknown'
		}
	}
	console.log('Firewall client: ' + data.clientId);
	setupUI();
});

function setupUI() {
	$('#fsr, #lh, #ft').append(
		'<div id="firewall">' +
			'<a href="#firewall" id="firewall-show">Firewall</a>' +
			'<form action="." id="firewall-form">' +
				'<label>Client ID: <input name="client-id" id="client-id" value="' + data.clientId + '"></label>' +
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
		data.clientId = $('#client-id').val();
		chrome.storage.local.set({
			firewallClient: data
		}, function() {
			console.log('Firewall client: ' + data.clientId);
			$('#firewall-form').removeClass('visible');
		});
	});
}

setInterval(function() {
	if (!data || ignoreSubmit) {
		return;
	}
	var regex = /[^a-zA-Z0-9](q|word)=([^&]+)/;
	var queryMatch = location.hash.match(regex);
	if (!queryMatch) {
		queryMatch = location.search.match(regex);
	}
	if (!queryMatch) {
		queryMatch = ['', '', ''];
	}
	queryMatch = decodeURIComponent(queryMatch[2]).replace(/\++/g, ' ');
	queryMatch = normalizeQuery(queryMatch);

	if (queryMatch != query) {
		query = queryMatch;
		console.log('Search for ' + query);

		if (getImagesTimeout) {
			clearTimeout(getImagesTimeout);
			getImagesTimeout = null;
		}
		
		detectLanguage(query, function(langFrom) {
			if (langFrom == 'en') {
				var langTo = 'zh-CN';
			} else {
				var langTo = 'en';
			}
			translateQuery(query, langFrom, langTo, function(translated) {
				console.log('Translated: ' + translated);
			});
		});
	}
}, 100);

function detectLanguage(query, callback) {
	$.ajax({
		url: 'https://www.googleapis.com/language/translate/v2/detect',
		data: {
			key: config.apiKey,
			q: query
		},
		dataType: 'json'
	}).done(function(rsp) {
		if (rsp && rsp.data && rsp.data.detections) {
			console.log(rsp.data.detections);
			callback(rsp.data.detections[0][0].language);
		} else {
			console.log('Error detecting language', rsp, this);
		}
	});
}

function translateQuery(query, langFrom, langTo, callback) {
	
}

function getImages(queryEn, queryZh) {
	console.log('Gathering images for ' + queryEn);
	var images = [];
	var allImages = [];
	$('.imglist img').each(function(i, img) {
		if (images.length < 10 &&
		    lastImages.indexOf(img.src) == -1) {
			images.push(img.src);
		}
		allImages.push(img.src);
	});
	$('#rg .rg_l').each(function(i, link) {
		var href = $(link).attr('href');
		var src = href.match(/imgurl=([^&]+)/);
		if (src) {
			if (images.length < 10 &&
			    lastImages.indexOf(src[1]) == -1) {
				images.push(src[1]);
			}
			allImages.push(src[1]);
		}
	});
	console.log('number of allImages: ' + allImages.length);
	console.log('number of images: ' + images.length);
	if (images.length == 0) {
		console.log('No images found, waiting...');
		if (getImagesTimeout) {
			clearTimeout(getImagesTimeout);
		}
		getImagesTimeout = setTimeout(function() {
			getImages(queryEn, queryZh);
		}, 1000);
		return;
	}
	lastImages = allImages;
	var source = location.hostname.replace('www.', '')
	                              .replace('image.', '')
	                              .replace('.com', '');
	var images = {
		query: queryEn,
		source: source,
		images: images
	};
	if (queryZh) {
		images.query_zh = queryZh;
	}
	console.log('images!', images);
	//socket.emit('images', images);
}

function normalizeQuery(query) {
	var normalized = query.toLowerCase().trim();
	normalized = normalized.replace(/\s+/g, ' ');
	return normalized;
}
