var config = require('./config');
var spreadsheetServiceKey = require('./service-key.json');

var _ = require('lodash');
var fs = require('fs');
var mime = require('mime');
var url = require('url');
var path = require('path');
var https = require('https');
var GoogleSpreadsheet = require('google-spreadsheet');

var options = {
	key: fs.readFileSync(config.sslKey),
	cert: fs.readFileSync(config.sslCert)
};
var app = https.createServer(options, httpRequest);
var io = require('socket.io')(app);
var spreadsheet = new GoogleSpreadsheet(config.spreadsheetId);

// Store a locally cached copy of the Google Spreadsheet
var doc = {};

console.log('Starting translation server on port ' + config.port);
app.listen(config.port);
spreadsheet.useServiceAccountAuth(spreadsheetServiceKey, loadSpreadsheet);

io.on('connection', function(socket) {
	socket.on('search', function(search) {
		getTranslation(search, function(err, translation) {
			if (err) {
				console.log(err);
			} else {
				console.log('Found ' + translation.source + ' translation ' +
				            '(' + search.langFrom + ' to ' + search.langTo + ') ' +
				            'for “' + translation.query + '”: ' + translation.value);
				io.emit('translation', {
					query: search.query,
					langFrom: search.langFrom,
					langTo: search.langTo,
					result: translation.value
				});
			}
		});
  });
	socket.on('images', function(images) {
		console.log('Received images from ' + images.source + ' for ' + images.query);
		images.images = JSON.stringify(images.images);
		doc.images.worksheet.addRow(images, function(err) {
			if (err) {
				console.log(err);
			} else {
				io.emit('images-received', images);
			}
		});
	});
});

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
				var query = rows.query;
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
	if (doc[tab] &&
	    doc[tab].lookup[query]) {
		var translations = doc[tab].lookup[query];
		if (translations.override) {
			callback(null, {
				source: 'override',
				value: translations.override
			});
			return true;
		} else if (translations.google) {
			callback(null, {
				source: 'cached Google',
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
				source: 'Google API',
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
	return search.query.toLowerCase().trim();
}

function getSearchTab(search) {
	var langFrom = search.langFrom;
	var langTo   = search.langTo;
	return langFrom + ' to ' + langTo;
}

function httpRequest(req, res) {
	var uri = url.parse(req.url).pathname;
	if (uri == '/index.json') {
		outputIndex(req, res);
	} else {
		outputDashboard(req, res);
	}
}

function outputIndex(req, res) {
	spreadsheet.getRows(doc.images.id, function(err, rows) {
		var output = {};
		if (err) {
			res.writeHead(500, {"Content-Type": "application/json"});
			output.ok = 0;
			output.error = err.getMessage();
		} else {
			res.writeHead(200, {"Content-Type": "application/json"});
			output.ok = 1;
			var images = [];
			var queryLookup = {};
			_.each(rows, function(row) {
				var query = row.query;
				var imageSet;
				if (queryLookup[query]) {
					var index = queryLookup[query];
					imageSet = images[index];
				} else {
					var index = images.length;
					imageSet = {
						query: query
					};
					queryLookup[query] = index;
				}
				imageSet[row.source] = JSON.parse(row.images);
				images[index] = imageSet;
			});
			output.images = images;
		}
		res.end(JSON.stringify(output));
	});
}

function outputDashboard(req, res) {
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
				callback(null, response.data.translations[0].translatedText);
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
