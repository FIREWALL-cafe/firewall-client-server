const express = require('express');
const fs = require('fs')
const app = express();

// body parsing
app.use(express.json({limit:'10mb'})); //Used to parse JSON bodies
app.use(express.urlencoded()); //Parse URL-encoded bodies

// Add headers before the routes are defined (thanks Stack Overflow)
// https://stackoverflow.com/questions/18310394/no-access-control-allow-origin-node-apache-port-issue
app.use(function (req, res, next) {
  // Website you wish to allow to connect... it's either one, or all, unless you set it dynamically depending on origin
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Pass to next layer of middleware
  next();
});

const writeBody = (content) => {
  fs.writeFile('body.json', JSON.stringify(content), err => {
    if (err) { console.error(err) }
  })
}

const bodyContainsImageData = (body) => {
  const { google_images, baidu_images } = body;
  if(google_images && google_images.length > 0) return true
  if(baidu_images && baidu_images.length > 0) return true
  return false
}

app.get(/.*/, (request, response) => { 
  console.log('\nquery', request.query); 
  console.log('params', request.params); 
  response.json("get ok"); 
});

app.post('/saveSearchAndImages', (request, response) => {
  console.log(request.body.search, request.body.translation, bodyContainsImageData(request.body)); 
  writeBody(request.body);
  response.json("post ok"); 
});

app.post(/.*/, (request, response) => {
  console.log('\nquery', request.query); 
  console.log('params', request.params); 
  console.log('body', request.body); 
  writeBody(request.body)
  response.json("post ok"); 
});

app.listen(11458, () => { console.log("echo-server running on 11458"); });
