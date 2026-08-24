const { S3Client } = require("@aws-sdk/client-s3");

const spaces = new S3Client({
  region: process.env.DO_SPACES_REGION,
  endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY
  }
});

module.exports = { spaces };
