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
	console.log('Image records for query ' + images.query + ' from ' + images.source);
	console.log(images);
	setupImagesContainer(images);
	addSourceImages(images);
});

function setupImagesContainer(images) {
	var id = getImageContainerId(images.query);
	if ($('#' + id).length == 0) {
		$('#images').prepend(
			'<div id="images-' + getImageContainerId(images.query) + '">' +
				'<div class="google">' +
					'<div class="label">Google: ' + images.query + '</div>' +
					'<div class="images"></div>' +
				'</div>' +
				'<div class="baidu">' +
					'<div class="label">Baidu: ' + images.query + '</div>' +
					'<div class="images"></div>' +
				'</div>' +
			'</div>'
		);
	}
}

function getImageContainerId(query) {
	var id = 'images-' + query.replace(/\W+/g, '-');
}

function addSourceImages(images) {
	var imagesHTML = '';
	var urls = JSON.parse(images.images);
	$.each(urls, function(i, url) {
		var alt = images.query + ' ' + (i + 1);
		alt = alt.replace(/"/g, '&quot;');
		url = url.replace(/^http:/, '');
		imagesHTML += '<img src="' + url + '" alt="' + alt + '">';
	});
	var containerId = getImageContainerId(images.query);
	$('#' + containerId + ' .' + images.source + ' .images').html(imagesHTML);
}
