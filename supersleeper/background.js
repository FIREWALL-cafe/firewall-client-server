var sleepTimeout;

function resetTimeout() {
	if (sleepTimeout) {
		clearTimeout(sleepTimeout);
	}
	sleepTimeout = setTimeout(function() {
		resetTabs();
	}, config.timeoutMinutes * 60 * 1000);
}

chrome.runtime.onMessage.addListener(function(msg) {
	if (msg == 'user_activity') {
		resetTimeout();
	}
});
resetTimeout();

function setupExistingTab(url, tabId) {
	chrome.tabs.update(tabId, {
		url: url
	});
}

function setupNewTab(url, windowId) {
	chrome.tabs.create({
		windowId: windowId,
		url: url
	});
}

function resetTabs() {

	console.log('reset tabs!');

	chrome.tabs.query({
		url: ["http://*/*", "https://*/*"]
	}, function(tabs) {

		var resetTo = JSON.parse(JSON.stringify(config.resetTo));
		var windowIds = [];

		var active = [];
		var inactive = [];
		for (var i = 0; i < tabs.length; i++) {
			var tab = tabs[i];
			if (tab.active) {
				active.push(tab.id);
				windowIds.push(tab.windowId);
			} else {
				inactive.push(tab.id);
			}
		}

		// Close all the inactive tabs
		chrome.tabs.remove(inactive);

		// Reset the active tabs
		for (var i = 0; i < active.length; i++) {
			if (resetTo[i]) {
				var tabId = active[i];
				var url = resetTo[i].shift();
				setupExistingTab(url, tabId);
			}
		}

		// Add any additional tabs
		for (var i = 0; i < resetTo.length; i++) {
			var windowId = windowIds[i];
			for (var j = 0; j < resetTo[i].length; j++) {
				var url = resetTo[i][j];
				setupNewTab(url, windowId);
			}
		}
	});
}
