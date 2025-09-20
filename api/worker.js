const { parentPort, workerData } = require('worker_threads');
const http = require('http');
const https = require('https');
const config = require('./config.js');
const { pool } = config;
const space = require('./spaces-interface.js');

const { google_images, baidu_images, searchId } = workerData;

async function saveImages(google_images, baidu_images, searchId) {
  console.log('worker: saving images for: ', searchId);

  if (google_images.length === 0 && baidu_images.length === 0) {  
    console.log("worker: No images provided.");
    return;
  }

  downloadImages('google', searchId, google_images);
  downloadImages('baidu', searchId, baidu_images);
}

const downloadImages = (engine, searchId, images) => {
  const imageQueries = [];

  for (const url of images) {
    let client = (url.toString().indexOf("https") === 0) ? https : http;

    client.request(url, function (response) {
      var data = [];

      response.on('data', function (chunk) {
        data.push(chunk);
      });

      response.on('end', async function () {
        const timestamp = Date.now();
        try {
          const newUrl = await uploadImageContent(Buffer.concat(data), url);
          if (newUrl) {
            const query = `INSERT INTO images (search_id, image_search_engine, image_href, image_href_original, image_timestamp) VALUES ($1, $2, $3, $4, $5)`;
            const values = [searchId, engine, newUrl, url, timestamp];
            const dbQuery = pool.query(query, values);
            imageQueries.push(dbQuery);
          } else {
            const query = `INSERT INTO images (search_id, image_search_engine, image_href, image_timestamp) VALUES ($1, $2, $3, $4)`;
            const values = [searchId, engine, url, timestamp];
            const dbQuery = pool.query(query, values);
            imageQueries.push(dbQuery);
          }
        } catch (error) {
          console.log('worker: error uploading image:', error);
          const query = `INSERT INTO images (search_id, image_search_engine, image_href, image_timestamp) VALUES ($1, $2, $3, $4)`;
          const dbQuery = pool.query(query, [searchId, engine, url, timestamp]);
          imageQueries.push(dbQuery);
        }
      });
    }).end();
  }
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
        return newUrl;
    } catch (error) {
        console.log('worker: error:' , error);
        return;
    }
};

const respond = async () => {
  const message = await saveImages(google_images, baidu_images, searchId);
  parentPort.postMessage(message);
}

respond();