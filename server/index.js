var config = require('./config');
var spreadsheetServiceKey = require('./service-key.json');

var _ = require('lodash');
var fs = require('fs');
var mime = require('mime');
var url = require('url');
var path = require('path');
var http = require('http');
var https = require('https');
var qs = require('querystring');
var GoogleSpreadsheet = require('google-spreadsheet');

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
app.listen(config.port);
spreadsheet.useServiceAccountAuth(spreadsheetServiceKey, loadSpreadsheet);

function loadSpreadsheet(err) {
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
			console.log('Loaded ' + rows.length + ' records from ' + tab);
		}
	});
}

function getTranslation(search, callback) {
	var query = getNormalizedQuery(search);
	var tab = getSearchTab(search);
	console.log('Translate “' + query + '” (' + tab + ')');

	if (doc.sensitive.lookup[query]) {
		var sensitive = doc.sensitive.lookup[query];
		console.log('This is a sensitive term. Its translation is', sensitive.translated);

		callback(null, {
			query: search.query,
			source: 'sensitive',
			value: sensitive.translated
		});
		return true;
	} else if (doc[tab] &&
	           doc[tab].lookup[query]) {
		var translations = doc[tab].lookup[query];
		if (translations.override) {
			callback(null, {
				query: search.query,
				source: 'override',
				value: translations.override
			});
			return true;
		} else if (translations.google) {
			callback(null, {
				query: search.query,
				source: 'cached',
				value: translations.google
			});
			return true;
		}
	}
	googleTranslate(search, function(err, translation) {
		if (err) {
			console.log(err);
		} else {
			setTranslation(search, translation);
			callback(null, {
				query: search.query,
				source: 'google',
				value: translation
			});
		}
	});
	return false;
}

function setTranslation(search, translation) {
	var query = getNormalizedQuery(search);
	var tab = getSearchTab(search);
	if (!doc[tab]) {
		console.log('Warning: no worksheet for ' + tab + '.');
		doc[tab] = {
			lookup: {}
		};
	}
	if (!doc[tab].lookup[query]) {
		doc[tab].lookup[query] = {
			query: query,
			google: translation,
			override: null
		};
	} else {
		console.log('Warning: updating Google Translation for “' + query + '”');
		doc[tab].lookup[query].google = translation;
	}
	saveTranslation(search, translation);
}

