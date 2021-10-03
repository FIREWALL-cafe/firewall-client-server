//////////////////////////////////
//      init
//////////////////////////////////

// declare global variables
const states = {
  WAITING: 'WAITING',
  INTRO_SCREEN: 'INTRO SCREEN',
  WAITING_FOR_TRANSLATION: 'WAITING FOR TRANSLATION',
  WAITING_FOR_PAGE_LOAD: 'WAITING FOR PAGE LOAD',
  GETTING_IMAGES: 'GETTING IMAGES',
  SAVING_IMAGES: 'SAVING IMAGES',
  DONE: 'DONE'
}
const searchEngines = Object.freeze({
  google: 'google',
  baidu: 'baidu'
});
const loopInterval = 500;
const $googleQueryBox = $('[name=q]')
const $baiduQueryBox = $('input[name=word]');
const consoleHeaderCSS = "text-shadow: -1px -1px hsl(0,100%,50%); font-size: 40px;";
const disabledColor = "rgb(180,180,180,1)"
const numImages = 10;

let state = states.WAITING
let autocompleteEnabled = true
let queryData = { search: undefined, translation: undefined } // tracks overall information about the search that is currently happening
let clientId = "client-name"
let cyclesInState = 0
let currentSearchEngine = undefined; // the search engine the user is using

chrome.storage.local.get([
  'autocompleteEnabled',
  'clientId',
  'queryData',
  'state',
  'lastInteracted'
], init)

// runs once on page load
function init(storage) {
  console.log("[init] got storage object", storage)
  console.log(storage.queryData)

  // unpack storage
	if (storage.clientId) clientId = storage.clientId;
	else chrome.storage.local.set({ clientId });
  console.log('Firewall Cafe | ' + clientId);
  autocompleteEnabled = storage.autocompleteEnabled ? storage.autocompleteEnabled : autocompleteEnabled
  queryData = storage.queryData ? storage.queryData : {}
  currentSearchEngine = storage.lastInteracted
  state = storage.state ? storage.state : states.WAITING
  console.log("%c %s", consoleHeaderCSS, state);

  checkIfCorrectState()

  // set up UI
  setupUI()

  // create event listeners
  setupStorageListener()
  setupMessageListener()

  // begin main() loop
  setInterval(main, loopInterval);
}

function checkIfCorrectState() {
  // if the state we loaded from storage means we think that we're in the middle of a search,
  // but the user went back to the search homepage, then we need to clear the old search

  // if the state is not WAITING, and we're at the Google homepage,
  // change our state back to WAITING
  // console.log("[checkIfCorrectState] window.location=", window.location);
  const identity = getSearchEngine();
  if(state !== states.WAITING) {
    if (identity === 'baidu' && window.location.pathname === '/') {
      setState(states.WAITING)
    }
    if (identity === 'google' && window.location.pathname !== '/search') {
      setState(states.WAITING)
      resetTabs()
    }
  }
}

