console.log('loaded message listener');

chrome.runtime.onMessage.addListener(function(message) {
    console.log(message);
    if (Array.isArray(message)){
        var permalink = message[1];
        message = message[0];
    }
    chrome.tabs.query({
        url: [
            "https://www.google.com/imghp*",
            "https://www.google.com/search?site=imghp*",
            "http://image.baidu.com/*",
            "https://image.baidu.com/*",
        ]
    }, function(tabs){
        console.log(tabs);
        for (var i = 0; i < tabs.length; i++) {
            // chrome.tabs.sendMessage(tabs[i].id, message);
        }

        if (message == 'enable-input') {
            // open WP page
            chrome.tabs.create({url: permalink});
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
                bypassList: ["*.baidu.com"]
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
