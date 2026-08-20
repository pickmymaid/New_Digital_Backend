import { S3Client } from "@aws-sdk/client-s3";

export const spaces = new S3Client({
  region: process.env.DO_SPACES_REGION!,
  endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY!,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY!
  }
});
