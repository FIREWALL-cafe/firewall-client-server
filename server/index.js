var config = require('./config');
var spreadsheetServiceKey = require('./service-key.json');

/*

Testing one-liners:
https://localhost:4430/detect-language?query=toast
https://localhost:4430/detect-language?query=%E5%90%90%E5%8F%B8 (zh-TW "toast")

*/

var _ = require('lodash');
var fs = require('fs');
var mime = require('mime');
var url = require('url');
var path = require('path');
var http = require('http');
var https = require('https');
var qs = require('querystring');
var GoogleSpreadsheet = require('google-spreadsheet');
var ISO6391 = require('iso-639-1');
var BCP47 = require('bcp-47');

if (config.port == 80 ||
    !config.sslCert) {
	var app = http.createServer(httpRequest);
} else {
	var options = {
		key: fs.readFileSync(config.sslKey),
		cert: fs.readFileSync(config.sslCert)
	};
	var app = https.createServer(options, httpRequest);
}
var io = require('socket.io')(app);
var spreadsheet = new GoogleSpreadsheet(config.spreadsheetId);

// Store a locally cached copy of the Google Spreadsheet
var doc = {};

console.log('Starting translation server on port ' + config.port);
consoleLogDivider();

app.listen(config.port);
spreadsheet.useServiceAccountAuth(spreadsheetServiceKey, loadSpreadsheet);

/////// ROUTING ///////

function httpRequest(req, res) {
	var responseHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Max-Age": 10,
		"Content-Type": "application/json"
	};

	if (req.method == 'OPTIONS') {
		res.writeHead(200, responseHeaders);
		res.end();
	} else {
		var uri = url.parse(req.url).pathname;
		switch (uri) {
			case '/detect-language':
				handleDetectLanguage(req, res, responseHeaders);
				break;
			case '/translate':
				handleTranslate(req, res, responseHeaders);
				break;
			case '/query':
				handleQuery(req, res, responseHeaders);
				break;
			case '/submit-images':
				handleImages(req, res, responseHeaders);
				break;
			case '/images':
				handleIndex(req, res, responseHeaders);
				break;
			case '/test-wp-api':
				wp.posts().create({
					title: 'Test from Node',
					content: 'Test content from Node',
				})
				.then(function(response) {
					console.log(response);
				}).catch(function(error) {
					console.log(error);
				});
				break;
			default:
				handleDashboard(req, res);
		}
	}
}

/////// SPREADSHEET ///////

function loadSpreadsheet(err) {
	console.log('Loading the spreadsheet...');
	if (err) {
		console.log(err);
	} else {
		spreadsheet.getInfo(function(err, info) {
			if (err) {
				console.log(err);
			} else {
				_.each(info.worksheets, loadWorksheet);
			}
		});
	}
}

function loadWorksheet(worksheet) {
	var tab = worksheet.title.trim();

	if (!doc[tab]) {
		doc[tab] = {
			id: worksheet.id,
			lookup: {},
			worksheet: worksheet
		};
	}

	var tabLookup = doc[tab].lookup;

	worksheet.getRows(function(err, rows) {
		if (err) {
			console.log(err);
		} else {
			_.each(rows, function(row) {
				var query = getNormalizedQuery(row);
				tabLookup[query] = row;
			});
			console.log('Loaded ' + rows.length + ' records from ' + tab + '.');
		}
	});
}

/////// SEARCH ////////

function handleQuery(req, res, headers) {
	getPostData(req, function(data) {
		var query = data.query;

		consoleLogDivider();
		consoleLogDivider();
		consoleLogDivider();
		console.log(query.toUpperCase());
		console.log('Searched using', data.searchEngine);

		if (validateSharedSecret(data.secret, res, headers)) {
			detectLanguage(data, function(err, detections) {
				if (err) {
					res.writeHead(500, headers);
					res.end(JSON.stringify({
						ok: 0,
						error: 'Error detecting language.',
						details: err.toString()
					}));
				} else {

					var translationSearch = setupTranslation(query, detections);
					consoleLogDivider();

					getTranslation(translationSearch, function(err, translation) {
						if (err) {

							res.writeHead(500, headers);
							res.end(JSON.stringify({
								ok: 0,
								error: 'Error translating query.',
								details: err.toString()
							}));

						} else {
							jsonResponse(res, data, headers, {
								ok: 1,
								query: translationSearch.query,
								searchEngine: data.searchEngine,
								langFrom: translationSearch.langFrom,
								langTo: translationSearch.langTo,
								langConfidence: translationSearch.langConfidence,
								langAlternate: translationSearch.langAlternate,
								langName: translationSearch.langName,
								translated: translation.value
							});
						}
					});
				}
			});
		} else {
			console.log('Shared secret is not valid.');
		}
	});
}

