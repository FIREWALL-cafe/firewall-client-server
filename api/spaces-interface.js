const AWS = require('aws-sdk');
const fs = require('fs'); // Needed for example below
const config = require('./config.js').spaces;
const spacesEndpoint = new AWS.Endpoint(`${config.region}.digitaloceanspaces.com`);
AWS.config.update({
    region: config.region,
    endpoint: spacesEndpoint,
    accessKeyId: config.SPACES_KEY,
    secretAccessKey: config.SPACES_SECRET
})
const s3 = new AWS.S3();

s3.listObjects({Bucket: config.bucket}, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
        data['Contents'].forEach(function(obj) {
            console.log(obj['Key']);
        })
    };
});