function setupUI() {
  const identity = getSearchEngine()
  // redirect to Google Images search (if needed)
  if (window.location.host == 'www.google.com' &&
      window.location.pathname == '/')
  {
	  // Google homepage => Google image search homepage
	  window.location = 'https://www.google.com/imghp';
    if(state !== states.WAITING) setState(states.WAITING)
  } else if(window.location.hash == "#intro") {
    $(document.body).addClass("firewall-intro");
  }

  $googleQueryBox.on("click", event=>setCurrentSearchEngine('google'))
  $googleQueryBox.on("keydown", event=>setCurrentSearchEngine('google'))
  $baiduQueryBox.on("click", event=>setCurrentSearchEngine('baidu'))
  $baiduQueryBox.on("keydown", event=>  {
    // hide the Baidu autocomplete menu. needs to be done on user interaction with the box
    $("#sugWrapper").css("visibility", "hidden")  
    setCurrentSearchEngine('baidu')
  })
  $baiduQueryBox.on("keydown", event=>setCurrentSearchEngine('baidu'))

  // if the user clicks the Google logo, make sure it takes them back to image search
  $("c-wiz a").attr("href", "/imghp")

  // disable google autocomplete menu
  $('[jsname=UUbT9').css("visibility", "hidden")

  // add 'Firewall' button to bottom of page that lets user edit their name & toggle autocomplete
  // TODO: figure out why the autocomplete toggle isn't working
	const suggestChecked = autocompleteEnabled ? ' checked' : '';
	$('#fsr, #lh, #ft, .wrapper_imgfrom_box').append(
		'<div id="firewall">' +
			'<a href="#firewall" id="firewall-show" class="skin_from_link">Firewall</a>' +
			'<form action="#" id="firewall-form" autocomplete="off">' +
				'<label>Client ID: <input name="client-id" id="firewall-client-id" value="' + clientId + '"></label>' +
				'<label><input type="checkbox" id="firewall-suggest"' + suggestChecked + ' /> Suggest sensitive queries</label>' +
				'<input type="submit" value="Save" />' +
			'</form>' +
		'</div>'
	);

	const $firewallShow = $('#firewall-show'),
		    $firewallForm = $('#firewall-form'),
		    $firewallClientId = $('#firewall-client-id'),
		    $firewallSuggest = $('#firewall-suggest')[0],
		    $body = $(document.body);

	$firewallShow.click(function(e) {
		e.preventDefault();
		$firewallForm.toggleClass('visible');
	});

	// On Firewall form submit, update user preferences.
	$firewallForm.submit(function(e) {
		e.preventDefault();
		clientId = $firewallClientId.val();
    autocompleteEnabled = $firewallSuggest ? $firewallSuggest.checked : false;

		chrome.storage.local.set({
			clientId,
			autocompleteEnabled
		}, function() {
			console.log('[setupUI] Autocomplete: ' + autocompleteEnabled);
			$firewallForm.removeClass('visible');
		});
		if (autocompleteEnabled) {
      console.log("autocomplete now enabled")
      $googleQueryBox.autocomplete()
			$googleQueryBox.autocomplete({
				source: sensitiveQueries
			});
			$googleQueryBox.autocomplete('enable');
			$baiduQueryBox.autocomplete('enable');
			$body.addClass('firewall-autocomplete');
		} else {
      console.log("autocomplete now disabled")
			$googleQueryBox.autocomplete('disable');
			$baiduQueryBox.autocomplete('disable');
			$body.removeClass('firewall-autocomplete');
		}
	});

  // initialize googleQueryBox for autocomplete
	// Set initial autocomplete preferences.
	if (autocompleteEnabled) {
    console.log("autocomplete is enabled")
    $googleQueryBox.autocomplete()
    $baiduQueryBox.autocomplete()
		$googleQueryBox.autocomplete({
			source: sensitiveQueries
		});
    $baiduQueryBox.autocomplete({
      source: sensitiveQueries
    });
		$body.addClass('firewall-autocomplete');
	}

  // insert message asking user to wait for images to upload
  // TODO: this is only working in Baidu; Google's tag must have changed
	const msg = 'Please wait while we archive your search results in the FIREWALL Cafe library...';
	$googleQueryBox.closest('.e3JjXb')
    .append('<div id="firewall-loading">' + msg + '</div>');
	$baiduQueryBox.closest('form')
    .append('<div id="firewall-loading">' + msg + '</div>');

  // add intro screen html
  $(document.body).append('<div id="firewall-intro">' + getIntroHTML(identity) + "</div>");
  if (identity !== "google") {
    $("#firewall-intro").addClass("inverted");
  }
  function hide_intro(e) {
    e.preventDefault();
    var name = $("#firewall-intro-name").val();
    if (name == "") {
      name = "Anonymous";
    }
    chrome.storage.local.set({
      clientId: name,
    });
    chrome.runtime.sendMessage({
      type: "close_intro",
      name: name,
    });
  }
  $("#firewall-intro-form").on("submit", hide_intro);
}

