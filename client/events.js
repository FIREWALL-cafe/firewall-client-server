console.log('loaded message listener');

chrome.runtime.onMessage.addListener(function(e) {
	console.log('background event', e);
	chrome.tabs.query({
		url: [
			"https://www.google.com/imghp*",
			"https://www.google.com/search?site=imghp*",
			"http://image.baidu.com/*",
			"https://image.baidu.com/*",
		]
	}, function(tabs) {
		if (e.type == 'images_saved') {
			for (var i = 0; i < tabs.length; i++) {
				if (tabs[i].url.substr(0, 23) == 'https://www.google.com/') {
					console.log('dispatching notification event to tab ' + i, e);
					chrome.tabs.sendMessage(tabs[i].id, {
						type: 'notification',
						message: e.message,
						permalink: e.permalink
					});
					break;
				}
			}
			chrome.tabs.create({
				url: e.permalink,
				active: false
			});
		} else if (e.type == 'toggle_input') {
			for (var i = 0; i < tabs.length; i++) {
				console.log('dispatching toggle_input event to tab ' + i, e);
				chrome.tabs.sendMessage(tabs[i].id, e);
			}
		}
	});
});

if (config.enableProxy) {
	chrome.proxy.settings.set({
		value: {
			mode: "fixed_servers",
			rules: {
				proxyForHttp: {
					scheme: "socks5",
					host: "127.0.0.1",
					port: 8888
				},
				proxyForHttps: {
					scheme: "socks5",
					host: "127.0.0.1",
					port: 8888
				},
				bypassList: ["*.baidu.com", "pi.firewallcafe.com"]
			}
		}, scope: 'regular'
	}, function() {
		console.log('proxy enabled');
	});
} else {
	chrome.proxy.settings.clear({
		scope: 'regular'
	}, function() {
		console.log('proxy cleared');
	});
}
