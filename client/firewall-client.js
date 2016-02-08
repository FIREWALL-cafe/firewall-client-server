
var storage = chrome.storage.local;
var clientId = 'Client ' + (100 + Math.floor(Math.random() * 900));
var pendingQueries = [];
var pendingImages = {};

var query = null;
var ignoreSubmit = false;
var getImagesTimeout = null;

storage.get(['clientId', 'pendingQueries', 'pendingImages'], function(stored) {
	
	if (stored.clientId) {
		clientId = stored.clientId;
	} else {
		storage.set({
			clientId: clientId
		});
	}
	
	if (stored.pendingQueries) {
		pendingQueries = stored.pendingQueries;
	}
	
	if (stored.pendingImages) {
		pendingImages = stored.pendingImages;
	}
	
	console.log('Firewall Cafe ' + clientId +
	            ' (' + pendingQueries.length + ' pending queries)');
	
	setupUI();
	setupStorageListener();
	checkPendingQueries();
	checkPendingTimestamp();
	setupInterval();
});

function setupUI() {
	$('#fsr, #lh, #ft').append(
		'<div id="firewall">' +
			'<a href="#firewall" id="firewall-show">Firewall</a>' +
			'<form action="." id="firewall-form">' +
				'<label>Client ID: <input name="client-id" id="client-id" value="' + clientId + '"></label>' +
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
		clientId = $('#client-id').val();
		chrome.storage.local.set({
			clientId: clientId
		}, function() {
			console.log('Firewall client: ' + clientId);
			$('#firewall-form').removeClass('visible');
		});
	});
}

function setupInterval() {
	setInterval(function() {
		checkURLQuery();
	}, 100);
}

function setupStorageListener() {
	 chrome.storage.onChanged.addListener(function(changes, area) {
		 if (area != 'local') {
			 return;
		 }
		 if (changes.pendingQueries) {
			 pendingQueries = changes.pendingQueries.newValue;
			 checkPendingQueries();
		 }
		 if (changes.pendingImages) {
			 pendingImages = changes.pendingImages.newValue;
		 }
	 }); 
}

function checkPendingQueries() {
	console.log('Checking for pending queries');
	if (pendingQueries.length > 0) {
		if (pendingQueries[0].source != getSource()) {
			console.log('Found a pending query');
			var pendingQuery = pendingQueries.shift();
			chrome.storage.local.set({
				pendingQueries: pendingQueries
			}, function() {
				searchPendingQuery(pendingQuery);
			});
		} else {
			console.log('Found a query for someone else');
		}
	}
}

function checkPendingTimestamp() {
	var queryMatch = location.search.match(/__ts=(\d+)/);
	if (queryMatch) {
		ignoreSubmit = true;
		var timestamp = parseInt(queryMatch[1]);
		query = getQueryMatch();
		if (!query) {
			console.log('Could not determine query from URL.')
		}
		getImages(timestamp);
	}
}

function checkURLQuery() {
	var queryMatch = getQueryMatch();
	if (!queryMatch) {
		return;
	}

	if (ignoreSubmit) {
		query = queryMatch;
		ignoreSubmit = false;
		return;
	}

	if (queryMatch != query) {
		var timestamp = (new Date().getTime());
		query = queryMatch;
		console.log('Search for ' + query + ' at ' + timestamp);

		if (!query) {
			return;
		}

		if (getImagesTimeout) {
			clearTimeout(getImagesTimeout);
			getImagesTimeout = null;
		}
		setTimeout(function() {
			getImages(timestamp);
		}, 1000);

		detectLanguage(query, function(langFrom) {
			if (langFrom == 'en') {
				var langTo = 'zh-CN';
			} else {
				var langTo = 'en';
			}

			pendingQueries.push({
				timestamp: timestamp,
				source: getSource(),
				query: query,
				langFrom: langFrom,
				langTo: langTo
			});
			storage.set({
				pendingQueries: pendingQueries
			}, function() {
				console.log('Saved pending query from ' + getSource());
			});
		});
	}
}

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

