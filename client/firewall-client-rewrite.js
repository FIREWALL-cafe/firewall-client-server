//////////////////////////////////
//      init
//////////////////////////////////

// declare global variables
const states = {
  WAITING: 'WAITING',
  INTRO_SCREEN: 'INTRO_SCREEN',
  WAITING_FOR_TRANSLATION: 'WAITING_FOR_TRANSLATION',
  WAITING_FOR_PAGE_LOAD: 'WAITING_FOR_PAGE_LOAD',
  GETTING_IMAGES: 'GETTING_IMAGES', 
  SAVING_IMAGES: 'SAVING_IMAGES'
}
const loopInterval = 5000;
const $googleQueryBox = $('[name=q]');
const consoleHeaderCSS = "text-shadow: -1px -1px hsl(0,100%,50%); font-size: 40px;";

let state = states.WAITING
let autocompleteEnabled = true
let queryData = {} // tracks overall information about the search that is currently happening
let clientId = "client-name"

chrome.storage.local.get([
  'autocompleteEnabled',
  'clientId',
  'queryData',
  'state'
], init)

// runs once on page load
function init(storage) {
  console.log("[init] got storage object:", storage)

  // unpack storage
	if (storage.clientId) clientId = storage.clientId;
	else chrome.storage.local.set({ clientId });
  console.log('Firewall Cafe | ' + clientId);
  autocompleteEnabled = storage.autocompleteEnabled
  queryData = storage.queryData ? storage.queryData : {}
  state = storage.state ? storage.state : states.WAITING
  console.log("%c %s", consoleHeaderCSS, state);

  checkIfCorrectState()

  // set up UI
  setupUI()

  // create event listeners
  setupStorageListener()

  // begin main() loop
  setInterval(main, loopInterval);
}

function checkIfCorrectState() {
  // if the state we loaded from storage means we think that we're in the middle of a search,
  // but the user went back to the search homepage, then we need to clear the old search

  // if the state is not WAITING, and we're at the Google homepage,
  // change our state back to WAITING
  console.log("[checkIfCorrectState] window.location=", window.location);
  const identity = getSearchEngine();
  if(state !== states.WAITING) {
    if (identity === 'baidu' && windlow.location.pathname === '/') {
      setState(states.WAITING)
    }
    if (identity === 'google' && window.location.pathname !== '/search') {
      setState(states.WAITING)
    }
  }
}

function setupUI() {
  // redirect to Google Images search (if needed)
  if (window.location.host == 'www.google.com' &&
      window.location.pathname == '/') 
  {
	  // Google homepage => Google image search homepage
	  window.location = 'https://www.google.com/imghp';
    if(state !== states.WAITING) setState(states.WAITING)
  }

  // console.log('[setupUI] Setting up UI...');

  // add 'Firewall' button to bottom of page that lets user edit their name & toggle autocomplete
  // TODO: figure out why the autocomplete toggle isn't working
	const suggestChecked = autocompleteEnabled ? ' checked' : '';
	$('#fsr, #lh, #ft, .wrapper_imgfrom_box').append(
		'<div id="firewall">' +
			'<a href="#firewall" id="firewall-show" class="skin_from_link">Firewall</a>' +
			'<form action="#" id="firewall-form" autocomplete="off">' +
				'<label>Client ID: <input name="client-id" id="firewall-client-id" value="' + clientId + '"></label>' +
				// '<label><input type="checkbox" id="firewall-suggest"' + suggestChecked + ' /> Suggest sensitive queries</label>' +
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
		autocompleteEnabled = $firewallSuggest.checked;

		storage.set({
			clientId,
			autocompleteEnabled
		}, function() {
			console.log('[setupUI] Autocomplete: ' + autocompleteEnabled);
			$firewallForm.removeClass('visible');
		});
    
		if (autocompleteEnabled) {
			$googleQueryBox.autocomplete({
				source: sensitiveQueries
			});
			$googleQueryBox.autocomplete('enable');
			$body.addClass('firewall-autocomplete');
		} else {
			$googleQueryBox.autocomplete('disable');
			$body.removeClass('firewall-autocomplete');
		}
	});

	// Set initial autocomplete preferences.
	if (autocompleteEnabled) {
		$googleQueryBox.autocomplete({
			source: sensitiveQueries
		});
		$body.addClass('firewall-autocomplete');
	}

  // insert message asking user to wait for images to upload
  // TODO: this is only working in Baidu; Google's tag must have changed
	// const msg = 'Please wait while we archive your search results in the FIREWALL Cafe library...';
	// $('#lst-ib').closest('.sbtc').append('<div id="firewall-loading">' + msg + '</div>');
	// $('#kw').closest('form').append('<div id="firewall-loading">' + msg + '</div>');
}