function getIntroHTML(identity) {
  let suffix
  if (identity === "google") suffix = "white";
  else suffix = "red";
  let path = "/icons/firewall-hong-kong-" + suffix + ".png";
  if (config.logoLabel != "default") {
    path = "/icons/firewall-" + config.logoLabel + "-" + suffix + ".png";
  }
  const logoURL = chrome.extension.getURL(path);
  const googleIntroHTML = `
  <img src="${logoURL}">
  <div class="text">
      <strong>Welcome to FIREWALL Cafe! Type in a name that will let you look up your search session later.</strong>
      <form action="#" id="firewall-intro-form" autocomplete="off"><input id="firewall-intro-name" placeholder="Pick a name" />
      <br><input type="submit" id="firewall-begin" value="Let’s begin!" /></form>
      <ol>
      <li>Type a search query into Google (in English, etc.) OR in Baidu (in simplified Chinese)</li>
      <li>Your query will automatically translate into the opposing browser</li>
      <li>Please be patient... the Internet in China is slow! 😉</li>
      <li>FIREWALL will archive your search to https://firewallcafe.com/</li>
      <li>Vote in the Search Archive whether your search is affected by censorship!</li>
      <li>Have fun, and view your archived search session images at <a href="https://firewallcafe.com">firewallcafe.com</a>!</li>
      </ol>
  </div>
  `;

  const baiduIntroHTML = `
  <img src="${logoURL}">
  <div class="text">
      <p>FIREWALL is an interactive digital art installation and research project designed to foster public dialogue about Internet freedom. The goal of this art project is to investigate online censorship by comparing the disparities of Google searches in western nations versus Baidu searches in China.  The motivation behind the project is to confront censorship through a participatory discovery process of Internet visual culture.</p>
      <p>FIREWALL是一个社会互动性的美术研究项目，旨在培育有关网络自由的公众对话。此美术项目通过比较西方国家的谷歌搜寻结果及中国的百度搜寻结果来探讨网路审查的问题。本项目的动机来自于利用参与性的方法和网络视觉文化来对抗网路审查。</p>
  </div>
  `;
  if (identity === 'google') return googleIntroHTML;
  else return baiduIntroHTML;
}

function setCurrentSearchEngine(engine) {
  // console.log('[setCurrentSearchEngine]', engine);
  chrome.storage.local.set({lastInteracted: engine})
}

function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if(area !== 'local') return
    // console.log("[storage onChanged] changes", changes)
    if(changes.state) {
      state = changes.state.newValue
      console.log("%c %s", consoleHeaderCSS, state)
      cyclesInState = 0
    }
    if(changes.queryData) {
      queryData = changes.queryData.newValue
      console.log("updated queryData")
      console.log(queryData)
    }
    if(changes.lastInteracted) {
      currentSearchEngine = changes.lastInteracted.newValue
      console.log("interacting with", currentSearchEngine)
    }
  })
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener(function (e) {
    console.log("[onMessage] type:", e.type);
    if (e.type == "toggle_input") {
      if (e.enabled) {
        $(document.body).removeClass("firewall-loading");
      }
    } else if (e.type == "images_loading") {
      $(document.body).addClass("firewall-loading");
    } else if (e.type == "close_intro") {
      $(document.body).removeClass("firewall-intro");
      $("#firewall-client-id").val(e.name);
    } else if (e.type == "user_activity") {
      // $(document.body).removeClass("firewall-intro");
    } else if (e.type == "popup_window_result") {
      console.log(e)
    }
  });
}

