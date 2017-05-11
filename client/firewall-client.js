var storage = chrome.storage.local;

var clientId = randomClientId();
var pendingQuery = {};
var query = null;

var ignoreSubmit = false;
var ignorePending = false;
var getImagesTimeout = null;
var autocompleteEnabled = true;

var $googleInput = $('#lst-ib');

storage.get([
	'clientId',
	'pendingQuery',
	'autocompleteEnabled'
], function(stored) {

	// Get or set the client ID.
	if (stored.clientId) {
		clientId = stored.clientId;
	} else {
		storage.set({
			clientId: clientId
		});
	}

	console.log('Firewall Cafe | ' + clientId);
	console.log('Server: ' + config.serverURL);

	// Get user autocomplete preference.
	if (stored.autocompleteEnabled) {
		autocompleteEnabled = (stored.autocompleteEnabled == 'on');
	}

	if (autocompleteEnabled) {
		console.log('Autocomplete enabled.');
	} else {
		console.log('Autocomplete disabled.');
	}

	// Check for a pending query in storage and set it.
	if (stored.pendingQuery) {
		pendingQuery = stored.pendingQuery;
		if (pendingQuery.query) {
			console.log('Stored pending query: ' + pendingQuery.query);
		} else {
			console.log('No stored pending query. Starting fresh.');
		}
	} else {
		console.log('No stored pending query. Starting fresh.');
	}

	setupUI();
	setupStorageListener();
	checkPendingQuery();
	setupInterval();
});

function setupUI() {
	console.log('Setting up UI...');

	var $firewallShow = $('#firewall-show'),
		 $firewallForm = $('#firewall-form'),
		 $firewallClientId = $('#firewall-client-id'),
		 $firewallSuggest = $('#firewall-suggest')[0],
		 $body = $(document.body);

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

	$firewallShow.click(function(e) {
		e.preventDefault();
		$firewallForm.toggleClass('visible');
	});

	// On Firewall form submit, update user preferences.
	$firewallForm.submit(function(e) {
		e.preventDefault();
		clientId = $firewallClientId.val();
		autocompleteEnabled = $firewallSuggest.checked;
		var autocompleteStatus = (autocompleteEnabled ? 'on' : 'off');

		storage.set({
			clientId: clientId,
			autocompleteEnabled: autocompleteStatus
		}, function() {
			console.log('Changing settings...');
			console.log('Firewall client: ' + clientId);
			console.log('Autocomplete: ' + autocompleteStatus);
			$firewallForm.removeClass('visible');
		});

		if (autocompleteEnabled) {
			$googleInput.autocomplete({
				source: sensitiveQueries
			});
			$googleInput.autocomplete('enable');
			$body.addClass('firewall-autocomplete');
		} else {
			$googleInput.autocomplete('disable');
			$body.removeClass('firewall-autocomplete');
		}
	});

	// Set initial autocomplete preferences.
	if (autocompleteEnabled) {
		$googleInput.autocomplete({
			source: sensitiveQueries
		});
		$body.addClass('firewall-autocomplete');
	}
}

function setupInterval() {
	console.log('Setting up URL checking interval...');
	setInterval(function() {
		checkURLQuery();
	}, 100);
}

function setupStorageListener() {
	console.log('Setting up storage listener...');

	// Listen to chrome storage for changes.
	chrome.storage.onChanged.addListener(function(changes, area) {

		// Ignore changes that aren't happening in local storage.
		if (area != 'local') {
			return;
		}

		// If the client performs a search and saves results to storage,
		// update the pending query with the incoming data.
		if (changes.pendingQuery) {
			pendingQuery = $.extend(pendingQuery, changes.pendingQuery.newValue);
			checkPendingQuery();
			checkPendingImages();
		}
	});
}

