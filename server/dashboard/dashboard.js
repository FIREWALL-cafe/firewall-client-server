var socket = io('https://' + location.host);
socket.on('translation', function(response) {
	console.log('Translation of “' + response.query + '” (' +
	            response.langFrom + '-' +
	            response.langTo + '): ' + response.result);
});

$.get('/index.json', function(index) {
	if (index.ok && index.images) {
		console.log(index.images);
		$.each(index.images, function(i, imageSet) {
			setupImagesContainer(imageSet.query, imageSet.query_zh, true);
			if (imageSet.google) {
				addSourceImages(imageSet.query, 'google', imageSet.google);
			}
			if (imageSet.baidu) {
				addSourceImages(imageSet.query, 'baidu', imageSet.baidu);
			}
		});
		$("img").unveil(200, function() {
			$(this).load(function() {
				this.style.opacity = 1;
			});
		});
	} else if (index.error) {
		console.log(index.error);
	}
});

socket.on('images-received', function(images) {
	console.log('Image records for query ' + images.query + ' from ' + images.source);
	if (images.source == 'baidu') {
		console.log('query_zh = ' + images.query_zh);
	}
	var urls = JSON.parse(images.images);
	var $container = setupImagesContainer(images.query, images.query_zh);
	addSourceImages(images.query, images.source, urls);
	$container.find('img').unveil(200, function() {
		$(this).load(function() {
			this.style.opacity = 1;
		});
	});
});

function setupImagesContainer(query_en, query_zh, appendHTML) {
	var id = getImageContainerId(query_en);
	if ($('#' + id).length == 0) {
		var html =
			'<div id="' + id + '" class="image-set">' +
				'<div class="container">' +
					'<div class="google hidden">' +
						'<h2>Google: ' + query_en + '</h2>' +
						'<div class="images"></div>' +
					'</div>' +
					'<div class="baidu hidden">' +
						'<h2>Baidu: ' + query_zh + '</h2>' +
						'<div class="images"></div>' +
					'</div>' +
				'</div>' +
			'</div>'
		);
		if (appendHTML) {
			$('#images').append(html);
		} else {
			$('#images').prepend(html);
		}
	}
	return $('#' + id);
}

function getImageContainerId(query) {
	var id = 'images-' + query.replace(/\W+/g, '-');
	return id;
}

function addSourceImages(query, source, urls) {
	var imagesHTML = '';
	$.each(urls, function(i, url) {
		url = decodeURIComponent(url);
		url = decodeURIComponent(url);
		imagesHTML += '<img src="/placeholder.png" data-src="' + url + '" alt="">';
	});
	var containerId = getImageContainerId(query);
	$('#' + containerId + ' .' + source + ' .images').html(imagesHTML);
	$('#' + containerId + ' .' + source).removeClass('hidden');
}