/////// TRANSLATION ////////

function handleTranslate(req, res, headers) {
	getPostData(req, function(search) {
		console.log('Translate: ' + search.query + ' from ' + search.langFrom + ' to ' + search.langTo);

		if (validateSharedSecret(search.secret, res, headers)) {
			getTranslation(search, function(err, translation) {
				if (err) {
					res.writeHead(500, headers);
					res.end(JSON.stringify({
						ok: 0,
						error: 'Error translating query.',
						details: err.toString()
					}));
				} else {
					console.log('Found ' + translation.source + ' translation ' +
					            '(' + search.langFrom + ' to ' + search.langTo + ') ' +
					            'for “' + translation.query + '”: ' + translation.value);
					jsonResponse(res, search, headers, {
						ok: 1,
						query: search.query,
						langFrom: search.langFrom,
						langTo: search.langTo,
						translated: translation.value
					});
				}
			});
		}
	});
}

function setupTranslation(query, detections) {
	var language = detections.language;
	var translationSearch = {
		query: query,
		langFrom: language,
		langConfidence: detections.confidence,
		langAlternate: detections.alternate,
		langName: detections.languageName,
	};

	// Simplified or traditional Chinese queries are translated to English.
	// Queries in all other languages are translated to simplified Chinese.
	if (isChinese( language)) {
		console.log('Language detected:', getDialect(language), 'Chinese');

		console.log('Will translate to English!');
		translationSearch.langTo = 'en';

	} else {
		var lang = isEnglish(language) ? 'English' : language;
		console.log('Language detected:', lang);

		if (translationSearch.langAlternate) {
			console.log('Alternatively, Google says the language might be:', translationSearch.langAlternate);
		} else {
			console.log('Google is reasonably confident about this.');
		}

		console.log('Will translate to simplified Chinese!');
		translationSearch.langTo = 'zh-CN';
	}

	return translationSearch;
}

function getTranslation(search, callback) {
	var query = getNormalizedQuery(search);
	var tab = doc['translations'],
		sensitive = doc.sensitive.lookup[query],
		inSheet = false,
		source,
		value;

	console.log('Translating “' + query + '"...');

	if (sensitive) {

		value = sensitive.translated;
		source = 'sensitive';
		inSheet = true;

		console.log('This is a sensitive term. Its translation is', value);

	} else if (tab && tab.lookup[query]) {

		var translations = tab.lookup[query];
		inSheet = true;
		console.log('We already have this term in our translations spreadsheet.');

		if (translations.override) {

			value = translations.override;
			source = 'override';

			console.log('It\'s been manually overridden with the following translation:', value);

		} else if (translations.google) {

			value = translations.google;
			source = 'cached';

			console.log('The cached translation is:', translations.google);
		}
	}

	if (inSheet) {
		consoleLogDivider();

		callback(null, {
			query: search.query,
			source: source,
			value: value
		});

		return inSheet;
	}

	googleTranslate(search, function(err, translation) {
		if (err) {
			console.log(err);
		} else {

			inSheet = false;
			setTranslation(search, translation);

			callback(null, {
				query: search.query,
				source: 'google',
				value: translation,
				langFrom: search.langFrom,
				langTo: search.langTo,
				langConfidence: search.langConfidence,
				langAlternate: search.langAlternate,
				langName: search.langName,
			});
		}
	});

	return inSheet;
}

function googleTranslate(search, callback) {
	console.log('This is a new query! Consulting Google...');

	var query = getNormalizedQuery(search),
		langFrom = search.langFrom,
		langTo = search.langTo;

	var url = 'https://www.googleapis.com/language/translate/v2' +
	          '?key=' + config.apiKey +
	          '&q=' + encodeURIComponent(query) +
	          '&source=' + langFrom +
	          '&target=' + langTo;

	https.get(url, function(res) {
		var data = '';
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', function() {
			var response = JSON.parse(data);
			if (response && response.data && response.data.translations) {

				var translation = response.data.translations[0].translatedText;

				if (!isChinese(langTo)) {
					translation = translation.toLowerCase();
				} // Will this work for all other languages? Guessing no. - RN

				translation.trim();
				translation.replace(/\s+/g, ' ');

				callback(null, translation);

			} else if (response && response.error) {

				callback(new Error('[' + response.error.code + '] ' + response.error.message));

			} else {

				callback(new Error('Something went wrong loading from Google Translate.'));

			}
		});
	}).on('error', function(err) {
		callback(err);
	});
}

