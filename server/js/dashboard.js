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

socket.on('image-record', function(images) {
	console.log('Image record for query ' + images.query);
	if ($('#images-' + images.query).length == 0) {
		var googleImages = getImages(images, 'google');
		var baiduImages = getImages(images, 'baidu');
		$('#images').append(
			'<div id="images-' + images.query + '">' +
				'Query: ' + images.query +
				'<div class="google">' + googleImages + '</div>' +
				'<div class="baidu">' + baiduImages + '</div>' +
			'</div>'
		);
	}
});

function getImages(images, id) {
	var imagesHTML = '';
	var urls = JSON.parse(images[id]);
	$.each(urls, function(i, url) {
		var alt = images.query + ' ' + (i + 1);
		imagesHTML += '<img src="' + url + '" alt="' + alt + '">';
	});
	return imagesHTML;
}