//////////////////////////////////
//      main logic flow
//////////////////////////////////
// runs every N milliseconds
// should be concise and direct all state changes
function main() {
  // get any necessary data that could change as page loads
  const searchTerm = extractSearchTermFromURL()
  const identity = getSearchEngine()

  // check if we have a new search replacing the old one; timestamp it
  // we have to check that this isn't 1) what was first typed in 2) the translation of that or 3) the translation of the previous search,
  // that is this is actually a new search that's just happened
  if(queryData && searchTerm && 
    queryData.search !== searchTerm && 
    queryData.translation !== searchTerm && 
    identity === currentSearchEngine)
  {
    console.log(queryData.search, "!==", searchTerm)
    chrome.storage.local.set({
      queryData: { 
        search: searchTerm, 
        timestamp: +new Date(), 
        oldSearch: queryData.search, 
        oldTranslation: queryData.translation
      }
    })
    if(state === states.DONE) setState(states.WAITING)
    return
  }

  // take actions based on state; state advances down then back to top
  switch(state) {
    case states.WAITING:
      // if there is no active search, don't do anything
      if(!queryData.timestamp) {
        return
      }
      if(checkIfTimedOut()) return;
      if(queryData.search) { // we have a search!
        getTranslation(queryData.search).then(response => {
          queryData = { ...queryData, ...response };
          queryData.translation = response.translated
          console.log("[main]", identity, "setting translation to", queryData.translation)
          console.log(identity, "new queryData:", queryData)
          chrome.storage.local.set({ queryData });
        })
        changeSearchesDisabled(true)
        setState(states.WAITING_FOR_TRANSLATION)
      }
      break;
    case states.INTRO_SCREEN:
    case states.WAITING_FOR_TRANSLATION:
      if(queryData.translation) {
        if(identity !== currentSearchEngine) {
          searchTranslatedQuery()
          sleep(250) // probably not necessary
          setState(states.WAITING_FOR_PAGE_LOAD)
        } else if(cyclesInState == 0) {
          console.log("[main] this is the original search engine, so no need to do anything... wait for other one to tell us it has searched")
        }
        // at this point, we'll timestamp the search so we know when to time it out
        queryData.timestamp = +new Date()
      }
      break
    case states.WAITING_FOR_PAGE_LOAD:
      if(cyclesInState == 0) $(document.body).addClass("firewall-loading");
      changeSearchesDisabled(true)
      if (cyclesInState * loopInterval > 2500) setState(states.GETTING_IMAGES)
      break
    case states.GETTING_IMAGES:
      if(cyclesInState == 0) $(document.body).addClass("firewall-loading");
      changeSearchesDisabled(true)
      console.log("[main]", identity, "queryData.images?queryData.images.length", queryData.images?queryData.images.length:"no images")
      if(queryData.googleImages !== undefined && queryData.baiduImages !== undefined) {
        console.log("[main] ready to submit images! queryData:", queryData)
        setState(states.SAVING_IMAGES)
      } else if(cyclesInState * loopInterval > 1000 * 10) {
        console.log("[main] giving up on images :(")
        queryData[identity+'Images'] = []
        setState(states.SAVING_IMAGES)
      } else if (queryData.images && queryData.images.length >= numImages) {
        console.log("[main] we're good, tell storage about it")
        queryData[identity+'Images'] = [...queryData.images]
        console.log("[main] sending this object to storage:", queryData)
        queryData.images = [];
        chrome.storage.local.set({queryData})
      } else if(queryData.banned) {
        console.log("[main] baidu says no")
        queryData[identity+'Images'] = []
        chrome.storage.local.set({queryData})
      } else {
        keepGettingImages()
      }
      break
    case states.SAVING_IMAGES:
      if (cyclesInState == 0) {
        if (getSearchEngine() === searchEngines.google) {
          console.log("[main] sending to wordpress")
          submitImagesToWordpress(() => {
            console.log("[main] submitImagesToWordpress callback, unlocking search boxes");
          })
        }
        submitImages(() => { 
          console.log("[main] submitImages callback")
          setState(states.DONE) 
        })
      } else {
        console.log("waiting for submitImages to finish")
      }
      break
    case states.DONE:
      // wait for a second for wordpress popup, then unlock search boxes
      if(cyclesInState * loopInterval > 2500 && cyclesInState * loopInterval < 5000) {
        // console.log("[main] unlocking search boxes after wait")
        changeSearchesDisabled(false)
        $(document.body).removeClass("firewall-loading");
      }
      break
  }
  cyclesInState ++
}

function changeSearchesDisabled(disable) {
  if(disable) {
    $baiduQueryBox.prop("disabled", true)
    $baiduQueryBox.css( "background-color", disabledColor)
    $baiduQueryBox.parent().css( "background-color", disabledColor)

    $googleQueryBox.prop("disabled", true)
    $googleQueryBox.parent().parent().parent().css("background-color", disabledColor)

    console.log("[changeSearchesDisabled] searches disabled")
  } else {
    $googleQueryBox.prop("disabled", false)
    $googleQueryBox.parent().parent().parent().css("background-color", "rgba(0,0,0,0)")
    
    $baiduQueryBox.prop("disabled", false)
    $baiduQueryBox.css( "background-color", "rgb(255,255,255)")
    $baiduQueryBox.parent().css("background-color", "rgba(0,0,0,0)")

    console.log("[changeSearchesDisabled] searches enabled")
  }
}

