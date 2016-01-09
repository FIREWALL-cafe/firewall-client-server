var config = require('./config');
var spreadsheetServiceKey = require('./service-key.json');

var fs = require('fs');
var app = require('http').createServer(httpRequest);
var https = require('https');
var io = require('socket.io')(app);

var GoogleSpreadsheet = require('google-spreadsheet');
var spreadsheet = new GoogleSpreadsheet(config.spreadsheetId);
var babelFish = {};

console.log('Starting Boxian on port ' + config.port);
app.listen(config.port);
spreadsheet.useServiceAccountAuth(spreadsheetServiceKey, loadSpreadsheet);

io.on('connection', function(socket) {
	socket.on('translate', function(search) {
		getTranslation(search, function(err, translation) {
			if (err) {
				console.log(err);
			} else {
				console.log('Translation (' + search.langFrom + '-' + search.langTo + '): ' + translation);
				io.emit('translation', {
					query: search.query,
					langFrom: search.langFrom,
					langTo: search.langTo,
					result: translation
				});
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
				for (var i = 0; i < info.worksheets.length; i++) {
					loadWorksheet(info.worksheets[i]);
				}
			}
		});
	}
}

function loadWorksheet(worksheet) {
	var langMode = worksheet.title;
	if (!babelFish[langMode]) {
		babelFish[langMode] = {
			lookup: {},
			worksheet: worksheet
		};
	}
	var langLookup = babelFish[langMode].lookup;
	worksheet.getRows(function(err, rows) {
		if (err) {
			console.log(err);
		}
		var query;
		for (var i = 0; i < rows.length; i++) {
			query = rows[i].query;
			langLookup[query] = rows[i];
		}
		console.log('Loaded ' + rows.length + ' records from ' + langMode);
	});
}

function updateSpreadsheet(search, translation) {
	var query = search.query.toLowerCase();
	var langFrom = search.langFrom;
	var langTo   = search.langTo;
	var langMode = langFrom + '-' + langTo;
	if (!babelFish[langMode]) {
		// TODO: create new worksheet
	}
	babelFish[langMode].worksheet.addRow({
		query: query,
		google: translation,
		override: ''
	});
}

function getTranslation(search, callback) {
	var query = search.query.toLowerCase();
	var langFrom = search.langFrom;
	var langTo   = search.langTo;
	var langMode = langFrom + '-' + langTo;
	console.log('Translate “' + query + '” ' + langMode);
	if (babelFish[langMode] &&
	    babelFish[langMode].lookup[query]) {
		var translations = babelFish[langMode].lookup[query];
		if (translations.override) {
			callback(null, translations.override);
			return true;
		} else if (translations.google) {
			callback(null, translations.google);
			return true;
		}
	}
	googleTranslate(search, function(err, translation) {
		if (err) {
			console.log(err);
		} else {
			setTranslation(search, translation);
			callback(null, translation);
		}
	});
	return false;
}

function setTranslation(search, translation) {
	var query = search.query.toLowerCase();
	var langFrom = search.langFrom;
	var langTo = search.langTo;
	var langMode = langFrom + '-' + langTo;
	if (!babelFish[langMode]) {
		babelFish[langMode] = {
			lookup: {}
		};
	}
	if (!babelFish[langMode].lookup[query]) {
		babelFish[langMode].lookup[query] = {
			query: query,
			google: translation,
			override: ''
		};
	} else {
		babelFish[langMode].lookup[query].google = translation;
	}
	updateSpreadsheet(search, translation);
}

function httpRequest(req, res) {
	fs.readFile(__dirname + '/index.html', function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
}

function googleTranslate(search, callback) {
	var query = search.query.toLowerCase();
	var langFrom = search.langFrom;
	var langTo = search.langTo;
	var url = 'https://www.googleapis.com/language/translate/v2' +
	          '?key=' + config.key +
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