function checkPendingQuery() {
	if (pendingQuery.query) {
		console.log("Pending query: ");
		console.log(pendingQuery);
	}

	// If we're ignoring incoming query data because we're in the middle of handling a query, move on.
	if (ignorePending) {
		console.log('Ignoring pending queries.');
		return;
	}

	// Look at the URL query string to get the search term.
	var queryMatch = getQueryMatch();
	if (queryMatch) {
		console.log('URL search term is:', queryMatch);
	}

	// Timestamp this query.
	var currTime = (new Date()).getTime();

	// If the search term is the translation of an original search term, move on.
	if (pendingQuery &&
	    pendingQuery.translated &&
	    pendingQuery.translated == queryMatch) {
		// We've just searched for this one, let getImages take it from here
		console.log('Already getting these images.');
		return;
	} else if (pendingQuery &&
	           pendingQuery.timestamp &&
	           currTime - pendingQuery.timestamp > 60 * 1000) {
		// Pending queries expire after 1 min.
		// If the query has expired, reset everything.
		console.log('Query has expired.');
		pendingQuery = {};
		storage.set({
			pendingQuery: {}
		}, function() {
			console.log('Reset query.');
		});
	} else if (pendingQuery.query &&
	           pendingQuery.searchEngine != getSource()) {
		// If the origin of the search was in the other search engine,
		// start a search for the term in the current search engine.
		console.log('Found a pending query from', pendingQuery.source, ':', pendingQuery.query);
		ignorePending = true;
		searchPendingQuery();
	}
}

