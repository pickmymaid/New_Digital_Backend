const { v4: uuidv4 } = require('uuid');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const { spaces } = require('../../config/spaces.client');

const uploadmultipleImages = async (files) => {
  const allowedFileTypes = ['jpg', 'jpeg', 'png', 'webp', 'pdf']; // Add the file types you want to allow

  // express-fileupload gives a single object (not an array) when only one file is sent
  const fileList = Array.isArray(files) ? files : [files];

  const newDate = new Date().toLocaleDateString('fr-CA');

  // Check every file type before uploading anything
  fileList.forEach((file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedFileTypes.includes(ext)) {
      throw new Error('Invalid file type. Only ' + allowedFileTypes.join(', ') + ' files are allowed.');
    }
  });

  const uploadPromises = fileList.map(async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = `${Date.now()}-${uuidv4()}.${ext}`;
    const filepath = `images/${newDate}/${filename}`;

    await spaces.send(
      new PutObjectCommand({
        Bucket: process.env.DO_SPACES_BUCKET,
        Key: filepath,
        Body: file.data,
        ContentType: mime.lookup(ext) || 'application/octet-stream',
        CacheControl: 'public, max-age=31536000',
      })
    );

    return { name: file.name, image: filepath };
  });

  return Promise.all(uploadPromises);
};

module.exports = { uploadmultipleImages };
