const { parentPort, workerData } = require('worker_threads');
const http = require('http');
const https = require('https');
const config = require('./config.js');
const { pool } = config;
const space = require('./spaces-interface.js');

const { google_images, baidu_images, searchId } = workerData;

async function saveImages(google_images, baidu_images, searchId) {
  console.log('worker: saving images for: ', searchId);
  console.log('worker: google_images', google_images);
  console.log('worker: baidu_images', baidu_images);

  if (google_images.length === 0 && baidu_images.length === 0) {  
    console.log("worker: No images provided.");
    return;
  }

  const query = `INSERT INTO images (search_id, image_search_engine, image_href) VALUES ($1, $2, $3)`;
  
  downloadImages('google', query, searchId, google_images);
  downloadImages('baidu', query, searchId, baidu_images);

  console.log(imageQueries);
  return imageQueries;
}

const downloadImages = (engine, query, searchId, images) => {
  const imageQueries = [];

  for (const url of images) {
    console.log('worker: saving image', url);
    let client = (url.toString().indexOf("https") === 0) ? https : http;
    let newUrl = null;

    client.request(url, function (response) {
      var data = [];

      response.on('data', function (chunk) {
        data.push(chunk);
      });

      response.on('end', function () {
        console.log(searchId, engine, url)
        newUrl = uploadImageContent(Buffer.concat(data), url);
      });
    }).end();
  
    imageQueries.push(pool.query(query, [searchId, engine, newUrl ? newUrl : url]));
  }
  console.log('worker: imageQueries', imageQueries.length);
  return imageQueries;
}

const uploadImageContent = async (content, href) => {
    let fileContent;
    try {
        fileContent = Buffer.from(content, 'binary');
    } catch {
        console.log("worker: Needs an image string to convert to binary.");
        return;
    }

    let newUrl;
    try {
        newUrl = await space.saveImage(fileContent, href);
        console.log('worker: saved new image', newUrl);
        return newUrl;
    } catch (error) {
        console.log('worker: error:' ,err);
        return;
    }
};

const respond = async () => {
  const message = await saveImages(google_images, baidu_images, searchId);
  parentPort.postMessage(message);
}

respond();