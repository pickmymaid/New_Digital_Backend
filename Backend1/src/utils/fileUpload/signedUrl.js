const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { spaces } = require('../../config/spaces.client');

// Maid documents (passports, visas, CVs) are stored private; admins get a short-lived link.
const SIGNED_URL_TTL_SECONDS = 10 * 60;

// RFC 6266: an ASCII fallback plus the exact UTF-8 name.
const contentDisposition = (type, filename) => {
  if (!filename) return type;
  const ascii = filename.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
};

/**
 * A temporary GET link to a private object in the Spaces bucket.
 * download: true makes the browser save it as `filename` instead of opening it.
 */
const getSignedFileUrl = (key, { filename, download = false } = {}) =>
  getSignedUrl(
    spaces,
    new GetObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,
      ResponseContentDisposition: contentDisposition(download ? 'attachment' : 'inline', filename),
    }),
    { expiresIn: SIGNED_URL_TTL_SECONDS }
  );

module.exports = { getSignedFileUrl, SIGNED_URL_TTL_SECONDS };