function setTranslation(search, translation) {
	console.log('Google says:', translation);

	var query = getNormalizedQuery(search),
		tab = doc['translations'];

	if (!tab.lookup[query]) {
		tab.lookup[query] = {
			query: query,
			google: translation,
			langFrom: search.langFrom,
			langTo: search.langTo,
			langConfidence: search.langConfidence,
			langAlternate: search.langAlternate,
			langName: search.langName,
			override: null,
		};
	} else {
		console.log('')
	}

	saveTranslation(search, translation);
}

function saveTranslation(search, translation) {
	console.log('Saving this translation...');
	consoleLogDivider();

	var query = getNormalizedQuery(search),
		tab = doc['translations'];

	tab.worksheet.addRow({
		query: query,
		google: translation,
		override: '',
		langFrom: search.langFrom,
		langTo: search.langTo,
		langConfidence: search.langConfidence,
		langAlternate: search.langAlternate,
		langName: search.langName,
	});
}

//////// LANGUAGE DETECTION ////////

function handleDetectLanguage(req, res, headers) {
	var query = url.parse(req.url).query;
	var search = qs.parse(query);

	detectLanguage(search, function(err, detections) {
		if (err) {
			res.writeHead(500, headers);
			res.end(JSON.stringify({
				ok: 0,
				error: 'Error detecting language.',
				details: err.toString()
			}));
			console.log(err);
		} else {
			jsonResponse(res, search, headers, {
				ok: 1,
				language: detections.language,
				confidence: detections.confidence,
				alternate: detections.alternate,
				name: detections.languageName,
			});
		}
	});
}

function detectLanguage(search, callback) {

	var query = getNormalizedQuery(search);
	console.log('Normalized query:', query);
	consoleLogDivider();

	console.log('Detecting language...');

	var url = 'https://www.googleapis.com/language/translate/v2/detect' +
	          '?key=' + config.apiKey +
	          '&q=' + encodeURIComponent(query);

	https.get(url, function(res) {
		var data = '';
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			data += chunk;
		});
		res.on('end', function() {
			var response = JSON.parse(data);
			if (response &&
			    response.data &&
			    response.data.detections) {

				var detections = {
					language: response.data.detections[0][0].language,
					confidence: response.data.detections[0][0].confidence,
					alternate: null
				};

				// If there's another language possibility, note it for user review.
				if (detections.confidence < 1 && response.data.detections.length > 1) {
					detections.alternate = response.data.detections[1][0].language;
				}

				detections.languageName = getLanguageName(detections.language);

				callback(null, detections); // Send more data about language detection.
			} else if (response &&
			           response.error) {
				callback(new Error('[' + response.error.code + '] ' + response.error.message));
			} else {
				callback(new Error('Something went wrong loading from Google Translate.'));
			}
		});
	}).on('error', function(err) {
		console.log('Error detecting language.');
		console.log(err);
		callback(err);
	});
}

function getLanguageName(langCode) {
	if (ISO6391.validate(langCode)) {
		return ISO6391.getName(langCode);
	} else {
		var langInfo = BCP47.parse(langCode);
		if (ISO6391.validate(langInfo.language)) {
			var name = ISO6391.getName(langInfo.language);
			if (name == 'Chinese') {
				if (langInfo.region == 'CN') {
					name += ' (Simplified)';
				} else if (langInfo.region == 'TW') {
					name += ' (Traditional)';
				}
			}
			return name;
		} else {
			return langCode;
		}
	}
}

//////// IMAGES /////////