function setupStorageListener() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if(area !== 'local') return
    console.log("[storage onChanged] changes", changes)
    if(changes.state) {
      state = changes.state.newValue
      console.log("%c %s", consoleHeaderCSS, state)
    }
    if(changes.queryData) {
      queryData = changes.queryData.newValue
      console.log("updated queryData to", queryData)
    }
  })
}

//////////////////////////////////
//      main logic flow
//////////////////////////////////
// runs every 100 ms
// should be as concise as possible while directing all state changes
function main() {
  // get any necessary data that could change as page loads
  const searchTerm = extractSearchTermFromURL()
  const identity = getSearchEngine()

  // check if we have a new search replacing the old one; timestamp it
  if(queryData && searchTerm && queryData.search !== searchTerm) {
    console.log(queryData.search, "!==", searchTerm)
    chrome.storage.local.set({queryData: { search: searchTerm, timestamp: +new Date()}})
    return
  }

  // take actions based on state; state advances down then back to top
  switch(state) {
    case states.WAITING:
      // if there is no active search, don't do anything
      if(!queryData.timestamp) {
        return
      }
      // check if search has timed out
      const now = +new Date()
      if(now - queryData.timestamp > 60*1000) {
        console.log("timeout")
        resetTabs()
        return
      }
      if(searchTerm) { // we have a search!
        queryData.search = searchTerm
        getTranslation(searchTerm).then(response => {
          queryData.translation = response.translated
          console.log("[main]", identity, "setting translation to", queryData.translation)
          chrome.storage.local.set({queryData})
        })
        setState(states.WAITING_FOR_TRANSLATION)
      }
    case states.INTRO_SCREEN:
    case states.WAITING_FOR_TRANSLATION:
      if(queryData.translation) {
        if(identity === 'baidu') {
          searchTranslatedQuery()
          setState(states.WAITING_FOR_PAGE_LOAD)
        } else {
          console.log("[main] we're not baidu, so no need to do anything... wait for Baidu to tell us it has searched")
        }
        // at this point, we'll timestamp the search so we know when to time it out
        queryData.timestamp = +new Date()
      }
    case states.WAITING_FOR_PAGE_LOAD:
    case states.GETTING_IMAGES:
    case states.SAVING_IMAGES: 
      console.log('[main]', identity, 'state:', state)
  }
}

function setState(newState) {
  // inform storage so other tab knows
  chrome.storage.local.set({ state: newState })
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

function getTranslation(searchTerm) {
	console.log('[getTranslation] translating', searchTerm);

	var data = {
		query: searchTerm,
		searchEngine: getSearchEngine(),
		secret: config.sharedSecret,
        langFrom: "EN",
        langTo: "zh-CN"
	};
	return $.ajax({
		url: config.serverURL + 'translate',
		method: 'POST',
		data: data
	}).fail(err => console.error(err))
}

function getSearchEngine() {
	return location.hostname.replace('www.', '')
	                        .replace('image.', '')
	                        .replace('.com', '');
}

function searchTranslatedQuery() {
  const identity = getSearchEngine()
  // TODO: this doesn't seem to be working for Baidu
  const selector = 'input[name=q], input[name=word]',
		    $inputField = $(selector).first();
  console.log("[searchTranslatedQuery]", identity, $inputField)
  $inputField.val(queryData.translation);
	// console.log($inputField.first().closest('form'));
	$inputField.first().closest('form').submit();
  console.log("[searchTranslatedQuery] done")
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
  console.log('[resetTabs', identity, window.location)
  if (identity === 'google' && window.location.pathname === '/search') 
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