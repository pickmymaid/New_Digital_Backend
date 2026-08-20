// const path = require('path');
// const { v4: uuidv4 } = require('uuid');
// const fs = require('fs');



// export const uploadimage = (file: any) => {
//   const allowedFileTypes = ['jpg', 'jpeg', 'png', 'webp']; // Add the file types you want to allow
  
//   const newdate = new Date().toLocaleDateString("fr-CA");    
//   var dir = `public/uploads/${newdate}`;
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
  
//   const splittedFileName = file.name.split(".")

//   const ext = splittedFileName[splittedFileName.length - 1];
//   const filename = Date.now() + uuidv4() + '.' + ext;
//   const filepath = 'images/' + newdate + '/' + filename;
//   const newpath = path.join(process.cwd(), dir, filename);
  
//   // Check if the file type is allowed
//   if (!allowedFileTypes.includes(ext.toLowerCase())) {
//     throw new Error('Invalid file type. Only ' + allowedFileTypes.join(', ') + ' files are allowed.');
//   }

//   const files = file.mv(newpath, function (err: any) {
//     if (err) {
//       console.log(err);
//     } else {
//       console.log('uploaddd');
//     }
//   });

//   return filepath;
// }



import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import mime from "mime-types";
import { r2 } from "../../config/r2.client";


export const uploadimage = async (file: any) => {
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

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
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