function handleImages(req, res, headers) {
	getPostData(req, function(data) {
		console.log('Images: ' + data.google_query);
		if (validateSharedSecret(data.secret, res, headers)) {
			var images = {
				timestamp: data.timestamp,
				client: data.client,
				search_engine: data.search_engine,
				query: data.query,
				translated: data.translated,
				google_images: data.google_images,
				baidu_images: data.baidu_images,
				lang_to: data.lang_to,
				lang_from: data.lang_from,
				lang_confidence: data.lang_confidence,
				lang_alternate: data.lang_alternate,
			};

			// Add row to Google spreadsheet.
			doc.images.worksheet.addRow(images, function(err) {
				if (err) {
					res.writeHead(500, headers);
					res.end(JSON.stringify({
						ok: 0,
						error: 'Error adding record to spreadsheet.',
						details: err.toString()
					}));
				} else {
					try {
						images.timestamp = parseInt(images.timestamp);
						images.google_images = JSON.parse(images.google_images);
						images.baidu_images = JSON.parse(images.baidu_images);
						io.emit('images-received', images);
						res.writeHead(200, headers);
						res.end(JSON.stringify({
							ok: 1
						}));
					} catch(e) {
						res.writeHead(500, headers);
						res.end(JSON.stringify({
							ok: 0,
							error: 'Error adding record to spreadsheet.',
							details: e.toString()
						}));
					}
				}
			});
		}
	});
}

function handleIndex(req, res, headers) {
	spreadsheet.getRows(doc.images.id, function(err, rows) {
		var output = {};
		if (err) {
			res.writeHead(500, headers);
			output.ok = 0;
			output.error = 'Error getting rows: ' + err;
			res.end(JSON.stringify(output));
		} else {
			var query = url.parse(req.url).query;
			var data = qs.parse(query);
			var images = [];
			output.ok = 1;
			_.each(rows, function(row) {
				try {
					var google_images = JSON.parse(row.googleimages);
					var baidu_images = JSON.parse(row.baiduimages);
				} catch (e) {
					if (row.query) {
						console.log('Error parsing row ' + row.query);
					}
				}
				if (google_images || baidu_images) {
					images.push({
						timestamp: parseInt(row.timestamp),
						client: row.client,
						search_engine: row.searchengine,
						query: row.query,
						translated: row.translated,
						google_images: google_images,
						baidu_images: baidu_images,
						lang_from: row.langfrom,
						lang_to: row.langto,
						lang_confidence: row.langconfidence,
						lang_alternate: row.langalternate,
						lang_name: row.langname,
						remove: row.remove
					});
				}
			});
			output.images = images;
			jsonResponse(res, data, headers, output);
		}

	});
}

//////// DASHBOARD ////////

function handleDashboard(req, res) {
	var uri = url.parse(req.url).pathname;
	var filename = path.join(process.cwd() + '/dashboard', uri);
	fs.exists(filename, function(exists) {
		if (!exists) {
			res.writeHead(404, {"Content-Type": "text/plain"});
			res.write("404 Not Found\n");
			res.end();
			return;
		}
		if (fs.statSync(filename).isDirectory()) {
			filename += '/index.html';
		}
		fs.readFile(filename, "binary", function(err, file) {
			if (err) {
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.write(err + "\n");
				res.end();
				return;
			}
			res.writeHead(200, {
				"Content-Type": mime.lookup(filename)
			});
			res.write(file, "binary");
			res.end();
		});
	});
}

//////// UTILITIES /////////

function validateSharedSecret(secret, res, headers) {
	if (secret != spreadsheetServiceKey.private_key_id) {
		res.writeHead(401, headers);
		res.end(JSON.stringify({
			ok: 0,
			error: 'Shared secret did not match.'
		}));
		return false;
	}
	return true;
}

var getPostData = function(req, callback) {
	var body = '';
	req.on('data', function (data) {
		body += data;
	});

	req.on('end', function () {
		callback(qs.parse(body));
	});
}

function jsonResponse(res, data, headers, json) {
	var response = JSON.stringify(json);
	if (data.callback) {
		headers['Content-Type'] = 'text/javascript';
		response = data.callback + '(' + response + ');';
	}
	res.writeHead(200, headers);
	res.end(response);
}

function consoleLogDivider() {
	console.log('=======================================');
}

function getNormalizedQuery(search) {
	if (search && search.query) {
		var normalized = search.query.toLowerCase().trim();
		normalized = normalized.replace(/\s+/g, ' ');
		return normalized;
	} else {
		return '';
	}
}

function isChinese(language) {
	return (language == 'zh-CN' || language == 'zh-TW');
}

function isEnglish(language) {
	return (language == 'en');
}

function getDialect(language) {
	return language == 'zh-CN' ? 'simplified' : 'traditional';
}

function getSearchTab(search) {
	return search.langFrom + ' to ' + search.langTo;
}

