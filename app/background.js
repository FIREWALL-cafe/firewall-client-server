chrome.app.runtime.onLaunched.addListener(function() {
  var screenWidth = screen.availWidth;
  var screenHeight = screen.availHeight;
  var height = 150;

  chrome.app.window.create('window.html', {
    id: "FireWallSearch",
    outerBounds: {
      width: screenWidth,
      height: height,
    },
    alwaysOnTop: true
  } );

  chrome.app.window.create('search.html', {
    id: "G_Search",
    outerBounds: {
      width: screenWidth,
      height: height,
    },

    alwaysOnTop: true
  });

  chrome.app.window.create('search.html', {
    id: "B_Search",
    outerBounds: {
      width: screenWidth,
      height: height,
    },

    alwaysOnTop: true
  });



});
