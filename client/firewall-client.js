var storage = chrome.storage.local;

var clientId = randomClientId();
var queryData = {};
var query = null;

var ignoreSubmit = false;
var ignorePending = false;
var getImagesTimeout = null;
var autocompleteEnabled = true;

var $googleInput = $("[name=q]");

if (
  window.location.host == "www.google.com" &&
  window.location.pathname == "/"
) {
  // Google homepage => Google image search homepage
  window.location = "https://www.google.com/imghp";
} else if (window.location.hash == "#intro") {
  $(document.body).addClass("firewall-intro");
}

storage.get(
  ["clientId", "pendingQuery", "autocompleteEnabled"],
  function (stored) {
    // Get or set the client ID.
    if (stored.clientId) {
      clientId = stored.clientId;
    } else {
      storage.set({
        clientId: clientId,
      });
    }

    console.log("Firewall Cafe | " + clientId);
    // console.log('Server: ' + config.serverURL);

    // Get user autocomplete preference.
    if (stored.autocompleteEnabled) {
      autocompleteEnabled = stored.autocompleteEnabled == "on";
    }

    // if (autocompleteEnabled) {
    // 	console.log('Autocomplete enabled.');
    // } else {
    // 	console.log('Autocomplete disabled.');
    // }

    // Check for a pending query in storage and set it.
    if (stored.pendingQuery) {
      queryData = stored.pendingQuery;
      if (queryData.query) {
        console.log("Stored pending query: " + queryData.query);
      } else {
        console.log("No stored pending query. Starting fresh.");
      }
    } else {
      console.log("No stored pending query. Starting fresh.");
    }

    setupUI();
    setupIntroScreen();
    setupStorageListener();
    setupMessageListener();
    checkPendingQuery();
    setupInterval();
  }
);

function setupUI() {
  console.log("[setupUI] Setting up UI...");

  var suggestChecked = autocompleteEnabled ? " checked" : "";

  $("#fsr, #lh, #ft, .wrapper_imgfrom_box").append(
    '<div id="firewall">' +
      '<a href="#firewall" id="firewall-show" class="skin_from_link">Firewall</a>' +
      '<form action="#" id="firewall-form" autocomplete="off">' +
      '<label>Client ID: <input name="client-id" id="firewall-client-id" value="' +
      clientId +
      '"></label>' +
      '<label><input type="checkbox" id="firewall-suggest"' +
      suggestChecked +
      " /> Suggest sensitive queries</label>" +
      '<input type="submit" value="Save" />' +
      "</form>" +
      "</div>"
  );

  var $firewallShow = $("#firewall-show"),
    $firewallForm = $("#firewall-form"),
    $firewallClientId = $("#firewall-client-id"),
    $firewallSuggest = $("#firewall-suggest")[0],
    $body = $(document.body);

  $firewallShow.click(function (e) {
    e.preventDefault();
    $firewallForm.toggleClass("visible");
  });

  // On Firewall form submit, update user preferences.
  $firewallForm.submit(function (e) {
    e.preventDefault();
    clientId = $firewallClientId.val();
    autocompleteEnabled = $firewallSuggest.checked;
    var autocompleteStatus = autocompleteEnabled ? "on" : "off";

    storage.set(
      {
        clientId: clientId,
        autocompleteEnabled: autocompleteStatus,
      },
      function () {
        // console.log('Changing settings...');
        // console.log('Firewall client: ' + clientId);
        console.log("Autocomplete: " + autocompleteStatus);
        $firewallForm.removeClass("visible");
      }
    );

    if (autocompleteEnabled) {
      $googleInput.autocomplete({
        source: sensitiveQueries,
      });
      $googleInput.autocomplete("enable");
      $body.addClass("firewall-autocomplete");
    } else {
      $googleInput.autocomplete("disable");
      $body.removeClass("firewall-autocomplete");
    }
  });

  // Set initial autocomplete preferences.
  if (autocompleteEnabled) {
    $googleInput.autocomplete({
      source: sensitiveQueries,
    });
    $body.addClass("firewall-autocomplete");
  }

  var msg =
    "Please wait while we archive your search results in the FIREWALL Cafe library...";
  $("#lst-ib")
    .closest(".sbtc")
    .append('<div id="firewall-loading">' + msg + "</div>");
  $("#kw")
    .closest("form")
    .append('<div id="firewall-loading">' + msg + "</div>");
}

function setupIntroScreen() {
  if (window.location.hostname == "www.google.com") {
    var suffix = "white";
  } else {
    var suffix = "red";
  }
  var path = "/icons/firewall-hong-kong-" + suffix + ".png";
  if (config.logoLabel != "default") {
    var path = "/icons/firewall-" + config.logoLabel + "-" + suffix + ".png";
  }
  var logo = chrome.extension.getURL(path);
  var html = '<img src="' + logo + '">';
  html += '<div class="text">';
  if (window.location.hostname == "www.google.com") {
    html +=
      "<strong>Welcome to FIREWALL Cafe! Type in a name that will let you look up your search session later.</strong>";
    html +=
      '<form action="#" id="firewall-intro-form" autocomplete="off"><input id="firewall-intro-name" placeholder="Pick a name" />';
    html +=
      '<br><input type="submit" id="firewall-begin" value="Let’s begin!" /></form>';
    html += "<ol>";
    html += "<li>Type a phrase into Google Image Search.</li>";
    html +=
      "<li>Your query will be auto-translated into Chinese to search Baidu Image Search.</li>";
    html +=
      "<li>Please wait patiently while the images save to our search library.</li>";
    html +=
      "<li>Once we’ve archived your images, tell us what you think: click on censored/mistranslated/NSFW/etc.</li>";
    html +=
      "<li>Have fun, and view your archived search session images at firewallcafe.com!</li>";
    html += "</ol>";
  } else {
    html +=
      "<p>FIREWALL is an interactive digital art installation and research project designed to foster public dialogue about Internet freedom. The goal of this art project is to investigate online censorship by comparing the disparities of Google searches in western nations versus Baidu searches in China.  The motivation behind the project is to confront censorship through a participatory discovery process of Internet visual culture.</p>";
    html +=
      "<p>FIREWALL是一个社会互动性的美术研究项目，旨在培育有关网络自由的公众对话。此美术项目通过比较西方国家的谷歌搜寻结果及中国的百度搜寻结果来探讨网路审查的问题。本项目的动机来自于利用参与性的方法和网络视觉文化来对抗网路审查。</p>";
  }
  html += "</div>";
  $(document.body).append('<div id="firewall-intro">' + html + "</div>");
  if (window.location.hostname != "www.google.com") {
    $("#firewall-intro").addClass("inverted");
  }
  function hide_intro(e) {
    e.preventDefault();
    var name = $("#firewall-intro-name").val();
    if (name == "") {
      name = "Anonymous";
    }
    storage.set({
      clientId: name,
    });
    chrome.runtime.sendMessage({
      type: "close_intro",
      name: name,
    });
  }
  $("#firewall-intro-form").on("submit", hide_intro);
}

