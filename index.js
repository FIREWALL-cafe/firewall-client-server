var app = require('http').createServer(handler);
var https = require('https');
var io = require('socket.io')(app);
var fs = require('fs');
var config = require('./config');

app.listen(5432);

function handler (req, res) {
	fs.readFile(__dirname + '/index.html', function (err, data) {
		if (err) {
			res.writeHead(500);
			return res.end('Error loading index.html');
		}

		res.writeHead(200);
		res.end(data);
	});
}

io.on('connection', function (socket) {
	socket.on('translate', function(query, callback) {
		console.log('Translate: ' + query);
		var url = 'https://www.googleapis.com/language/translate/v2?key=' + config.key +
		          '&source=en&target=es&q=' + encodeURIComponent(query);
		https.get(url, function(res) {
			var data = '';
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				data += chunk;
			});
			res.on('end', function() {
				callback(data);
			});
		}).on('error', function(e) {
			console.log("Error: " + e.message);
			callback('Error: ' + e.message);
		});
  });
});
