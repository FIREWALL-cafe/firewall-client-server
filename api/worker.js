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

    const imageQueries = [];
    // for each given URL, call that psql query with that value
  for (const url of google_images) {         
    console.log('worker: saving google image', url);
    let client = http;
    let newUrl = null;

    if (url.toString().indexOf("https") === 0) {
        client = https;
    }

    client.request(url, function (response) {    
      var data = [];                                                    

      response.on('data', function (chunk) {     
        data.push(chunk);                                                         
      });                                                                         

      response.on('end', function () {
        console.log(
            searchId,
            'google',
            url, // TODO: phashed image ref
        )
        newUrl = uploadImageContent(Buffer.concat(data), url);
      });
      
    }).end();    
    imageQueries.push(pool.query(
        query,
        [
            searchId,
            'google',
            newUrl ? newUrl : url,
        ]
    ))
  }
  console.log(imageQueries);
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
  parentPort.postMessage(await saveImages(google_images, baidu_images, searchId));
}

respond();