function setupInterval() {
  setInterval(function () {
    checkURLQuery();
  }, 100);
}

function setupStorageListener() {
  // Listen to chrome storage for changes.
  chrome.storage.onChanged.addListener(function (changes, area) {
    // Ignore changes that aren't happening in local storage.
    if (area !== "local") {
      return;
    }

    // If the client performs a search and saves results to storage,
    // update the pending query with the incoming data.
    if (changes.pendingQuery) {
      queryData = $.extend(queryData, changes.pendingQuery.newValue);
      checkPendingQuery();
      checkPendingImages();
    }
  });
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener(function (e) {
    // console.log('MSG: ' + e.type, e);
    console.log("[onMessage] type:", e.type);
    if (e.type == "toggle_input") {
      /*
			if (e.enabled) {
				window.onbeforeunload = null;
			} else {
				window.onbeforeunload = function() {
					var dialog = 'Please wait a moment while we save your search.';
					e.returnValue = dialog;
					return dialog;
				};
			}
			*/
      if (e.enabled) {
        $(document.body).removeClass("firewall-loading");
      }
      toggleInputField(e.enabled);
    } else if (e.type == "images_loading") {
      $(document.body).addClass("firewall-loading");
    } else if (e.type == "close_intro") {
      $(document.body).removeClass("firewall-intro");
      $("#firewall-client-id").val(e.name);
    } else if (e.type == "user_activity") {
      $(document.body).removeClass("firewall-intro");
    }
  });
}

function checkPendingQuery() {
  if (queryData.query) {
    console.log("[checkPendingQuery] Pending query: ", queryData);
  }

  // If we're ignoring incoming query data because we're in the middle of handling a query, move on.
  if (ignorePending) {
    console.log("[checkPendingQuery] !!!NOT!!!");
    console.log("[checkPendingQuery] Ignoring pending queries.");
    // return;
  }

  // Look at the URL query string to get the search term.
  var queryMatch = getQueryMatch();
  if (queryMatch) {
    console.log("[checkPendingQuery] URL search term is:", queryMatch);
  }

  // Timestamp this query.
  var currTime = new Date().getTime();

  // If the search term is the translation of an original search term, move on.
  if (
    queryData &&
    queryData.translated &&
    queryData.translated == queryMatch
  ) {
    // We've just searched for this one, let getImages take it from here
    console.log("[checkPendingQuery] Already getting these images.");
    return;
  } else if (
    queryData &&
    queryData.timestamp &&
    currTime - queryData.timestamp > 60 * 1000
  ) {
    // Pending queries expire after 1 min.
    // If the query has expired, reset everything.
    console.log("[checkPendingQuery] Query has expired.");
    queryData = {};
    storage.set(
      {
        pendingQuery: {},
      },
      function () {
        console.log("[checkPendingQuery] Reset query.");
      }
    );
    // toggleInputField(true, function(){
    // 	console.log('Input field enabled.');
    // });
  } else if (queryData.query && queryData.searchEngine != getSource()) {
    // If the origin of the search was in the other search engine,
    // start a search for the term in the current search engine.
    console.log(
      "[checkPendingQuery] Found a pending query from",
      queryData.source,
      ":",
      queryData.query
    );
    // console.log('SETTING ignorePending to TRUE');
    ignorePending = true;
    searchPendingQuery();
  }
}

function checkURLQuery() {
  // Look at the URL query string to find the search term.
  var queryMatch = getQueryMatch();

  // If there's nothing that looks like a search term in the URL, keep polling.
  if (!queryMatch) {
    return;
  }

  if (ignoreSubmit) {
    console.log("[checkURLQuery] ignoring page refresh once");
    if (query)
      console.log("[checkURLQuery] overwriting", query, "with", queryMatch);
    query = queryMatch;
    ignoreSubmit = false;
    // toggleInputField(true, function(){
    // 	console.log('Input field enabled.');
    // })
    return;
  }

  // If the URL search term is not the query, that means we're about to start handling
  // a new search.
  if (queryMatch !== query) {
    // Update the query.
    if (query)
      console.log("[checkURLQuery] overwriting", query, "with", queryMatch);
    query = queryMatch;
    if (!query) {
      return;
    }

    console.log("[checkURLQuery] Detected a", getSource(), "search: " + query);
    chrome.runtime.sendMessage({
      type: "toggle_input",
      enabled: true,
    });

    var timestamp = new Date().getTime();

    if (!queryData) {
      // If neither search is in progress,
      // start the first query for images.
      startQuery(query, function (result) {
        console.log("[checkURLQuery] Translated query: " + result.translated);
        console.log("[checkURLQuery] creating new pendingQuery object");
        queryData = $.extend(result, {
          timestamp: timestamp,
          googleImages: null,
          baiduImages: null,
          searchEngine: getSource(),
        });

        storage.set(
          {
            pendingQuery: queryData,
          },
          function () {
            console.log(
              "[checkURLQuery] Saved query to pending: " + result.query
            );
          }
        );
        startGettingImages();
      });
    } else {
      // Check to see if the ongoing query has any history.
      var queryTranslated = isQueryTranslated(query);

      // If the primary search term is pending and is the original "source" search term,
      // just continue along.
      if (!queryTranslated) {
        console.log("[checkURLQuery] the source query is", query);
        return;
      } else if (queryTranslated) {
        // If the primary search term is pending and is the translation of an original search,
        // start ignoring subsequent pending queries and begin getting images.
        // console.log('Translation: ' + pendingQuery.translated);
        console.log("[checkURLQuery] ignoring subsequent pending queries");
        ignorePending = true;
        startGettingImages();
      }
    }
  }
}

