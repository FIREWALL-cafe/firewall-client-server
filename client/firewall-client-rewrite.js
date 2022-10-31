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
let autocompleteEnabled = false;
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
async function init(storage) {
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
  if (getSearchEngine() === searchEngines.baidu)
    setTimeout(() => setupUI(), 300)
  else setupUI()

  // create event listeners
  setupStorageListener()
  setupMessageListener()

  // begin main() loop
  setInterval(await main, loopInterval);
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
  console.log('[setupUI] appending intros...')
  const identity = getSearchEngine()
  // redirect to Google Images search (if needed)
  if (window.location.host == 'www.google.com' &&
      window.location.pathname == '/')
  {
	  // Google homepage => Google image search homepage
	  window.location = 'https://www.google.com/imghp';
    if(state !== states.WAITING) setState(states.WAITING)
  // } else if (window.location.hash == "#intro") {
  } else if (!window.location.href.includes('/search')) {
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
    console.log('[hide_intro]', e)
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

  const getGoogleIntroHTML = (version) => {
    const translation = {
      default: `
        <ol>
          <li>Type a search query into Google (in English, etc.) OR in Baidu (in simplified Chinese)</li>
          <li>Your query will automatically translate into the opposing browser</li>
          <li>Please be patient... the Internet in China is slow! 😉</li>
          <li>FIREWALL will archive your search to https://firewallcafe.com/</li>
          <li>Vote in the Search Archive whether your search is affected by censorship!</li>
          <li>Have fun, and view your archived search session images at <a href="https://firewallcafe.com">firewallcafe.com</a>!</li>
        </ol>
      `,
      taiwanese: `
        <p>SEARCH SESSION INSTRUCTIONS</p>
        <p>搜索流程說明</p>

        <ol>
          <li>
            Type a search query into Google (in English) OR in Baidu (in Chinese), making sure each search engine is a separate window.<br/>在谷歌搜索以英文輸入, 或在百度以中文輸入你想搜尋的關鍵字 並請確定兩個搜索引擎在兩個獨立視窗。
          </li>
          <li>
            Please be patient while your search saves (the search bar will grey out).<br/>搜索需時, 請耐心等待（搜索欄會轉灰）。
          </li>
          <li>
            A voting window will pop-up after your search. Click the buttons to vote whether your results are censored.<br/>完成搜索後, 你將看見一視窗彈出, 按下視窗中的按鈕, 投選你認為你的搜索有沒有被審查。
          </li>
        </ol>
      `
    }

    return `
      <img src="${logoURL}">
      <div class="text">
        <strong>Welcome to FIREWALL Cafe! Type in a name that will let you look up your search session later.</strong>
        <form action="#" id="firewall-intro-form" autocomplete="off">
          <input id="firewall-intro-name" placeholder="Pick a name" />
          <br>
          <input type="submit" id="firewall-begin" value="Let's begin!" />
        </form>
        ${translation[version.toLowerCase()] || translation['default']}
      </div>
    `;
  }

  const getBaiduIntroHTML = (version) => {
    const translation = {
      default: `
        <p>FIREWALL是一个社会互动性的美术研究项目, 旨在培育有关网络自由的公众对话。此美术项目通过比较西方国家的谷歌搜寻结果及中国的百度搜寻结果来探讨网路审查的问题。本项目的动机来自于利用参与性的方法和网络视觉文化来对抗网路审查。</p>
      `,
      taiwanese: `
        <p>FIREWALL是一個社會參與及非營利的互動藝術項目, 目的是與公眾展開有關網絡自由的對話。此藝術項目透過比較西方國家的谷歌搜尋結果及中國的百度搜尋結果來探討網路審查的問題。我們希望以參與式藝術和發掘網絡視覺文化的過程, 來批判網路審查。</p>
      `,
    };

    return `<img src="${logoURL}">
    <div class="text">
        <p>FIREWALL is a not-for-profit socially engaged research and interactive art project designed to foster public dialogue about Internet freedom. The goal of this art project is to investigate online censorship by comparing the disparities of Google searches in western nations versus Baidu searches in China. The motivation behind the project is to confront censorship through a participatory discovery process of Internet visual culture.</p>
        ${translation[version.toLowerCase()] || translation['default']}
    </div>
    `;
  };

  if (identity === 'google') return getGoogleIntroHTML(config.language);
  else return getBaiduIntroHTML(config.language);
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
      console.log('[close_intro]', e)
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
async function main() {
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
      if(queryData.baiduImages) {
        console.log("[main] ready to submit images! queryData:", queryData)
        setState(states.SAVING_IMAGES)
      } else if(cyclesInState * loopInterval > 1000 * 10) {
        console.log("[main] giving up on images :(")
        // queryData[identity+'Images'] = []
        setState(states.SAVING_IMAGES)
      } else if (queryData.images && queryData.images.length) {
        console.log("[main] we're good, tell storage about it")
        queryData[identity+'Images'] = [...queryData.images]
        console.log("[main] sending this object to storage:", queryData)
        queryData.images = [];
        chrome.storage.local.set({ queryData })
      } else if(queryData.banned) {
        console.log("[main] banned in " + identity)
        queryData[identity+'Images'] = []
        chrome.storage.local.set({ queryData })
      } else {
        await keepGettingImages()
      }
      break
    case states.SAVING_IMAGES:
      if (cyclesInState == 0) {
        if (getSearchEngine() === searchEngines.google) {
          submitImages(() => {
            console.log("[main] submitImages callback")
            console.log("[main] sending to wordpress")
            submitImagesToWordpress(() => {
              console.log("[main] submitImagesToWordpress callback, unlocking search boxes");
              setState(states.DONE)
          })
          })
        }
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
  console.log('[submitImagesToWordpress] queryData', queryData)
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
    google_images: queryData.googleImages ? queryData.googleImages : `[]`,
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
  console.log('[submitImages] queryData', queryData)
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
    queryURL: window.location.href,
  };

  // prevent sending too much data
  if (data.search_engine.toLowerCase() === searchEngines.baidu)
    data.baidu_images = JSON.stringify(queryData.baiduImages);
  if (data.search_engine.toLowerCase() === searchEngines.google)
    data.google_images = JSON.stringify(queryData.googleImages && queryData.googleImages.slice(0,10));

  const url = config.apiBase + "/saveSearchAndImages";
  console.log("[submitImages] sending images to API", url, data);

  fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    // mode: 'no-cors',
    // credentials: 'include',
    headers: {
      "Content-Type": "application/json",
      // "Accept": "application/json",
    },
  })
    .then(async (response) => {
      console.log("[submitImages] done");
      console.log("response from API:", response);
      // marshall the response
      const rb = await response.body;
      const reader = rb.getReader();
      const stream = await new ReadableStream({
        start(controller) {
          // The following function handles each data chunk
          function push() {
            // "done" is a Boolean and value a "Uint8Array"
            reader.read().then(({ done, value }) => {
              // If there is no more data to read
              if (done) {
                console.log('done', done);
                controller.close();
                return;
              }
              // Get the data and send it to the browser via the controller
              controller.enqueue(value);
              // Check chunks by logging to the console
              // console.log(done, value);
              push();
            });
          }

          push();
        },
      });
      // Respond with our stream
      const result = await new Response(stream, { headers: { 'Content-Type': 'text/html' } }).text()
      // refetch images in server and return the first few results
      // this method is more reliable for downloading images for now
      queryData.googleImages = JSON.parse(result).googleImages;
      console.log('[submitImages] returned. queryData', queryData)
      callback();
    })
    .catch((err) => {
      console.log("[submitImages] error from API:", err)
      callback(err);
    });
}

function isChinese(langCode) {
  return ['zh-CN', 'zh-TW'].includes(langCode);
}

function getTranslation(searchTerm) {
	console.log('[getTranslation] translating', searchTerm);

  return $.ajax({ 
    url: config.serverURL + '/detect-language?query='+searchTerm
  }).then(res => {
    // todo: need to handle language detection failure
    console.log("[getTranslation] language detected:", res.name, res.language, "confidence:", res.confidence, res)
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
async function keepGettingImages() {
  const identity = getSearchEngine()

  // If getting images from Baidu, look for the phrase indicating banned search.
  if (identity === "baidu") {
    // const banned = $('body:contains("根据相关法律法规和政策，部分搜索结果未予显示")').length > 0;
    const banned = $('#pnlBeforeImgList').css('display') !== 'none';
    if (banned) {
      console.log('banned in baidu')
      queryData.banned = true;
    } else {
      queryData.banned = false;
    }
  }
  queryData.banned = false;

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

  if (identity === "baidu") {
    // Get Baidu image URIs
    $(".imglist img").each(function (index, element) {
      _dedupeLimitedSet(images, element);
    });

    queryData.images = [...images];
  }

  console.log(`[keepGettingImages] ${identity} has ${images.length} images`)
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
