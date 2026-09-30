const { v4: uuidv4 } = require("uuid");
const { PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const { spaces } = require("../../config/spaces.client");

/**
 * Uploads an express-fileupload file to the DO Spaces bucket as a public
 * object under `<folder>/<YYYY-MM-DD>/<unique>.<ext>` and returns that key.
 * The key (not a full URL) is what gets stored in MongoDB; the frontend
 * prefixes it with the Spaces CDN base URL.
 */
const uploadToSpaces = async (file, allowedFileTypes, folder = "images") => {
  const ext = file.name.split(".").pop().toLowerCase();

  if (!allowedFileTypes.includes(ext)) {
    throw new Error(
      `Invalid file type. Only ${allowedFileTypes.join(", ")} allowed`
    );
  }

  const newdate = new Date().toLocaleDateString("fr-CA");
  const filepath = `${folder}/${newdate}/${Date.now()}-${uuidv4()}.${ext}`;

  await spaces.send(
    new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: filepath,
      Body: file.data,
      ACL: "public-read",
      ContentType: mime.lookup(ext) || "application/octet-stream",
      CacheControl: "public, max-age=31536000"
    })
  );

  return filepath;
};

const uploadimage = (file) =>
  uploadToSpaces(file, ["jpg", "jpeg", "png", "webp"]);

const uploadvideo = (file) =>
  uploadToSpaces(file, ["mp4", "mov", "webm", "m4v"], "videos");

/**
 * Deletes an object previously returned by `uploadimage`. Failures are
 * logged, not thrown — a leftover object must not fail the request.
 */
const deleteimage = async (filepath) => {
  if (!filepath || filepath.startsWith("http")) return;
  try {
    await spaces.send(
      new DeleteObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: filepath
      })
    );
  } catch (err) {
    console.log(err);
  }
};

module.exports = { uploadimage, uploadvideo, uploadToSpaces, deleteimage };