function startQuery(query, callback) {
  console.log("[startQuery] " + query);

  var data = {
    query: query,
    searchEngine: getSource(),
    secret: config.sharedSecret,
    langFrom: "EN",
    langTo: "zh-CN",
  };
  $.ajax({
    url: config.serverURL + "translate",
    method: "POST",
    data: data,
  })
    .done(function (result) {
      console.log(result);
      callback(result);
    })
    .fail(function (xhr, textStatus) {
      console.log("Failed query: " + textStatus + " / " + xhr.responseText);
    });
}

function startGettingImages() {
  if (getImagesTimeout) {
    clearTimeout(getImagesTimeout);
    getImagesTimeout = null;
  }
  setTimeout(function () {
    getImages();
  }, 2000);
}

function isQueryTranslated(query) {
  if (queryData) {
    if (queryData.translated === query) {
      return true;
    } else {
      return false;
    }
  }
  console.warn(
    "[isQueryTranslated] isQueryTranslated is being called with null pendingQuery"
  );
  return false;
}

function searchPendingQuery() {
  var rainbowCSS =
    "text-shadow: -1px -1px hsl(0,100%,50%), 1px 1px hsl(5.4, 100%, 50%), 3px 2px hsl(10.8, 100%, 50%), 5px 3px hsl(16.2, 100%, 50%), 7px 4px hsl(21.6, 100%, 50%), 9px 5px hsl(27, 100%, 50%), 11px 6px hsl(32.4, 100%, 50%), 13px 7px hsl(37.8, 100%, 50%), 14px 8px hsl(43.2, 100%, 50%), 16px 9px hsl(48.6, 100%, 50%), 18px 10px hsl(54, 100%, 50%), 20px 11px hsl(59.4, 100%, 50%), 22px 12px hsl(64.8, 100%, 50%), 23px 13px hsl(70.2, 100%, 50%), 25px 14px hsl(75.6, 100%, 50%), 27px 15px hsl(81, 100%, 50%), 28px 16px hsl(86.4, 100%, 50%), 30px 17px hsl(91.8, 100%, 50%), 32px 18px hsl(97.2, 100%, 50%), 33px 19px hsl(102.6, 100%, 50%), 35px 20px hsl(108, 100%, 50%), 36px 21px hsl(113.4, 100%, 50%), 38px 22px hsl(118.8, 100%, 50%), 39px 23px hsl(124.2, 100%, 50%), 41px 24px hsl(129.6, 100%, 50%), 42px 25px hsl(135, 100%, 50%), 43px 26px hsl(140.4, 100%, 50%), 45px 27px hsl(145.8, 100%, 50%), 46px 28px hsl(151.2, 100%, 50%), 47px 29px hsl(156.6, 100%, 50%), 48px 30px hsl(162, 100%, 50%), 49px 31px hsl(167.4, 100%, 50%), 50px 32px hsl(172.8, 100%, 50%), 51px 33px hsl(178.2, 100%, 50%), 52px 34px hsl(183.6, 100%, 50%), 53px 35px hsl(189, 100%, 50%), 54px 36px hsl(194.4, 100%, 50%), 55px 37px hsl(199.8, 100%, 50%), 55px 38px hsl(205.2, 100%, 50%), 56px 39px hsl(210.6, 100%, 50%), 57px 40px hsl(216, 100%, 50%), 57px 41px hsl(221.4, 100%, 50%), 58px 42px hsl(226.8, 100%, 50%), 58px 43px hsl(232.2, 100%, 50%), 58px 44px hsl(237.6, 100%, 50%), 59px 45px hsl(243, 100%, 50%), 59px 46px hsl(248.4, 100%, 50%), 59px 47px hsl(253.8, 100%, 50%), 59px 48px hsl(259.2, 100%, 50%), 59px 49px hsl(264.6, 100%, 50%), 60px 50px hsl(270, 100%, 50%), 59px 51px hsl(275.4, 100%, 50%), 59px 52px hsl(280.8, 100%, 50%), 59px 53px hsl(286.2, 100%, 50%), 59px 54px hsl(291.6, 100%, 50%), 59px 55px hsl(297, 100%, 50%), 58px 56px hsl(302.4, 100%, 50%), 58px 57px hsl(307.8, 100%, 50%), 58px 58px hsl(313.2, 100%, 50%), 57px 59px hsl(318.6, 100%, 50%), 57px 60px hsl(324, 100%, 50%), 56px 61px hsl(329.4, 100%, 50%), 55px 62px hsl(334.8, 100%, 50%), 55px 63px hsl(340.2, 100%, 50%), 54px 64px hsl(345.6, 100%, 50%), 53px 65px hsl(351, 100%, 50%), 52px 66px hsl(356.4, 100%, 50%), 51px 67px hsl(361.8, 100%, 50%), 50px 68px hsl(367.2, 100%, 50%), 49px 69px hsl(372.6, 100%, 50%), 48px 70px hsl(378, 100%, 50%), 47px 71px hsl(383.4, 100%, 50%), 46px 72px hsl(388.8, 100%, 50%), 45px 73px hsl(394.2, 100%, 50%), 43px 74px hsl(399.6, 100%, 50%), 42px 75px hsl(405, 100%, 50%), 41px 76px hsl(410.4, 100%, 50%), 39px 77px hsl(415.8, 100%, 50%), 38px 78px hsl(421.2, 100%, 50%), 36px 79px hsl(426.6, 100%, 50%), 35px 80px hsl(432, 100%, 50%), 33px 81px hsl(437.4, 100%, 50%), 32px 82px hsl(442.8, 100%, 50%), 30px 83px hsl(448.2, 100%, 50%), 28px 84px hsl(453.6, 100%, 50%), 27px 85px hsl(459, 100%, 50%), 25px 86px hsl(464.4, 100%, 50%), 23px 87px hsl(469.8, 100%, 50%), 22px 88px hsl(475.2, 100%, 50%), 20px 89px hsl(480.6, 100%, 50%), 18px 90px hsl(486, 100%, 50%), 16px 91px hsl(491.4, 100%, 50%), 14px 92px hsl(496.8, 100%, 50%), 13px 93px hsl(502.2, 100%, 50%), 11px 94px hsl(507.6, 100%, 50%), 9px 95px hsl(513, 100%, 50%), 7px 96px hsl(518.4, 100%, 50%), 5px 97px hsl(523.8, 100%, 50%), 3px 98px hsl(529.2, 100%, 50%), 1px 99px hsl(534.6, 100%, 50%), 7px 100px hsl(540, 100%, 50%), -1px 101px hsl(545.4, 100%, 50%), -3px 102px hsl(550.8, 100%, 50%), -5px 103px hsl(556.2, 100%, 50%), -7px 104px hsl(561.6, 100%, 50%), -9px 105px hsl(567, 100%, 50%), -11px 106px hsl(572.4, 100%, 50%), -13px 107px hsl(577.8, 100%, 50%), -14px 108px hsl(583.2, 100%, 50%), -16px 109px hsl(588.6, 100%, 50%), -18px 110px hsl(594, 100%, 50%), -20px 111px hsl(599.4, 100%, 50%), -22px 112px hsl(604.8, 100%, 50%), -23px 113px hsl(610.2, 100%, 50%), -25px 114px hsl(615.6, 100%, 50%), -27px 115px hsl(621, 100%, 50%), -28px 116px hsl(626.4, 100%, 50%), -30px 117px hsl(631.8, 100%, 50%), -32px 118px hsl(637.2, 100%, 50%), -33px 119px hsl(642.6, 100%, 50%), -35px 120px hsl(648, 100%, 50%), -36px 121px hsl(653.4, 100%, 50%), -38px 122px hsl(658.8, 100%, 50%), -39px 123px hsl(664.2, 100%, 50%), -41px 124px hsl(669.6, 100%, 50%), -42px 125px hsl(675, 100%, 50%), -43px 126px hsl(680.4, 100%, 50%), -45px 127px hsl(685.8, 100%, 50%), -46px 128px hsl(691.2, 100%, 50%), -47px 129px hsl(696.6, 100%, 50%), -48px 130px hsl(702, 100%, 50%), -49px 131px hsl(707.4, 100%, 50%), -50px 132px hsl(712.8, 100%, 50%), -51px 133px hsl(718.2, 100%, 50%), -52px 134px hsl(723.6, 100%, 50%), -53px 135px hsl(729, 100%, 50%), -54px 136px hsl(734.4, 100%, 50%), -55px 137px hsl(739.8, 100%, 50%), -55px 138px hsl(745.2, 100%, 50%), -56px 139px hsl(750.6, 100%, 50%), -57px 140px hsl(756, 100%, 50%), -57px 141px hsl(761.4, 100%, 50%), -58px 142px hsl(766.8, 100%, 50%), -58px 143px hsl(772.2, 100%, 50%), -58px 144px hsl(777.6, 100%, 50%), -59px 145px hsl(783, 100%, 50%), -59px 146px hsl(788.4, 100%, 50%), -59px 147px hsl(793.8, 100%, 50%), -59px 148px hsl(799.2, 100%, 50%), -59px 149px hsl(804.6, 100%, 50%), -60px 150px hsl(810, 100%, 50%), -59px 151px hsl(815.4, 100%, 50%), -59px 152px hsl(820.8, 100%, 50%), -59px 153px hsl(826.2, 100%, 50%), -59px 154px hsl(831.6, 100%, 50%), -59px 155px hsl(837, 100%, 50%), -58px 156px hsl(842.4, 100%, 50%), -58px 157px hsl(847.8, 100%, 50%), -58px 158px hsl(853.2, 100%, 50%), -57px 159px hsl(858.6, 100%, 50%), -57px 160px hsl(864, 100%, 50%), -56px 161px hsl(869.4, 100%, 50%), -55px 162px hsl(874.8, 100%, 50%), -55px 163px hsl(880.2, 100%, 50%), -54px 164px hsl(885.6, 100%, 50%), -53px 165px hsl(891, 100%, 50%), -52px 166px hsl(896.4, 100%, 50%), -51px 167px hsl(901.8, 100%, 50%), -50px 168px hsl(907.2, 100%, 50%), -49px 169px hsl(912.6, 100%, 50%), -48px 170px hsl(918, 100%, 50%), -47px 171px hsl(923.4, 100%, 50%), -46px 172px hsl(928.8, 100%, 50%), -45px 173px hsl(934.2, 100%, 50%), -43px 174px hsl(939.6, 100%, 50%), -42px 175px hsl(945, 100%, 50%), -41px 176px hsl(950.4, 100%, 50%), -39px 177px hsl(955.8, 100%, 50%), -38px 178px hsl(961.2, 100%, 50%), -36px 179px hsl(966.6, 100%, 50%), -35px 180px hsl(972, 100%, 50%), -33px 181px hsl(977.4, 100%, 50%), -32px 182px hsl(982.8, 100%, 50%), -30px 183px hsl(988.2, 100%, 50%), -28px 184px hsl(993.6, 100%, 50%), -27px 185px hsl(999, 100%, 50%), -25px 186px hsl(1004.4, 100%, 50%), -23px 187px hsl(1009.8, 100%, 50%), -22px 188px hsl(1015.2, 100%, 50%), -20px 189px hsl(1020.6, 100%, 50%), -18px 190px hsl(1026, 100%, 50%), -16px 191px hsl(1031.4, 100%, 50%), -14px 192px hsl(1036.8, 100%, 50%), -13px 193px hsl(1042.2, 100%, 50%), -11px 194px hsl(1047.6, 100%, 50%), -9px 195px hsl(1053, 100%, 50%), -7px 196px hsl(1058.4, 100%, 50%), -5px 197px hsl(1063.8, 100%, 50%), -3px 198px hsl(1069.2, 100%, 50%), -1px 199px hsl(1074.6, 100%, 50%), -1px 200px hsl(1080, 100%, 50%), 1px 201px hsl(1085.4, 100%, 50%), 3px 202px hsl(1090.8, 100%, 50%), 5px 203px hsl(1096.2, 100%, 50%), 7px 204px hsl(1101.6, 100%, 50%), 9px 205px hsl(1107, 100%, 50%), 11px 206px hsl(1112.4, 100%, 50%), 13px 207px hsl(1117.8, 100%, 50%), 14px 208px hsl(1123.2, 100%, 50%), 16px 209px hsl(1128.6, 100%, 50%), 18px 210px hsl(1134, 100%, 50%), 20px 211px hsl(1139.4, 100%, 50%), 22px 212px hsl(1144.8, 100%, 50%), 23px 213px hsl(1150.2, 100%, 50%), 25px 214px hsl(1155.6, 100%, 50%), 27px 215px hsl(1161, 100%, 50%), 28px 216px hsl(1166.4, 100%, 50%), 30px 217px hsl(1171.8, 100%, 50%), 32px 218px hsl(1177.2, 100%, 50%), 33px 219px hsl(1182.6, 100%, 50%), 35px 220px hsl(1188, 100%, 50%), 36px 221px hsl(1193.4, 100%, 50%), 38px 222px hsl(1198.8, 100%, 50%), 39px 223px hsl(1204.2, 100%, 50%), 41px 224px hsl(1209.6, 100%, 50%), 42px 225px hsl(1215, 100%, 50%), 43px 226px hsl(1220.4, 100%, 50%), 45px 227px hsl(1225.8, 100%, 50%), 46px 228px hsl(1231.2, 100%, 50%), 47px 229px hsl(1236.6, 100%, 50%), 48px 230px hsl(1242, 100%, 50%), 49px 231px hsl(1247.4, 100%, 50%), 50px 232px hsl(1252.8, 100%, 50%), 51px 233px hsl(1258.2, 100%, 50%), 52px 234px hsl(1263.6, 100%, 50%), 53px 235px hsl(1269, 100%, 50%), 54px 236px hsl(1274.4, 100%, 50%), 55px 237px hsl(1279.8, 100%, 50%), 55px 238px hsl(1285.2, 100%, 50%), 56px 239px hsl(1290.6, 100%, 50%), 57px 240px hsl(1296, 100%, 50%), 57px 241px hsl(1301.4, 100%, 50%), 58px 242px hsl(1306.8, 100%, 50%), 58px 243px hsl(1312.2, 100%, 50%), 58px 244px hsl(1317.6, 100%, 50%), 59px 245px hsl(1323, 100%, 50%), 59px 246px hsl(1328.4, 100%, 50%), 59px 247px hsl(1333.8, 100%, 50%), 59px 248px hsl(1339.2, 100%, 50%), 59px 249px hsl(1344.6, 100%, 50%), 60px 250px hsl(1350, 100%, 50%), 59px 251px hsl(1355.4, 100%, 50%), 59px 252px hsl(1360.8, 100%, 50%), 59px 253px hsl(1366.2, 100%, 50%), 59px 254px hsl(1371.6, 100%, 50%), 59px 255px hsl(1377, 100%, 50%), 58px 256px hsl(1382.4, 100%, 50%), 58px 257px hsl(1387.8, 100%, 50%), 58px 258px hsl(1393.2, 100%, 50%), 57px 259px hsl(1398.6, 100%, 50%), 57px 260px hsl(1404, 100%, 50%), 56px 261px hsl(1409.4, 100%, 50%), 55px 262px hsl(1414.8, 100%, 50%), 55px 263px hsl(1420.2, 100%, 50%), 54px 264px hsl(1425.6, 100%, 50%), 53px 265px hsl(1431, 100%, 50%), 52px 266px hsl(1436.4, 100%, 50%), 51px 267px hsl(1441.8, 100%, 50%), 50px 268px hsl(1447.2, 100%, 50%), 49px 269px hsl(1452.6, 100%, 50%), 48px 270px hsl(1458, 100%, 50%), 47px 271px hsl(1463.4, 100%, 50%), 46px 272px hsl(1468.8, 100%, 50%), 45px 273px hsl(1474.2, 100%, 50%), 43px 274px hsl(1479.6, 100%, 50%), 42px 275px hsl(1485, 100%, 50%), 41px 276px hsl(1490.4, 100%, 50%), 39px 277px hsl(1495.8, 100%, 50%), 38px 278px hsl(1501.2, 100%, 50%), 36px 279px hsl(1506.6, 100%, 50%), 35px 280px hsl(1512, 100%, 50%), 33px 281px hsl(1517.4, 100%, 50%), 32px 282px hsl(1522.8, 100%, 50%), 30px 283px hsl(1528.2, 100%, 50%), 28px 284px hsl(1533.6, 100%, 50%), 27px 285px hsl(1539, 100%, 50%), 25px 286px hsl(1544.4, 100%, 50%), 23px 287px hsl(1549.8, 100%, 50%), 22px 288px hsl(1555.2, 100%, 50%), 20px 289px hsl(1560.6, 100%, 50%), 18px 290px hsl(1566, 100%, 50%), 16px 291px hsl(1571.4, 100%, 50%), 14px 292px hsl(1576.8, 100%, 50%), 13px 293px hsl(1582.2, 100%, 50%), 11px 294px hsl(1587.6, 100%, 50%), 9px 295px hsl(1593, 100%, 50%), 7px 296px hsl(1598.4, 100%, 50%), 5px 297px hsl(1603.8, 100%, 50%), 3px 298px hsl(1609.2, 100%, 50%), 1px 299px hsl(1614.6, 100%, 50%), 2px 300px hsl(1620, 100%, 50%), -1px 301px hsl(1625.4, 100%, 50%), -3px 302px hsl(1630.8, 100%, 50%), -5px 303px hsl(1636.2, 100%, 50%), -7px 304px hsl(1641.6, 100%, 50%), -9px 305px hsl(1647, 100%, 50%), -11px 306px hsl(1652.4, 100%, 50%), -13px 307px hsl(1657.8, 100%, 50%), -14px 308px hsl(1663.2, 100%, 50%), -16px 309px hsl(1668.6, 100%, 50%), -18px 310px hsl(1674, 100%, 50%), -20px 311px hsl(1679.4, 100%, 50%), -22px 312px hsl(1684.8, 100%, 50%), -23px 313px hsl(1690.2, 100%, 50%), -25px 314px hsl(1695.6, 100%, 50%), -27px 315px hsl(1701, 100%, 50%), -28px 316px hsl(1706.4, 100%, 50%), -30px 317px hsl(1711.8, 100%, 50%), -32px 318px hsl(1717.2, 100%, 50%), -33px 319px hsl(1722.6, 100%, 50%), -35px 320px hsl(1728, 100%, 50%), -36px 321px hsl(1733.4, 100%, 50%), -38px 322px hsl(1738.8, 100%, 50%), -39px 323px hsl(1744.2, 100%, 50%), -41px 324px hsl(1749.6, 100%, 50%), -42px 325px hsl(1755, 100%, 50%), -43px 326px hsl(1760.4, 100%, 50%), -45px 327px hsl(1765.8, 100%, 50%), -46px 328px hsl(1771.2, 100%, 50%), -47px 329px hsl(1776.6, 100%, 50%), -48px 330px hsl(1782, 100%, 50%), -49px 331px hsl(1787.4, 100%, 50%), -50px 332px hsl(1792.8, 100%, 50%), -51px 333px hsl(1798.2, 100%, 50%), -52px 334px hsl(1803.6, 100%, 50%), -53px 335px hsl(1809, 100%, 50%), -54px 336px hsl(1814.4, 100%, 50%), -55px 337px hsl(1819.8, 100%, 50%), -55px 338px hsl(1825.2, 100%, 50%), -56px 339px hsl(1830.6, 100%, 50%), -57px 340px hsl(1836, 100%, 50%), -57px 341px hsl(1841.4, 100%, 50%), -58px 342px hsl(1846.8, 100%, 50%), -58px 343px hsl(1852.2, 100%, 50%), -58px 344px hsl(1857.6, 100%, 50%), -59px 345px hsl(1863, 100%, 50%), -59px 346px hsl(1868.4, 100%, 50%), -59px 347px hsl(1873.8, 100%, 50%), -59px 348px hsl(1879.2, 100%, 50%), -59px 349px hsl(1884.6, 100%, 50%), -60px 350px hsl(1890, 100%, 50%), -59px 351px hsl(1895.4, 100%, 50%), -59px 352px hsl(1900.8, 100%, 50%), -59px 353px hsl(1906.2, 100%, 50%), -59px 354px hsl(1911.6, 100%, 50%), -59px 355px hsl(1917, 100%, 50%), -58px 356px hsl(1922.4, 100%, 50%), -58px 357px hsl(1927.8, 100%, 50%), -58px 358px hsl(1933.2, 100%, 50%), -57px 359px hsl(1938.6, 100%, 50%), -57px 360px hsl(1944, 100%, 50%), -56px 361px hsl(1949.4, 100%, 50%), -55px 362px hsl(1954.8, 100%, 50%), -55px 363px hsl(1960.2, 100%, 50%), -54px 364px hsl(1965.6, 100%, 50%), -53px 365px hsl(1971, 100%, 50%), -52px 366px hsl(1976.4, 100%, 50%), -51px 367px hsl(1981.8, 100%, 50%), -50px 368px hsl(1987.2, 100%, 50%), -49px 369px hsl(1992.6, 100%, 50%), -48px 370px hsl(1998, 100%, 50%), -47px 371px hsl(2003.4, 100%, 50%), -46px 372px hsl(2008.8, 100%, 50%), -45px 373px hsl(2014.2, 100%, 50%), -43px 374px hsl(2019.6, 100%, 50%), -42px 375px hsl(2025, 100%, 50%), -41px 376px hsl(2030.4, 100%, 50%), -39px 377px hsl(2035.8, 100%, 50%), -38px 378px hsl(2041.2, 100%, 50%), -36px 379px hsl(2046.6, 100%, 50%), -35px 380px hsl(2052, 100%, 50%), -33px 381px hsl(2057.4, 100%, 50%), -32px 382px hsl(2062.8, 100%, 50%), -30px 383px hsl(2068.2, 100%, 50%), -28px 384px hsl(2073.6, 100%, 50%), -27px 385px hsl(2079, 100%, 50%), -25px 386px hsl(2084.4, 100%, 50%), -23px 387px hsl(2089.8, 100%, 50%), -22px 388px hsl(2095.2, 100%, 50%), -20px 389px hsl(2100.6, 100%, 50%), -18px 390px hsl(2106, 100%, 50%), -16px 391px hsl(2111.4, 100%, 50%), -14px 392px hsl(2116.8, 100%, 50%), -13px 393px hsl(2122.2, 100%, 50%), -11px 394px hsl(2127.6, 100%, 50%), -9px 395px hsl(2133, 100%, 50%), -7px 396px hsl(2138.4, 100%, 50%), -5px 397px hsl(2143.8, 100%, 50%), -3px 398px hsl(2149.2, 100%, 50%), -1px 399px hsl(2154.6, 100%, 50%); font-size: 40px;";

  console.log(
    "[searchPendingQuery] Searching for",
    queryData.translated,
    "(translation of",
    queryData.query,
    ") in",
    getSource()
  );
  sleep(500);
  var $inputField = findInputField();
  console.log("%c[searchPendingQuery] %s", rainbowCSS, "all code runs happy");
  sleep(500);
  var inputQuery = "input[name=q], input[name=word]";
  if (
    $(inputQuery).length == 0 ||
    $(inputQuery).first().closest("form").length == 0
  ) {
    // console.log('Could not find form input, giving up.');
    // console.log('SETTING ignorePending to FALSE');
    ignorePending = false;
    return;
  }
  console.log("%c[searchPendingQuery] %s", rainbowCSS, "CLICKING SUBMIT");
  sleep(1000);
  $(inputQuery).first().val(queryData.translated);
  $inputField.first().closest("form").submit();
  sleep(1000);
  console.log("[searchPendingQuery] done");
}

