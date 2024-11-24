const AWS = require('aws-sdk');
// const fs = require('fs'); // Needed for example below
const config = require('./config.js').spaces_config;
const spacesEndpoint = new AWS.Endpoint(`${config.region}.digitaloceanspaces.com`);
AWS.config.update({
    region: config.region,
    endpoint: spacesEndpoint,
    accessKeyId: config.SPACES_KEY,
    secretAccessKey: config.SPACES_SECRET
})
const s3 = new AWS.S3();

const filenameFromUrl = (url) => {
    const charset = '.`\'"()[]{}\\;&%@,-=+$:/<>~ ?';
    let fname = '';
    if(url.indexOf('://') >= 0) url = url.split('://')[1];
    if(url.slice(url.length-4, url.length) === '.jpg') url = url.slice(0, url.length-4);

    [...url].forEach(char => {
        fname += charset.indexOf(char) < 0 ? char : '_';
    })
    return fname;
}

const getFilenameFromUrl= (url) => {
  const pathname = new URL(url).pathname;
  return pathname.substring(pathname.lastIndexOf('/') + 1);
}

const saveImage = async (binary_data, url) => {
    // Setting up S3 upload parameters
    const params = {
        Bucket: config.bucket,
        Key: 'images/' + getFilenameFromUrl(url),
        Body: binary_data, 
        ACL: "public-read",
        ContentType: 'image/jpeg'
    };

    // Uploading files to the bucket
    return s3.upload(params, (err,data) => console.log(data.Location)).promise().then(data => data.Location, err => err);
}

module.exports = {
    saveImage
}