function searchPendingQuery(pending) {
	console.log('Searching for a pending query ' + pending.query);
	translatePendingQuery(pending, function(translation) {
		console.log('Found translation: ' + translation);
		if (getSource() == 'google') {
			var inputQuery = 'input[name=q]';
		} else if (getSource() == 'baidu') {
			var inputQuery = 'input[name=word]';
		}
		if ($(inputQuery).length == 0 ||
		    $(inputQuery).first().closest('form').length == 0) {
			return;
		}
		ignoreSubmit = true;
		$(inputQuery).first().val(translation);
		var $form = $(inputQuery).first().closest('form');
		$form.append('<input type="hidden" name="__ts" value="' + pending.timestamp + '">');
		$form.submit();
	});
}

function translatePendingQuery(pending, callback) {
	$.ajax({
		url: 'https://www.googleapis.com/language/translate/v2',
		data: {
			key: config.apiKey,
			q: pending.query,
			source: pending.langFrom,
			target: pending.langTo
		},
		dataType: 'json'
	}).done(function(rsp) {
		if (rsp && rsp.data && rsp.data.translations) {
			console.log(rsp.data.translations);
			var translated = rsp.data.translations[0].translatedText;
			callback(translated);
		} else {
			console.log('Error translating query', rsp, this);
		}
	});
}

function getImages(timestamp) {
	console.log('Gathering images for ' + timestamp);
	var images = [];
	$('.imglist img').each(function(i, img) {
		if (images.length < 10) {
			images.push(img.src);
		}
	});
	$('#rg .rg_l').each(function(i, link) {
		var href = $(link).attr('href');
		var src = href.match(/imgurl=([^&]+)/);
		if (src) {
			if (images.length < 10) {
				images.push(src[1]);
			}
		}
	});
	if (images.length == 0) {
		console.log('No images found, waiting...');
		if (getImagesTimeout) {
			clearTimeout(getImagesTimeout);
		}
		getImagesTimeout = setTimeout(function() {
			getImages(timestamp);
		}, 1000);
		return;
	}
	
	var source = getSource();
	var imagesKey = source + '_images';
	var queryKey = source + '_query';
	if (pendingImages[timestamp]) {
		var pending = pendingImages[timestamp];
		pending[imagesKey] = images;
		pending[queryKey] = query;
		submitImages(pending, function() {
			pendingImages[timestamp] = null;
			storage.set({
				pendingimages: pendingImages
			});
		});
	} else {
		var pending = {
			timestamp: timestamp
		};
		pending[imagesKey] = images;
		pending[queryKey] = query;
		pendingImages[timestamp] = pending;
		storage.set({
			pendingImages: pendingImages
		});
	}
}

function submitImages(pending, callback) {
	var data = pending;
	data.client = clientId;
	data.secret = config.sharedSecret;
	data.google_images = JSON.stringify(data.google_images);
	data.baidu_images = JSON.stringify(data.baidu_images);
	console.log('Submit images:', pending);
	$.ajax({
		url: config.serverURL + 'submit-images',
		method: 'POST',
		data: data
	}).done(function() {
		callback();
	});
}

function getQueryMatch() {
	var regex = /[^a-zA-Z0-9](q|word)=([^&]+)/;
	var queryMatch = location.hash.match(regex);
	if (!queryMatch) {
		queryMatch = location.search.match(regex);
	}
	if (!queryMatch) {
		return null;
	}
	queryMatch = decodeURIComponent(queryMatch[2]).replace(/\++/g, ' ');
	queryMatch = normalizeQuery(queryMatch);
	return queryMatch;
}

function normalizeQuery(query) {
	var normalized = query.toLowerCase().trim();
	normalized = normalized.replace(/\s+/g, ' ');
	return normalized;
}

function getSource() {
	return location.hostname.replace('www.', '')
	                        .replace('image.', '')
	                        .replace('.com', '');
}