function findInputField() {
  var inputField = "input[name=q], input[name=word]",
    $inputField = $(inputField);

  if (
    $inputField.length == 0 ||
    $inputField.first().closest("form").length == 0
  ) {
    // console.log('Could not find form input. Giving up.');
    // console.log('SETTING ignorePending to FALSE');
    ignorePending = false;
    return;
  }
  return $inputField.first();
}

function getImages() {
  if (!queryData || !queryData.query) {
    return;
  }

  var imagesKey = getSource() + "Images";
  var retryKey = getSource() + "Retries";
  var numImages = 10;
  var maxRetries = 3;

  // If getting images from Baidu, look for the phrase indicating banned search.
  if (getSource() == "baidu") {
    var banned =
      $('body:contains("根据相关法律法规和政策，部分搜索结果未予显示")')
        .length > 0;
    if (banned) {
      queryData["banned"] = true;
    } else {
      queryData["banned"] = false;
    }
  }

  if (!queryData[retryKey]) {
    queryData[retryKey] = 0;
  }

  // console.log('Gathering', getSource(), 'images for ' + pendingQuery.query);

  function _dedupeLimitedSet(imageSet, image, flatDatastore) {
    var dupe = false;
    var url = null;

    if (getSource() === "baidu") {
      // In Baidu result pages, the original image URL associated with a given
      // image node is encoded in the `objurl` query parameter in the parent
      // link's `href` attribute.
      var parentNode = image.parentNode;
      if (parentNode.nodeName === "A") {
        var href = $(parentNode).attr("href");
        if (href.match(/url=([^&]+)/)) {
          // Baidu uses the specific parameter `objurl`
          var encodedUrl = href.match(/url=([^&]+)/)[1];
          url = decodeURIComponent(encodedUrl);
        }
      }
    } else if (
      getSource() === "google" &&
      typeof flatDatastore != "undefined"
    ) {
      // The Baidu method originally worked for Google result pages too, which
      // differed only in using the specific parameter `imgurl`. But in Feb. 2020
      // the DOM implementation changed significantly. Now, each image node has an
      // ancestor with a unique `data-id`, then used for lookup in a datastore
      // that's loaded independently later on.
      var dataId =
        image.parentNode.parentNode.parentNode.getAttribute("data-id");
      // Find first appearance of `data-id`
      var dataIdFirstIndex = flatDatastore.indexOf(dataId);
      // If available, the original image URL should occur 4 slots later
      if (dataIdFirstIndex >= 0) {
        // Verify that it's actually a URL
        var urlCandidate = flatDatastore[dataIdFirstIndex + 4];
        var result = urlCandidate.indexOf("http") === 0 ? urlCandidate : null;
        url = result;
      }
    }

    $.each(imageSet, function (index, element) {
      if (element.url == url) {
        dupe = true;
      }
    });

    if (url && !dupe && imageSet.length < numImages) {
      imageSet.push({
        // TODO WP expects key `href` but `url` would be nicer for symmetry
        href: url,
        src: image.src,
      });
    }
  }

  if (queryData[imagesKey]) {
    var images = queryData[imagesKey];
  } else {
    var images = [];
  }

  // Get Google datastore if relevant
  if (getSource() === "google") {
    getGoogleDatastore()
      .catch((error) => {
        console.error(error);
      })
      .then((data) => {
        // Get Google image URIs
        if (!data) {
          // console.log('google datastore is not defined');
          return;
        }
        $("img.rg_i").each(function (index, element) {
          try {
            _dedupeLimitedSet(images, element, data["flatDatastore"]);
          } catch (err) {
            console.log(err);
          }
        });
      });
  }

  // Get Baidu image URIs
  $(".imglist img").each(function (index, element) {
    _dedupeLimitedSet(images, element);
  });

  // console.log('Found ' + images.length + ' images from', getSource());
  queryData[imagesKey] = images;

  if (images.length < numImages && queryData[retryKey] < maxRetries) {
    queryData[retryKey]++;
    console.log(
      "[getImages] Still only have " +
        images.length +
        " images; retry in 2 seconds (" +
        queryData[retryKey] +
        " of " +
        maxRetries +
        ")"
    );
    startGettingImages();
  } else if (!checkPendingImages()) {
    // If we don't have all the images yet, save the first crop of them to storage
    storage.set({
      pendingQuery: queryData,
    });
    // console.log('SETTING ignorePending to FALSE');
    ignorePending = false;
  }
}

