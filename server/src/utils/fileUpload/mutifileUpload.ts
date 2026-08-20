const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

export const uploadmultipleImages = async (files: any) => {
  const allowedFileTypes = ['jpg', 'jpeg', 'png', 'webp','pdf']; // Add the file types you want to allow

  const newDate = new Date().toLocaleDateString('fr-CA');
  const dir = `public/uploads/${newDate}`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const uploadPromises = files.map((file: any) => {
    const ext = file.name.split('.')[1];
    const filename = Date.now() + uuidv4() + '.' + ext;
    const filepath = 'images/' + newDate + '/' + filename;
    const newpath = path.join(process.cwd(), dir, filename);

    // Check if the file type is allowed
    if (!allowedFileTypes.includes(ext.toLowerCase())) {
      throw new Error('Invalid file type. Only ' + allowedFileTypes.join(', ') + ' files are allowed.');
    }

    return new Promise((resolve, reject) => {
      file.mv(newpath, (err: any) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
       
          resolve({ name: file.name, image: filepath });
        }
      });
    });
  });

  const uploadedFiles = await Promise.all(uploadPromises);
  

  return uploadedFiles;
};
