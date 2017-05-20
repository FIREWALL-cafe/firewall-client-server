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
		if (e.type == 'images_loading') {
			for (var i = 0; i < tabs.length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, {
					type: 'images_loading'
				});
			}
		} else if (e.type == 'images_saved') {
			for (var i = 0; i < tabs.length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, {
					type: 'toggle_input',
					enabled: true
				});
			}
			if (e.permalink) {
				var url = e.permalink + '#images';
				chrome.tabs.create({
					url: url,
					active: false
				});
				var options = {
					type: 'basic',
					iconUrl: 'icons/firewall-128.png',
					title: e.title,
					message: e.message
				};
				var notification_id = url;
				chrome.notifications.create(notification_id, options);
			}
		} else if (e.type == 'toggle_input') {
			for (var i = 0; i < tabs.length; i++) {
				chrome.tabs.sendMessage(tabs[i].id, e);
			}
		}
	});
});

chrome.notifications.onClicked.addListener(function(notification_id) {
	var url = notification_id;
	chrome.tabs.query({
		url: [
			"https://firewallcafe.com/*",
			"https://staging.firewallcafe.com/*",
			"https://localhost:4747/*"
		]
	}, function(tabs) {
		for (var i = 0; i < tabs.length; i++) {
			if (tabs[i].url == url) {
				chrome.tabs.update(tabs[i].id, {
					active: true
				});
			}
		}
	});
	chrome.notifications.clear(notification_id);
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
