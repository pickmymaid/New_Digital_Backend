// Makes every image in the DO Spaces bucket publicly readable (ACL public-read) so the
// website and admin dashboard can load them. Objects are private by default, and uploads
// made before c06ce0f were stored without an ACL. Documents (PDF etc.) are left private.
//
// Env: DO_SPACES_REGION, DO_SPACES_BUCKET, DO_SPACES_ACCESS_KEY, DO_SPACES_SECRET_KEY,
//      PREFIX (default "images/"), APPLY ("true" to change ACLs; otherwise a dry run).
const {
  S3Client,
  ListObjectsV2Command,
  GetObjectAclCommand,
  PutObjectAclCommand,
} = require('@aws-sdk/client-s3');

const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif'];
const ALL_USERS = 'http://acs.amazonaws.com/groups/global/AllUsers';

const { DO_SPACES_REGION, DO_SPACES_BUCKET: Bucket } = process.env;
const prefix = process.env.PREFIX || 'images/';
const apply = process.env.APPLY === 'true';

const s3 = new S3Client({
  region: DO_SPACES_REGION,
  endpoint: `https://${DO_SPACES_REGION}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  },
});

const ext = (key) => key.split('.').pop().toLowerCase();
const isPublic = (acl) =>
  (acl.Grants || []).some((g) => g.Grantee?.URI === ALL_USERS && ['READ', 'FULL_CONTROL'].includes(g.Permission));

async function pool(items, size, fn) {
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) await fn(items[next++]);
    })
  );
}

(async () => {
  const keys = [];
  let ContinuationToken;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: prefix, ContinuationToken }));
    (page.Contents || []).forEach((o) => keys.push(o.Key));
    ContinuationToken = page.NextContinuationToken;
  } while (ContinuationToken);

  const byType = {};
  keys.forEach((k) => (byType[ext(k)] = (byType[ext(k)] || 0) + 1));
  console.log(`Objects under "${prefix}": ${keys.length}`, byType);

  const images = keys.filter((k) => IMAGE_EXT.includes(ext(k)));
  const privateKeys = [];
  let changed = 0;
  let errors = 0;

  await pool(images, 16, async (Key) => {
    try {
      const acl = await s3.send(new GetObjectAclCommand({ Bucket, Key }));
      if (isPublic(acl)) return;
      privateKeys.push(Key);
      if (apply) {
        await s3.send(new PutObjectAclCommand({ Bucket, Key, ACL: 'public-read' }));
        changed++;
      }
    } catch (error) {
      errors++;
      if (errors <= 10) console.log(`ERROR ${Key}: ${error.name} ${error.message}`);
    }
  });

  console.log(`Images: ${images.length}, private: ${privateKeys.length}`);
  privateKeys.slice(0, 20).forEach((k) => console.log(`  private: ${k}`));
  console.log(apply ? `Made public: ${changed}` : 'Dry run: no ACLs changed.');
  if (errors) {
    console.log(`Errors: ${errors}`);
    process.exit(1);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
