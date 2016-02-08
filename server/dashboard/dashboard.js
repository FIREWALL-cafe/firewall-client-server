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
			showImageSet(imageSet);
		});
		loadImages($('img'));
	} else if (index.error) {
		console.log(index.error);
	}
});

socket.on('images-received', function(images) {
	$images = showImageSet(images);
	loadImages($images.find('img'));
});

function showImageSet(imageSet, appendHTML) {
	var id = getImageContainerId(imageSet.google_query);
	var timestamp = parseInt(imageSet.timestamp);
	var client = $("<div>").text(imageSet.client).html();
	var dateTime = new Date(timestamp).toLocaleString();
	if ($('#' + id).length == 0) {
		var html =
			'<div id="' + id + '" class="image-set">' +
				'<div class="container">' +
					'<h3 class="about">' + client + ', ' + dateTime + '</h3>' +
					'<div class="google">' +
						'<h2>Google: <strong>' + imageSet.google_query + '</strong></h2>' +
						'<div class="images">' + getImageHTML(imageSet.google_images) + '</div>' +
					'</div>' +
					'<div class="baidu">' +
						'<h2>Baidu: <strong>' + imageSet.baidu_query + '</strong></h2>' +
						'<div class="images">' + getImageHTML(imageSet.baidu_images) + '</div>' +
					'</div>' +
				'</div>' +
			'</div>';
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
	id = $("<div>").text(id).html();
	return id;
}

function getImageHTML(urls) {
	var imageHTML = '';
	$.each(urls, function(i, url) {
		url = decodeURIComponent(url);
		url = decodeURIComponent(url);
		url = $("<div>").text(url).html();
		imageHTML += '<img src="/placeholder.png" data-src="' + url + '" alt="" class="pending">';
	});
	return imageHTML;
}

function loadImages($query) {
	$query.unveil(200, function() {
		$(this).load(function() {
			this.style.opacity = 1;
			$(this).removeClass('pending');
		});
	});
}
