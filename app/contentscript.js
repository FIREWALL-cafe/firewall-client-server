var windows = {};
window.onload = function(){
    submit.addEventListener("click", function(){
	textToSearch = document.getElementById("search").value.toLowerCase();

	gwin = chrome.app.window.get('G_Search')
	var webview = gwin.contentWindow.document.querySelector('webview');
	webview.src = 'http://images.google.com/search?tbm=isch&q=' + textToSearch

        bwin = chrome.app.window.get('B_Search')
        var webview = bwin.contentWindow.document.querySelector('webview');
        webview.src = 'http://images.baidu.com/search/index?tn=baiduimage&ipn=r&ct=201326592&cl=2&lm=-1&st=-1&fm=index&fr=&hs=0&xthttps=000000&sf=1&fmq=&pv=&ic=0&nc=1&z=&se=1&showtab=0&fb=0&ie=utf-8&word=' + textToSearch 


//        window.open('http://images.google.com/search?tbm=isch&q=' + textToSearch, 'G_results','directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,top=' + (window.screen.availHeight - 450) +',left=0,width=' + ((window.screen.availWidth / 2)) +',height=450');

//        window.open('http://images.baidu.com/search/index?tn=baiduimage&ipn=r&ct=201326592&cl=2&lm=-1&st=-1&fm=index&fr=&hs=0&xthttps=000000&sf=1&fmq=&pv=&ic=0&nc=1&z=&se=1&showtab=0&fb=0&ie=utf-8&word=' + textToSearch, 'B_results','directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,top=' + (window.screen.availHeight - 450) + ',left='+ ( window.screen.availWidth - ((window.screen.availWidth / 2)) ) + ',width=' + ((window.screen.availWidth / 2)) +',height=450');


    });
};