function checkPendingImages() {
  if (queryData && queryData.googleImages && queryData.baiduImages) {
    // console.log('Image gathering complete.');

    if (queryData.googleImages.length) {
      console.log(
        "[checkPendingImages] Looks like we have",
        queryData.googleImages.length,
        "images from Google!"
      );
    } else {
      console.log("[checkPendingImages] No image results from Google. :(");
    }

    if (queryData.baiduImages.length) {
      console.log(
        "[checkPendingImages] Looks like we have",
        queryData.baiduImages.length,
        "images from Baidu!"
      );
    } else {
      console.log("[checkPendingImages] No image results from Baidu. :(");
    }

    // If we have results from both search engines, submit them ... annnd we're done
    submitImages(function () {
      console.log("[checkPendingImages] Removing pending query");
      queryData = {};
      storage.set({
        pendingQuery: {},
      });
      // console.log('SETTING ignorePending to FALSE');
      ignorePending = false;
    });
    return true;
  }

  return false;
}

function toggleInputField(enable) {
  // console.log('toggling input field: ' + enable);
  var input = document.querySelector("input[name=word], input[name=q]");
  if (input) {
    input.disabled = !enable;
    console.log("[toggleInputField]", input);
  }
}

function submitImages(callback) {
  // this is what a current call looks like to /saveImages, working in Postman
  var data = {
    timestamp: queryData.timestamp,
    location: config.location,
    client: clientId,
    secret: config.wordpressSecret,
    search_engine: queryData.searchEngine,
    query: queryData.query,
    translated: queryData.translated,
    lang_from: queryData.langFrom,
    lang_to: queryData.langTo,
    lang_confidence: queryData.langConfidence,
    lang_alternate: queryData.langAlternate,
    lang_name: queryData.langName,
    google_images: JSON.stringify(queryData.googleImages),
    baidu_images: JSON.stringify(queryData.baiduImages),
    banned: queryData.banned,
    sensitive: queryData.sensitive,
  };
  const url = config.apiBase + "/saveSearchAndImages";
  // console.log("sending images to API", url, data)

  fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    // mode: 'no-cors',
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      // console.log("response from API:", response)
      response.type = "images_saved";
      chrome.runtime.sendMessage(response);
      callback();
    })
    .catch((err) => {
      // console.log("error from API:", err)
    });
  console.log("[submitImages] done");
}