function saveTranslation(search, translation) {
	var query = getNormalizedQuery(search);
	var tab = getSearchTab(search);
	if (!doc[tab] ||
	    !doc[tab].worksheet) {
		console.log('Warning: no worksheet for ' + tab);
		return;
	}
	doc[tab].worksheet.addRow({
		query: query,
		google: translation,
		override: ''
	});
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

function getSearchTab(search) {
	var langFrom = search.langFrom;
	var langTo   = search.langTo;
	return langFrom + ' to ' + langTo;
}

function httpRequest(req, res) {
	var responseHeaders = {
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Max-Age": 10,
		"Content-Type": "application/json"
	};
	var uri = url.parse(req.url).pathname;
	if (req.method == 'OPTIONS') {
		res.writeHead(200, responseHeaders);
		res.end();
	} else if (uri == '/detect-language') {
		handleDetectLanguage(req, res, responseHeaders);
	} else if (uri == '/translate') {
		handleTranslate(req, res, responseHeaders);
	} else if (uri == '/query') {
		handleQuery(req, res, responseHeaders);
	} else if (uri == '/submit-images') {
		handleImages(req, res, responseHeaders);
	} else if (uri == '/images') {
		handleIndex(req, res, responseHeaders);
	} else {
		handleDashboard(req, res);
	}
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

function handleDetectLanguage(req, res, headers) {
	var query = url.parse(req.url).query;
	var search = qs.parse(query);
	console.log('Detect language: ' + search.query);
	detectLanguage(search, function(err, language) {
		if (err) {
			res.writeHead(500, headers);
			res.end(JSON.stringify({
				ok: 0,
				error: 'Error detecting language.',
				details: err
			}));
			console.log(err);
		} else {
			if (language != 'zh-CN' &&
			    language != 'zh-TW' &&
			    language != 'en') {
				language = 'en';
			}
			jsonResponse(res, search, headers, {
				ok: 1,
				language: language
			});
		}
	});
}

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
						details: err
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

function handleQuery(req, res, headers) {
	getPostData(req, function(data) {
		console.log('Query: ' + data.query);
		if (validateSharedSecret(data.secret, res, headers)) {
			console.log('Shared secret is valid.');
			detectLanguage(data, function(err, language) {
				if (err) {
					res.writeHead(500, headers);
					res.end(JSON.stringify({
						ok: 0,
						error: 'Error detecting language.',
						details: err
					}));
				} else {
					var translationSearch = {
						query: data.query,
						langFrom: language
					};
					if (language == 'en') {
						console.log('Language detected: English');
						console.log('Translating to simplified Chinese...');
						translationSearch.langTo = 'zh-CN';
					} else {
						console.log('Language detected:', language);
						console.log('Translating to English...');
						translationSearch.langTo = 'en';
					}

					getTranslation(translationSearch, function(err, translation) {
						if (err) {
							res.writeHead(500, headers);
							res.end(JSON.stringify({
								ok: 0,
								error: 'Error translating query.',
								details: err
							}));
						} else {
							console.log('Found ' + translation.source + ' translation ' +
							            '(' + translationSearch.langFrom + ' to ' + translationSearch.langTo + ') ' +
							            'for “' + translation.query + '”: ' + translation.value);
							jsonResponse(res, data, headers, {
								ok: 1,
								query: translationSearch.query,
								langFrom: translationSearch.langFrom,
								langTo: translationSearch.langTo,
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

function handleImages(req, res, headers) {
	getPostData(req, function(data) {
		console.log('Images: ' + data.google_query);
		if (validateSharedSecret(data.secret, res, headers)) {
			var images = {
				timestamp: data.timestamp,
				client: data.client,
				google_query: data.google_query,
				baidu_query: data.baidu_query,
				google_images: data.google_images,
				baidu_images: data.baidu_images
			};
			doc.images.worksheet.addRow(images, function(err) {
				if (err) {
					res.writeHead(500, headers);
					res.end(JSON.stringify({
						ok: 0,
						error: 'Error adding record to spreadsheet.',
						details: err
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
							details: e
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
					if (row.googlequery) {
						console.log('Error parsing row ' + row.googlequery);
					}
				}
				if (google_images && baidu_images) {
					images.push({
						timestamp: parseInt(row.timestamp),
						client: row.client,
						google_query: row.googlequery,
						baidu_query: row.baiduquery,
						google_images: google_images,
						baidu_images: baidu_images,
						remove: row.remove
					});
				}
			});
			output.images = images;
			jsonResponse(res, data, headers, output);
		}

	});
}

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

function detectLanguage(search, callback) {
	var query = getNormalizedQuery(search);
	console.log('Detecting language for normalized query:', query);

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
				var language = response.data.detections[0][0].language;
				callback(null, language);
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

function googleTranslate(search, callback) {
	var query = getNormalizedQuery(search);
	var langFrom = search.langFrom;
	var langTo = search.langTo;
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
			if (response &&
			    response.data &&
			    response.data.translations) {
				var translation = response.data.translations[0].translatedText;
				if (langTo == 'en') {
					translation = translation.toLowerCase();
				}
				translation.trim();
				translation.replace(/\s+/g, ' ');
				callback(null, translation);
			} else if (response &&
			           response.error) {
				callback(new Error('[' + response.error.code + '] ' + response.error.message));
			} else {
				callback(new Error('Something went wrong loading from Google Translate.'));
			}
		});
	}).on('error', function(err) {
		callback(err);
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
