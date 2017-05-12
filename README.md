# Firewall Cafe

* [Joyce Yu-Jean Lee](http://www.joyceyujeanlee.com/)
* [Dan Phiffer](https://phiffer.org/)
* [Rachel Nackman](http://www.rachelnackman.com/)

## Project description

A month-long Pop-Up Internet Cafe, FIREWALL is a socially engaged research and interactive art installation designed to foster public dialogue about Internet freedom. The goal of this art project is to investigate online censorship by comparing the disparities of Google searches in the U.S.A. versus Baidu searches in China.

## Clone the repository

If you're okay with the command line and `git` commands, use this method:

```
cd path/to/somewhere/cool
git clone https://github.com/dphiffer/firewall-cafe.git
```

Then if you want to download updates, you can do this:

```
cd path/to/somewhere/cool/firewall-cafe
git pull
```

## Download the zip file

Alternatively, if you'd prefer to avoid using `git`, just download and unzip the [latest archive](https://github.com/dphiffer/firewall-cafe/archive/master.zip).

## Server

The translation service is written in [node.js](http://nodejs.org/) and translates search queries from English to Chinese, and from Chinese to English using the [Google Translate API](https://cloud.google.com/translate/docs). These translations are stored in a Google Spreadsheet where the machine-generated translations can be overridden by human translators, and where resulting images from Google's and Baidu's image search can be stored by the client.

If you're working on the existing dev spreadsheet:
1. Ask Dan for access to the secret gist file containing four files.
2. Place `service-key.json` and `config.js` in the `server` directory.
3. Create a subdirectory `server/ssl` and place `localhost.key` and `localhost.crt` within.

If you're starting a new spreadsheet from scratch:

1. Go to the [Google Cloud credentials](https://console.cloud.google.com/apis/credentials) page  
	* Download a service account key JSON file for the Google Spreadsheet API and save it as `translation/service-key.json`
	* Register a Translation API key, with your server's IP address
2. Create a Google spreadsheet based on [this template](https://docs.google.com/spreadsheets/d/1bhoMy4bwZyr58a2pnnxYD4JQogOpAgqqMtSUQIZLz_Q/edit?usp=sharing)  
 	* One tab for each language translation (`en to zh-CN`, `zh-CN to en`, `zh-TW to en`), each with the columns `query`, `google` (machine translation), `override` (human translation)
	* One tab called `images` with columns: `query`, `query_zh`, `source`, `featured` (for integration with the blog), and `images`
3. Look inside `server/service-key.json` to find the `client_email` value, then share the Google Spreadsheet with that email address
4. Copy `server/config-example.js` to `server/config.js`, edit `apiKey`, `spreadsheetId`, and set paths to your `sslKey` and `sslCert`

If you use a Mac, [this article](http://brianflove.com/2014/12/01/self-signed-ssl-certificate-on-mac-yosemite/) might be helpful for generating a self-signed SSL certificate for testing purposes.

## Client

The client is implemented as a browser extension for Google Chrome.

1. Copy `client/config-example.js` to `client/config.js`. Edit `serverURL` and `sharedSecret`.
2. Go to Chrome's __Settings__ pane (under the hamburger menu, or with `cmd-comma`)
3. Choose the __Extensions__ tab
4. Enable the __Developer__ checkbox
5. Click the __Load unpacked extension__ button
6. Choose the `firewall-cafe/client` folder

Any time you update the code from GitHub, be sure to click the __Reload__ link to update the extension.

## Usage

If you're using a port number below 1024, you will need to use `sudo` on the node command.

```
cd path/to/somewhere/cool/firewall-cafe/server
node index.js
```

*If you're on Ubuntu, you'll want to run this as `nodejs index.js` (also, you may need `sudo` if your port number is under 1024.)*

Load up https://localhost:4430/ and you should see a mostly blank page. We're almost done!

When you load up [Google Image](https://www.google.com/imghp) or [Baidu Image](http://image.baidu.com/) search pages with your browser extension installed, you should see a discreet __Firewall__ link in the footer of the page. For each browser client, assign your desired server URL and the language translation pairs (e.g., `en` to `zh-CN` and `zh-CN` to `en`).

If you search for something in one browser, that phrase should be translated by the server and plugged into the other search engine. A comparison of the resulting images will appear on the server's home page.

(the end)
