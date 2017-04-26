
var storage = chrome.storage.local;
var clientId = randomClientId();
var pendingQuery = {};

var query = null;
var ignoreSubmit = false;
var ignorePending = false;
var getImagesTimeout = null;
var autocompleteEnabled = true;

var googleInput = '#lst-ib';

storage.get([
	'clientId',
	'pendingQuery',
	'autocompleteEnabled'
], function(stored) {
	
	if (stored.clientId) {
		clientId = stored.clientId;
	} else {
		storage.set({
			clientId: clientId
		});
	}
	
	if (stored.pendingQuery) {
		pendingQuery = stored.pendingQuery;
	}
	
	if (stored.autocompleteEnabled) {
		autocompleteEnabled = (stored.autocompleteEnabled == 'on');
	}
	
	console.log('Firewall Cafe ' + clientId);
	console.log('Server: ' + config.serverURL);
	if (pendingQuery && pendingQuery.query) {
		console.log('Pending query: ' + pendingQuery.query);
	}
	if (autocompleteEnabled) {
		console.log('Autocomplete enabled');
	}
	
	setupUI();
	setupStorageListener();
	checkPendingQuery();
	setupInterval();
});

function setupUI() {
	
	var suggestChecked = autocompleteEnabled ? ' checked="checked"' : '';
	
	$('#fsr, #lh, #ft').append(
		'<div id="firewall">' +
			'<a href="#firewall" id="firewall-show">Firewall</a>' +
			'<form action="." id="firewall-form">' +
				'<label>Client ID: <input name="client-id" id="firewall-client-id" value="' + clientId + '"></label>' +
				'<label><input type="checkbox" id="firewall-suggest"' + suggestChecked + '> Suggest sensitive queries</label>' +
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
		clientId = $('#firewall-client-id').val();
		autocompleteEnabled = $('#firewall-suggest')[0].checked;
		var autocompleteStatus = (autocompleteEnabled ? 'on' : 'off');
		storage.set({
			clientId: clientId,
			autocompleteEnabled: autocompleteStatus
		}, function() {
			console.log('Firewall client: ' + clientId);
			console.log('Autocomplete: ' + autocompleteStatus);
			$('#firewall-form').removeClass('visible');
		});
		if (autocompleteEnabled) {
			$(googleInput).autocomplete({
				source: sensitiveQueries
			});
			$(googleInput).autocomplete('enable');
			$(document.body).addClass('firewall-autocomplete');
		} else {
			$(googleInput).autocomplete('disable');
			$(document.body).removeClass('firewall-autocomplete');
		}
	});
	
	if (autocompleteEnabled) {
		$(googleInput).autocomplete({
			source: sensitiveQueries
		});
		$(document.body).addClass('firewall-autocomplete');
	}
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
		 if (changes.pendingQuery) {
			 pendingQuery = $.extend(pendingQuery, changes.pendingQuery.newValue);
			 checkPendingQuery();
			 checkPendingImages();
		 }
	 }); 
}

function checkPendingQuery() {
	if (ignorePending) {
		return;
	}
	var queryMatch = getQueryMatch();
	var currTime = (new Date()).getTime();
	
	if (pendingQuery &&
	    pendingQuery.translated &&
	    pendingQuery.translated == queryMatch) {
		// We've just searched for this one, let getImages take it from here
		return;
	} else if (pendingQuery &&
	           pendingQuery.timestamp &&
	           currTime - pendingQuery.timestamp > 60 * 1000) {
		// Pending queries expire after 1 min
		pendingQuery = {};
		storage.set({
			pendingQuery: {}
		}, function() {
			console.log('Removed expired pending query');
		});
	} else if (pendingQuery.query &&
	           pendingQuery.source != getSource()) {
		console.log('Found a pending query: ' + pendingQuery.query);
		ignorePending = true;
		searchPendingQuery();
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
		
		query = queryMatch;
		if (!query) {
			return;
		}

		var timestamp = (new Date().getTime());
		console.log('Detected a search: ' + query);

		var isPending = checkPending(query);
		if (isPending == 'source') {
			console.log('Query is already pending');
			return;
		} else if (isPending == 'translated') {
			console.log('Pending translation: ' + pendingQuery.translated);
			ignorePending = true;
			startGettingImages();
		} else {
			startQuery(query, function(result) {
				console.log('Translated the query: ' + result.translated);
				pendingQuery = $.extend(result, {
					timestamp: timestamp,
					source: getSource(),
					googleImages: null,
					baiduImages: null
				});
				storage.set({
					pendingQuery: pendingQuery
				}, function() {
					console.log('Saved pending: ' + result.query);
				});
				startGettingImages();
			});
		}
	}
}