function checkURLQuery() {
	// Look at the URL query string to find the search term.
	var queryMatch = getQueryMatch();

	// If there's nothing that looks like a search term in the URL, keep polling.
	if (!queryMatch) {
		return;
	}

	if (ignoreSubmit) {
		query = queryMatch;
		ignoreSubmit = false;
		return;
	}

	// If the URL search term is not the query, that means we're about to start handling
	// a new search.
	if (queryMatch != query) {

		// Update the query.
		query = queryMatch;
		if (!query) {
			return;
		}

		console.log('Detected a', getSource(),'search: ' + query);
		var timestamp = (new Date().getTime());

		// Check to see if the ongoing query has any history.
		var isPending = checkPending(query);

		// If the primary search term is pending and is the original "source" search term,
		// just continue along.
		if (isPending == 'source') {
			console.log('Query is already pending');
			return;
		} else if (isPending == 'translated') {
			// If the primary search term is pending and is the translation of an original search,
			// start ignoring subsequent pending queries and begin getting images.
			console.log('Translation: ' + pendingQuery.translated);
			ignorePending = true;
			startGettingImages();
		} else {
			// If neither search is in progress,
			// start the first query for images.
			startQuery(query, function(result) {
				console.log('Translated query: ' + result.translated);
				pendingQuery = $.extend(result, {
					timestamp: timestamp,
					googleImages: null,
					baiduImages: null
				});

				storage.set({
					pendingQuery: pendingQuery
				}, function() {
					console.log('Saved query to pending: ' + result.query);
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
		searchEngine: getSource(),
		secret: config.sharedSecret
	};
	$.ajax({
		url: config.serverURL + 'query',
		method: 'POST',
		data: data
	}).done(function(result) {
		console.log(result);
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
	console.log('Searching for', pendingQuery.translated, '(translation of', pendingQuery.query, ') in', getSource());
	// var inputQuery = 'input[name=q], input[name=word]';
	// if ($(inputQuery).length == 0 ||
	//     $(inputQuery).first().closest('form').length == 0) {
	// 	console.log('Could not find form input, giving up.');
	// 	ignorePending = false;
	// 	return;
	// }
	var $inputField = findInputField();

	$inputField.val(pendingQuery.translated);
	// $(inputQuery).first().val(pendingQuery.translated);

	// var $form = $inputField.first().closest('form');
	// var $form = $(inputQuery).first().closest('form');
	ignoreSubmit = true;
	$inputField.first().closest('form').submit();
}

function findInputField() {
	var inputField = 'input[name=q], input[name=word]',
		$inputField = $(inputField);
	if ($inputField.length == 0 || $inputField.first().closest('form').length == 0) {
		console.log('Could not find form input. Giving up.');
		ignorePending = false;
		return;
	}
	return $inputField.first();
}

function getImages() {
	if (!pendingQuery || !pendingQuery.query) {
		return;
	}

	var imagesKey = getSource() + 'Images';
	var numImages = 20;
	var charLimit = 50000;

	console.log('Gathering', getSource(), 'images for ' + pendingQuery.query);

	function _dedupeLimitedSet(imageSet, image) {
		if (imageSet.length < numImages &&
			image.length < charLimit/numImages &&
			imageSet.indexOf(image) == -1) {
			imageSet.push(image);
		}
	}

	var images = [];
	$('.imglist img').each(function(i, img) {
		_dedupeLimitedSet(images, img.src);
	});
	$('#rg .rg_l').each(function(i, link) {
		var href = $(link).attr('href');
		if (!href) {
			return;
		}
		var src = href.match(/imgurl=([^&]+)/);

		if (src) {
			_dedupeLimitedSet(images, src[1]);
		}
	});

	if (images.length == 0) {
		// Set images key to show that we looked for images but came up empty.
		// Then let this run its course.
		pendingQuery[imagesKey] = 'empty';

		console.log('Still no images. Waiting 2 seconds and trying again.');
		startGettingImages();
		return;
	}

	console.log('Found ' + images.length + ' images from', getSource());
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
	if (pendingQuery && pendingQuery.googleImages && pendingQuery.baiduImages) {
		console.log('Image gathering complete.');

		if (pendingQuery.googleImages.length) {
			console.log('Looks like we have', pendingQuery.googleImages.length, 'images from Google!');
		} else {
			console.log('No image results from Google. :(');
		}

		if (pendingQuery.baiduImages.length) {
			console.log('Looks like we have', pendingQuery.baiduImages.length, 'images from Baidu!');
		} else {
			console.log('No image results from Baidu. :(');
		}

		// If we have results from both search engines, submit them ... annnd we're done
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

	return false;
}

function submitImages(callback) {
	var data = {
		timestamp: pendingQuery.timestamp,
		client: clientId,
		secret: config.sharedSecret,
		search_engine: pendingQuery.searchEngine,
		query: pendingQuery.query,
		translated: pendingQuery.translated,
		lang_from: pendingQuery.langFrom,
		lang_to: pendingQuery.langTo,
		lang_confidence: pendingQuery.langConfidence,
		lang_alternate: pendingQuery.langAlternate,
	};

	if (pendingQuery.googleImages == 'empty') {
		data.google_images = null;
	} else {
		data.google_images = JSON.stringify(pendingQuery.googleImages);
	}

	if (pendingQuery.baiduImages == 'empty') {
		data.baidu_images = null;
	} else {
		data.baidu_images = JSON.stringify(pendingQuery.baiduImages);
	}

	console.log('Sending draft post to WP.');
	var url = config.libraryURL;
	$.ajax({
		url: url,
		method: 'POST',
		data: data,
	}).done(function(){
		console.log('Done sending draft post to WP.');
	}).fail(function(xhr, textStatus) {
		console.log('Failed sending draft post to WP:', textStatus, '/', xhr.responseText);
	});

	// Send data back to server for entry into the Google spreadsheet.
	console.log('Saving images to spreadsheet');
	var url = config.serverURL + 'submit-images';
	$.ajax({
		url: url,
		method: 'POST',
		data: data
	}).done(function() {
		console.log('Done saving images to spreadsheet');
		callback();
	}).fail(function(xhr, textStatus) {
		console.log('Failed submitting images to library: ' + textStatus + ' / ' + xhr.responseText);
	});
}

// Looks at URL query string and extracts search term.
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
