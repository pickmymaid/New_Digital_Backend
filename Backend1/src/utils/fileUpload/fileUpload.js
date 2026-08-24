const { v4: uuidv4 } = require("uuid");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const { spaces } = require("../../config/spaces.client");


const uploadimage = async (file) => {
  const allowedFileTypes = ["jpg", "jpeg", "png", "webp"];

  // YYYY-MM-DD (same as your code)
  const newdate = new Date().toLocaleDateString("fr-CA");

  const ext = file.name.split(".").pop().toLowerCase();

  if (!allowedFileTypes.includes(ext)) {
    throw new Error(
      `Invalid file type. Only ${allowedFileTypes.join(", ")} allowed`
    );
  }

  const filename = `${Date.now()}-${uuidv4()}.${ext}`;
  const filepath = `images/${newdate}/${filename}`;

  // file.data is available in express-fileupload
  const buffer = file.data;

  await spaces.send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: filepath,
      Body: buffer,
      ContentType: mime.lookup(ext) || "application/octet-stream",
      CacheControl: "public, max-age=31536000"
    })
  );

  // FULL CDN URL (store this in DB)
  const fileUrl = `${filepath}`;

  return fileUrl;
};

module.exports = { uploadimage };
