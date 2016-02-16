
var storage = chrome.storage.local;
var clientId = 'Client ' + (100 + Math.floor(Math.random() * 900));
var pendingQueries = [];

var query = null;
var ignoreSubmit = false;
var ignorePending = false;
var getImagesTimeout = null;

storage.get(['clientId', 'pendingQueries'], function(stored) {
	
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
	
	console.log('Firewall Cafe ' + clientId +
	            ' (' + pendingQueries.length + ' pending queries)');
	console.log('Server: ' + config.serverURL);
	
	setupUI();
	setupStorageListener();
	checkPendingQueries();
	setupInterval();
});

function setupUI() {
	$('#fsr, #lh, #ft').append(
		'<div id="firewall">' +
			'<a href="#firewall" id="firewall-show">Firewall</a>' +
			'<form action="." id="firewall-form">' +
				'<label>Client ID: <input name="client-id" id="client-id" value="' + clientId + '"></label>' +
				'<input type="submit" value="Save">' +
				'<input type="button" id="firewall-reset" value="Reset pending">' +
			'</form>' +
		'</div>'
	);

	$('#firewall-show').click(function(e) {
		e.preventDefault();
		$('#firewall-form').toggleClass('visible');
	});
	
	$('#firewall-reset').click(function(e) {
		e.preventDefault();
		pendingQueries = [];
		storage.set({
			pendingQueries: pendingQueries
		}, function() {
			console.log('Pending queries reset');
		});
		$('#firewall-form').toggleClass('visible');
	});

	$('#firewall-form').submit(function(e) {
		e.preventDefault();
		clientId = $('#client-id').val();
		storage.set({
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
	 }); 
}

function checkPendingQueries() {
	if (ignorePending) {
		return;
	}
	var pendingQuery;
	var queryMatch = getQueryMatch();
	var currTime = (new Date()).getTime();
	var expired = [];
	for (var i = 0; i < pendingQueries.length; i++) {
		pendingQuery = pendingQueries[i];
		if (pendingQuery.translated == queryMatch) {
			break;
		} else if (currTime - pendingQuery.timestamp > 60 * 1000) {
			// Pending queries expire after 1 min
			expired.push(i);
		} else if (pendingQuery.source != getSource()) {
			console.log('Found a pending query: ' + pendingQuery.query);
			ignorePending = true;
			searchPendingQuery(i);
			break;
		}
	}
	if (expired.length > 0) {
		for (var i = expired.length - 1; i > -1; i--) {
			console.log('Removing expired query ' + pendingQueries[i].query);
			var removed = pendingQueries.splice(i, 1);
		}
		storage.set({
			pendingQueries: pendingQueries
		}, function() {
			console.log('Done pruning expired queries');
		});
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

		var index = lookupPending(query);
		if (index == -2) {
			console.log('Query is already pending');
			return;
		} else if (index > -1) {
			console.log('Pending translation: ' + pendingQueries[index].translated);
			ignorePending = true;
			startGettingImages(index);
		} else {
			startQuery(query, function(result) {
				console.log('Translated the query: ' + result.translated);
				var pending = $.extend(result, {
					timestamp: timestamp,
					source: getSource(),
					googleImages: null,
					baiduImages: null
				});
				pendingQueries.push(pending);
				var index = pendingQueries.length - 1;
				storage.set({
					pendingQueries: pendingQueries
				}, function() {
					console.log('Saved pending index: ' + index);
				});
				startGettingImages(index);
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
	});;
}

function startGettingImages(index) {
	if (getImagesTimeout) {
		clearTimeout(getImagesTimeout);
		getImagesTimeout = null;
	}
	setTimeout(function() {
		getImages(index);
	}, 2000);
}

function lookupPending(query) {
	for (var i = 0; i < pendingQueries.length; i++) {
		if (pendingQueries[i].translated == query) {
			return i;
		} else if (pendingQueries[i].query == query) {
			return -2;
		}
	}
	return -1;
}

function searchPendingQuery(index) {
	var pending = pendingQueries[index];
	console.log('Searching for translated: ' + pending.translated);
	var inputQuery = 'input[name=q], input[name=word]';
	if ($(inputQuery).length == 0 ||
	    $(inputQuery).first().closest('form').length == 0) {
		console.log('Could not find form input, giving up.');
		ignorePending = false;
		return;
	}
	$(inputQuery).first().val(pending.translated);
	var $form = $(inputQuery).first().closest('form');
	ignoreSubmit = true;
	$form.submit();
}

function getImages(index) {
	var pending = pendingQueries[index];
	console.log('Gathering images: ' + pending.query);
	var images = [];
	$('.imglist img').each(function(i, img) {
		if (images.length < 20 &&
		    images.indexOf(img.src) == -1) {
			images.push(img.src);
		}
	});
	$('#rg .rg_l').each(function(i, link) {
		var href = $(link).attr('href');
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
		startGettingImages(index);
		return;
	}
	
	console.log('Found ' + images.length + ' images');
	var imagesKey = getSource() + 'Images';
	pending[imagesKey] = images;
	
	if (pending.googleImages &&
	    pending.baiduImages) {
		submitImages(pending, function() {
			console.log('Removing pending query');
			pendingQueries.splice(index, 1);
			storage.set({
				pendingQueries: pendingQueries
			}, function() {
				ignorePending = false;
			});
		});
	} else {
		pendingQueries[index] = pending;
		storage.set({
			pendingQueries: pendingQueries
		}, function() {
			ignorePending = false;
		});
	}
}

function submitImages(pending, callback) {
	var data = {
		timestamp: pending.timestamp,
		client: clientId,
		secret: config.sharedSecret,
		google_images: JSON.stringify(pending.googleImages),
		baidu_images: JSON.stringify(pending.baiduImages)
	};
	if (pending.source == 'google') {
		data.google_query = pending.query;
		data.baidu_query = pending.translated;
	} else {
		data.google_query = pending.translated;
		data.baidu_query = pending.query;
	}
	console.log('Submitting images', data);
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
