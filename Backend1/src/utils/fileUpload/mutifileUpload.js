const { uploadToSpaces } = require('./fileUpload');

const uploadmultipleImages = async (files) => {
  const allowedFileTypes = ['jpg', 'jpeg', 'png', 'webp', 'pdf']; // Add the file types you want to allow

  // express-fileupload gives a single object (not an array) for one file
  files = Array.isArray(files) ? files : [files];

  return Promise.all(
    files.map(async (file) => ({
      name: file.name,
      image: await uploadToSpaces(file, allowedFileTypes)
    }))
  );
};

module.exports = { uploadmultipleImages };
