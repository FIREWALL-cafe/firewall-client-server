var socket = io('https://' + location.host);
function translate(query, langFrom, langTo) {
	var translate = {
		query: query,
		langFrom: langFrom,
		langTo: langTo
	};
	socket.emit('translate', translate, function(response) {
		console.log(response);
	});
}
socket.on('translation', function(response) {
	console.log('Translation of “' + response.query + '” (' +
	            response.langFrom + '-' +
	            response.langTo + '): ' + response.result);
});

socket.on('images-received', function(images) {
	console.log('Image record for query ' + images.query + ' from + ' + images.source);
	setupImagesContainer(images);
	addSourceImages(images);
});

function setupImagesContainer(images) {
	if ($('#images-' + images.query).length == 0) {
		$('#images').prepend(
			'<div id="images-' + images.query + '">' +
				'Query: ' + images.query +
				'<div class="google"></div>' +
				'<div class="baidu"></div>' +
			'</div>'
		);
	}
}

function addSourceImages(images) {
	var imagesHTML = '';
	var urls = JSON.parse(images.images);
	$.each(urls, function(i, url) {
		var alt = images.query + ' ' + (i + 1);
		imagesHTML += '<img src="' + url + '" alt="' + alt + '">';
	});
	$('#images-' + images.query + ' .' + images.source).html(imagesHTML);
}
