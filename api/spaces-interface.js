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


// TODO: need to hash check if file already exists
const saveImage = async (binary_data) => {
    // Setting up S3 upload parameters
    const params = {
        Bucket: config.bucket,
        Key: 'test.jpg', // File name you want to save as in S3
        Body: binary_data
    };

    // Uploading files to the bucket
    return s3.upload(params, (err,data) => console.log(data.Location)).promise().then(data => data.Location, err => err);
}

module.exports = {
    saveImage
}