function submitImagesToWordpress(callback) {
  // deprecating this function!
  // WordPress will get all of the data-URI image data
  var wp_data = {
    timestamp: queryData.timestamp,
    location: config.location,
    client: clientId,
    secret: config.wordpressSecret,
    search_engine: queryData.searchEngine,
    query: queryData.query,
    translated: queryData.translated,
    lang_from: queryData.langFrom,
    lang_to: queryData.langTo,
    lang_confidence: queryData.langConfidence,
    lang_alternate: queryData.langAlternate,
    lang_name: queryData.langName,
    google_images: JSON.stringify(queryData.googleImages),
    baidu_images: JSON.stringify(queryData.baiduImages),
    banned: queryData.banned,
    sensitive: queryData.sensitive,
  };

  var googleImageUrls = [];
  $.each(queryData.googleImages, function (index, image) {
    googleImageUrls.push(image.href);
  });
  var baiduImageUrls = [];
  $.each(queryData.baiduImages, function (index, image) {
    baiduImageUrls.push(image.href);
  });

  // Google Sheets will get *just* the image URLs
  // var gs_data = jQuery.extend(true, {}, wp_data);
  // gs_data.google_images = JSON.stringify(googleImageUrls);
  // gs_data.baidu_images = JSON.stringify(baiduImageUrls);

  // console.log('google images');
  // console.log(wp_data.google_images.substr(0, 100));

  // console.log('google image urls');
  // console.log(gs_data.google_images.substr(0, 100));

  console.log("[submitImagesToWordpress]");
  var url = config.libraryURL;
  console.log("url", url);

  chrome.runtime.sendMessage({
    type: "images_loading",
  });

  $.ajax({
    url: url,
    method: "POST",
    data: wp_data,
  })
    .done(function (rsp) {
      console.log("[submitImagesToWordpress] Done");
      console.log(rsp);
      rsp.type = "images_saved";
      chrome.runtime.sendMessage(rsp);
      callback();
    })
    .fail(function (xhr, textStatus) {
      chrome.runtime.sendMessage({
        type: "images_saved",
      });
      console.log(
        "[submitImagesToWordpress] Failed sending post to WP:",
        textStatus,
        "/",
        xhr.responseText
      );
    });

  // Send data back to server for entry into the Google spreadsheet.
  // console.log("NOTE: not saving anything to the spreadsheet")
  // console.log('Saving images to spreadsheet');
  // var url = config.serverURL + 'submit-images';
  // $.ajax({
  // 	url: url,
  // 	method: 'POST',
  // 	data: gs_data
  // }).done(function() {
  // 	console.log('Done saving images to spreadsheet');
  // 	// callback();
  // }).fail(function(xhr, textStatus) {
  // 	console.log('Failed submitting images to library: ' + textStatus + ' / ' + xhr.responseText);
  //     console.log('url', url)
  // });
}