function checkIfTimedOut() {
  // check if search has timed out
  const now = +new Date()
  if(now - queryData.timestamp > 60*1000) {
    console.log("timeout")
    resetTabs()
    return true
  } else if(Math.random() * 100 < 10) {
    console.log(now - queryData.timestamp)
  }
}

function setState(newState) {
  // inform storage so other tab knows
  chrome.storage.local.set({ state: newState });
}

function extractSearchTermFromURL() {
	var regex = /[^a-zA-Z0-9](q|word)=([^&]+)/;
	var queryMatch = location.hash.match(regex);
	if (!queryMatch) {
    queryMatch = location.search.match(regex);
	}
	if (!queryMatch) {
    return null;
	}
	let query = decodeURIComponent(queryMatch[2]).replace(/\+/g, ' ');
	query = query.toLowerCase().trim();
	return query;
}

function submitImagesToWordpress(callback) {
  const wpData = {
    timestamp: queryData.timestamp,
    location: config.location,
    client: clientId,
    secret: config.wordpressSecret,
    search_engine: getSearchEngine(),
    query: queryData.search,
    translated: queryData.translation,
    lang_from: `${queryData.langFrom}`,
    lang_to: `${queryData.langTo}`,
    lang_confidence: 1,
    lang_alternate: `${queryData.langAlternate}`,
    lang_name: `${queryData.langName ? queryData.langName : queryData.langFrom === 'en' ? 'English' : queryData.langFrom}`,
    google_images: queryData.googleImages ? JSON.stringify(queryData.googleImages) : `[]`,
    baidu_images: queryData.baiduImages ? JSON.stringify(queryData.baiduImages) : `[]`,
    banned: queryData.banned ? queryData.banned : false,
    sensitive: queryData.sensitive ? queryData.sensitive : false,
  };

  console.log("[submitImagesToWordpress]");
  console.log('url', config.wordpressURL);
  console.log('wpData', wpData);

  chrome.runtime.sendMessage({
    type: "images_loading",
  });

  $.ajax({
    url: config.wordpressURL,
    method: "POST",
    data: wpData,
  })
    .done(function (rsp) {
      console.log("[submitImagesToWordpress] Done");
      console.log('wordpress response:', rsp);
      rsp.type = "create_popup";

      chrome.runtime.sendMessage({
        type: 'create_popup',
        url: rsp.permalink,
      });
    })
    .fail(function (xhr, textStatus) {
      console.log("[submitImagesToWordpress] Failed sending post to WP:", textStatus, "/", xhr.responseText);
    })
    .always(() => callback());
}

function submitImages(callback) {
  // this is what a current call looks like to /saveImages, working in Postman
  var data = {
    timestamp: queryData.timestamp,
    location: config.location,
    client: clientId,
    secret: config.apiSecret,
    search_engine: getSearchEngine(), // what should this even track? currently just logging which tab is submitting the
                                      // images to API
    search: queryData.search,
    translation: queryData.translation,
    lang_from: queryData.langFrom,
    lang_to: queryData.langTo,
    lang_confidence: queryData.langConfidence,
    lang_alternate: queryData.langAlternate,
    lang_name: queryData.langName ? queryData.langName : queryData.langFrom === 'en' ? 'English' : queryData.langFrom,
    banned: queryData.banned ? queryData.banned : false,
    sensitive: queryData.sensitive ? queryData.sensitive : false,
  };

  // prevent sending too much data
  if (data.search_engine.toLowerCase() === searchEngines.baidu)
    data.baidu_images = JSON.stringify(queryData.baiduImages);
  if (data.search_engine.toLowerCase() === searchEngines.google)
    data.google_images = JSON.stringify(queryData.googleImages);

  const url = config.apiBase + "/saveSearchAndImages";
  console.log("[submitImages] sending images to API", url, data);

  fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    // mode: 'no-cors',
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log("[submitImages] done");
      console.log("response from API:", response)
      callback();
    })
    .catch((err) => {
      console.log("[submitImages] error from API:", err)
      callback(err);
    });
}

