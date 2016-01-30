# Firewall Cafe

* [Joyce Yu-Jean Lee](http://www.joyceyujeanlee.com/)
* [Dan Phiffer](https://phiffer.org/)

## Project description

A month-long Pop-Up Internet Cafe, FIREWALL is a socially engaged research and interactive art installation designed to foster public dialogue about Internet freedom. The goal of this art project is to investigate online censorship by comparing the disparities of Google searches in the U.S.A. versus Baidu searches in China.

This software is composed of a server and client.

## Server

The translation service is written in [node.js](http://nodejs.org/) and translates search queries from English to Chinese, and from Chinese to English using the [Google Translate API](https://cloud.google.com/translate/docs). These translations are stored in a Google Spreadsheet where the machine-generated translations can be overridden by human translators, and where resulting images from Google's and Baidu's image search can be stored by the client.

### Setup

1. Go to the [Google Cloud credentials](https://console.cloud.google.com/apis/credentials) page  
	* Download a service account key JSON file for the Google Spreadsheet API and save it as `translation/service-key.json`
	* Register an Translation API key, with your server's IP address
2. Create a Google spreadsheet based on [this template](https://docs.google.com/spreadsheets/d/1bhoMy4bwZyr58a2pnnxYD4JQogOpAgqqMtSUQIZLz_Q/edit?usp=sharing)  
 	* One tab for each language translation (`en to zh-CN`, `zh-CN to en`, `zh-TW to en`), each with the columns `query`, `google` (machine translation), `override` (human translation)
	* One tab called `images` with columns: `query_en`, `query_zh`, `featured` (for integration with the blog), `google`, `baidu`
3. Open `service-key.json` and share the Google Spreadsheet with `client_email`
4. Copy `config-example.js` to `config.js` and edit the `apiKey` and `spreadsheetId` values

### Usage

```
cd firewall-cafe/server/
node index.js
```
