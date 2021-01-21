const AWS = require('aws-sdk');
// const fs = require('fs'); // Needed for example below
const config = require('./config.js').spaces;
const spacesEndpoint = new AWS.Endpoint(`${config.region}.digitaloceanspaces.com`);
AWS.config.update({
    region: config.region,
    endpoint: spacesEndpoint,
    accessKeyId: config.SPACES_KEY,
    secretAccessKey: config.SPACES_SECRET
})
const s3 = new AWS.S3();

const filenameFromUrl = (url) => {
    const charset = 'abcdefghijklmnopqrstuvwxyz1234567890';
    let fname = '';
    [...url.split('://')[1]].forEach(char => {
        fname += charset.indexOf(char) >= 0? char : '_';
    })
    return fname;
}

const saveImage = async (binary_data, url) => {
    // Setting up S3 upload parameters
    const params = {
        Bucket: config.bucket,
        Key: 'images/' + filenameFromUrl(url) + '.jpg',
        Body: binary_data, 
        ACL: "public-read"
    };

    // Uploading files to the bucket
    return s3.upload(params, (err,data) => console.log(data.Location)).promise().then(data => data.Location, err => err);
}

module.exports = {
    saveImage
}