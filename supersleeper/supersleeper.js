$(document.body).mousemove(function() {
	chrome.runtime.sendMessage('user_activity');
});

$(document.body).keypress(function() {
	chrome.runtime.sendMessage('user_activity');
});
