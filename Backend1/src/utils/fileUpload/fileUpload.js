const { v4: uuidv4 } = require("uuid");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const { spaces } = require("../../config/spaces.client");

// Uploads an express-fileupload file to Spaces under `<folder>/<YYYY-MM-DD>/`
// and returns the object key (stored in DB; the frontend prefixes the CDN URL).
const uploadToSpaces = async (file, allowedFileTypes, folder) => {
  // YYYY-MM-DD (same as your code)
  const newdate = new Date().toLocaleDateString("fr-CA");

  const ext = file.name.split(".").pop().toLowerCase();

  if (!allowedFileTypes.includes(ext)) {
    throw new Error(
      `Invalid file type. Only ${allowedFileTypes.join(", ")} allowed`
    );
  }

  const filename = `${Date.now()}-${uuidv4()}.${ext}`;
  const filepath = `${folder}/${newdate}/${filename}`;

  // file.data is available in express-fileupload
  const buffer = file.data;

  await spaces.send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: filepath,
      Body: buffer,
      ContentType: mime.lookup(ext) || "application/octet-stream",
      CacheControl: "public, max-age=31536000",
      // Profile photos are shown on the public site; Spaces objects are private by default
      ACL: "public-read"
    })
  );

  return filepath;
};

const uploadimage = (file) =>
  uploadToSpaces(file, ["jpg", "jpeg", "png", "webp"], "images");

const uploadvideo = (file) =>
  uploadToSpaces(file, ["mp4", "mov", "webm", "m4v"], "videos");

module.exports = { uploadimage, uploadvideo };