function isChinese(langCode) {
  return ['zh-CN', 'zh-TW'].indexOf(langCode) >= 0
}

function getTranslation(searchTerm) {
	console.log('[getTranslation] translating', searchTerm);

  return $.ajax({ 
    url: config.serverURL + '/detect-language?query='+searchTerm
  }).then(res => {
    // todo: need to handle language detection failure
    console.log("[getTranslation] language detected:", res.name, "confidence:", res.confidence, res)
    const data = {
      query: searchTerm,
      searchEngine: getSearchEngine(),
      secret: config.sharedSecret,
      langFrom: res.language,
      langTo: isChinese(res.language) ? 'en' : 'zh-CN' // translate to Chinese, unless the original search term is in Chinese
    };
    queryData.langName = res.name;
    return $.ajax({
      url: config.serverURL + '/translate',
      method: 'POST',
      data: data
    }).fail(err => console.error(err))
  })
}

function getSearchEngine() {
	return location.hostname.replace('www.', '')
	                        .replace('image.', '')
	                        .replace('.com', '');
}

function searchTranslatedQuery() {
  const identity = getSearchEngine()
  // const selector = 'input[name=q], input[name=word]',
	// 	    $inputField = $(selector).first();
  console.log("[searchTranslatedQuery]", identity, queryData.translation)
  if (identity === 'baidu') {
    $baiduQueryBox.prop("disabled", false)
    $baiduQueryBox.val(queryData.translation);
    $baiduQueryBox.first().closest('form').submit();
    $baiduQueryBox.prop("disabled", true)
  } else {
    $googleQueryBox.prop("disabled", false)
    $googleQueryBox.val(queryData.translation);
    $googleQueryBox.first().closest('form').submit();
    $googleQueryBox.prop("disabled", true)
  }
  console.log("[searchTranslatedQuery] done")
}

// this is meant to be called each update cycle until we either give up or have the number of images we want
function keepGettingImages() {
  const identity = getSearchEngine()

  // If getting images from Baidu, look for the phrase indicating banned search.
  if (identity === "baidu") {
    const banned = $('body:contains("根据相关法律法规和政策，部分搜索结果未予显示")').length > 0;
    if (banned) {
      queryData.banned = true;
    } else {
      queryData.banned = false;
    }
  }

  function _dedupeLimitedSet(imageSet, image, flatDatastore) {
    var dupe = false;
    var url = null;

    if (identity === "baidu") {
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
    } else if (identity === "google" && typeof flatDatastore != "undefined") {
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

  // load whatever half-saved image set we have
  let images = queryData.images ? queryData.images : [];

  // Get Google datastore if relevant
  if (identity === "google") {
    getGoogleDatastore() // black magic function which extracts higher-res images from an object
      .catch((error) => {
        console.error(error);
      })
      .then((data) => {
        // Get Google image URIs
        if (!data) {
          // console.log('google datastore is not defined');
          return;
        }
        // console.log("[keepGettingImages] got google datastore")
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

  queryData["images"] = images;

  console.log(`[keepGettingImages] ${identity} has ${images.length} images`)
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
  console.log('...')
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function resetTabs() {
  const identity = getSearchEngine()
  queryData = {}
  // TODO: without taking search term out of URL, the code will just start
  // on with the same search again since it's in the URL. Redirect to main
  // search page would be best
  // if (identity === 'google' && window.location.pathname === '/search')
  if (identity === 'google')
  {
    // Google homepage => Google image search homepage
    window.location = 'https://www.google.com/imghp';
    console.log("redirecting to google.com")
  } else if (identity === 'baidu'){
    window.location = 'https://image.baidu.com';
    console.log("redirecting to baidu homepage")
  }
  chrome.storage.local.set({ queryData })
  setState(states.WAITING)
}