// Looks at URL query string and extracts search term.
function getQueryMatch() {
  var regex = /[^a-zA-Z0-9](q|word)=([^&]+)/;
  var queryMatch = location.hash.match(regex);
  if (!queryMatch) {
    queryMatch = location.search.match(regex);
  }
  if (!queryMatch) {
    return null;
  }
  queryMatch = decodeURIComponent(queryMatch[2]).replace(/\+/g, " ");
  queryMatch = normalizeQuery(queryMatch);
  return queryMatch;
}

function normalizeQuery(query) {
  var normalized = query.toLowerCase().trim();
  return normalized;
}

function getSource() {
  return location.hostname
    .replace("www.", "")
    .replace("image.", "")
    .replace(".com", "");
}

function randomClientId() {
  return "Client " + (100 + Math.floor(Math.random() * 900));
}

function getGoogleDatastore() {
  var hash = window.crypto.getRandomValues(new Uint32Array(2)).toString();

  function sendVariableWithPostMessage(hash) {
    if (
      typeof AF_initDataChunkQueue != "undefined" &&
      Array.isArray(AF_initDataChunkQueue)
    ) {
      var datastoreIndex = AF_initDataChunkQueue.findIndex(function (element) {
        return element["key"] === "ds:1";
      });
      var datastore = AF_initDataChunkQueue[datastoreIndex].data;
      // Flatten datastore for convenience
      var flatDatastore = datastore.flat(Infinity);

      var message = {
        hash: hash,
        flatDatastore: flatDatastore,
      };
    } else {
      var message = {
        hash: hash,
        flatDatastore: null,
      };
    }

    window.postMessage(message, "*");
  }

  (function injectPostMessageScript() {
    var scriptContent =
      "(" + sendVariableWithPostMessage.toString() + ")('" + hash + "');";
    const scriptTag = document.createElement("script");
    const scriptBody = document.createTextNode(scriptContent);

    scriptTag.id = "getGoogleDatastore";
    scriptTag.appendChild(scriptBody);
    document.body.append(scriptTag);
  })();
  return new Promise((resolve, reject) => {
    window.addEventListener("message", function (message) {
      if (message["data"]["hash"] != hash) {
        reject("Message hash mismatch");
      } else {
        resolve(message["data"]);
      }
    });
  });
}

// slow things down so we can understand execution flow
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}
