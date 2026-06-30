const AWS = require("aws-sdk");
const path = require("path");

// Always load .env from the backend folder
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const S3_BUCKET = process.env.S3_BUCKET;

module.exports = { s3, S3_BUCKET };