function startQuery(query, callback) {
	console.log('Starting query for ' + query);
	var data = {
		query: query,
		secret: config.sharedSecret
	};
	$.ajax({
		url: config.serverURL + 'query',
		method: 'POST',
		data: data
	}).done(function(result) {
		callback(result);
	}).fail(function(xhr, textStatus) {
		console.log('Failed query: ' + textStatus + ' / ' + xhr.responseText);
	});
}

function startGettingImages() {
	if (getImagesTimeout) {
		clearTimeout(getImagesTimeout);
		getImagesTimeout = null;
	}
	setTimeout(function() {
		getImages();
	}, 2000);
}

function checkPending(query) {
	if (pendingQuery) {
		if (pendingQuery.translated == query) {
			return 'translated';
		} else if (pendingQuery.query == query) {
			return 'source';
		}
	}
	return false;
}

function searchPendingQuery() {
	console.log('Searching for translated: ' + pendingQuery.translated);
	var inputQuery = 'input[name=q], input[name=word]';
	if ($(inputQuery).length == 0 ||
	    $(inputQuery).first().closest('form').length == 0) {
		console.log('Could not find form input, giving up.');
		ignorePending = false;
		return;
	}
	$(inputQuery).first().val(pendingQuery.translated);
	var $form = $(inputQuery).first().closest('form');
	ignoreSubmit = true;
	$form.submit();
}

function getImages() {
	if (!pendingQuery ||
	    !pendingQuery.query) {
		return;
	}
	console.log('Gathering images: ' + pendingQuery.query);
	var images = [];
	$('.imglist img').each(function(i, img) {
		if (images.length < 20 &&
		    images.indexOf(img.src) == -1) {
			images.push(img.src);
		}
	});
	$('#rg .rg_l').each(function(i, link) {
		var href = $(link).attr('href');
		if (!href) {
			return;
		}
		var src = href.match(/imgurl=([^&]+)/);
		if (src) {
			if (images.length < 20 &&
			    images.indexOf(src[1]) == -1) {
				images.push(src[1]);
			}
		}
	});
	
	if (images.length == 0) {
		console.log('Waiting for images');
		startGettingImages();
		return;
	}
	
	console.log('Found ' + images.length + ' images');
	var imagesKey = getSource() + 'Images';
	pendingQuery[imagesKey] = images;
	
	if (!checkPendingImages()) {
		// If we don't have all the images yet, save the first crop of them to storage
		storage.set({
			pendingQuery: pendingQuery
		}, function() {
			ignorePending = false;
		});
	}
}

function checkPendingImages() {
	console.log('Checking pending images...');
	if (pendingQuery &&
	    pendingQuery.googleImages &&
	    pendingQuery.baiduImages) {
		console.log('Looks like we have everything');
		// If we have both sets of images, submit them ... annnd we're done
		submitImages(function() {
			console.log('Removing pending query');
			pendingQuery = {};
			storage.set({
				pendingQuery: {}
			}, function() {
				ignorePending = false;
			});
		});
		return true;
	}
	console.log('Still waiting');
	console.log(pendingQuery);
	return false;
}

function submitImages(callback) {
	var data = {
		timestamp: pendingQuery.timestamp,
		client: clientId,
		secret: config.sharedSecret,
		google_images: JSON.stringify(pendingQuery.googleImages),
		baidu_images: JSON.stringify(pendingQuery.baiduImages)
	};
	if (pendingQuery.source == 'google') {
		data.google_query = pendingQuery.query;
		data.baidu_query = pendingQuery.translated;
	} else {
		data.google_query = pendingQuery.translated;
		data.baidu_query = pendingQuery.query;
	}
	/*console.log('Submitting images to translation server');
	$.ajax({
		url: config.serverURL + 'submit-images',
		method: 'POST',
		data: data
	}).done(function() {
		console.log('Done submitting images to translation server');
		callback();
	}).fail(function(xhr, textStatus) {
		console.log('Failed submitting images to translation server: ' + textStatus + ' / ' + xhr.responseText);
	});*/

	console.log('Submitting images to library');
	$.ajax({
		url: config.libraryURL,
		method: 'POST',
		data: data
	}).done(function() {
		console.log('Done submitting images to library');
		callback();
	}).fail(function(xhr, textStatus) {
		console.log('Failed submitting images to library: ' + textStatus + ' / ' + xhr.responseText);
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
	queryMatch = decodeURIComponent(queryMatch[2]).replace(/\+/g, ' ');
	queryMatch = normalizeQuery(queryMatch);
	return queryMatch;
}

function normalizeQuery(query) {
	var normalized = query.toLowerCase().trim();
	return normalized;
}

function getSource() {
	return location.hostname.replace('www.', '')
	                        .replace('image.', '')
	                        .replace('.com', '');
}

function randomClientId() {
	return 'Client ' + (100 + Math.floor(Math.random() * 900));
}
