/**
 * Plain copy: uploads local files under public/uploads/ (written there by
 * uploadmultipleImages, which never touched Spaces) up to DO_SPACES_BUCKET,
 * under the same "images/<date>/<filename>" key that uploadimage() already
 * uses. Does not touch the database and does not delete the local files.
 *
 * Run from inside the backend1 pod (env vars + node_modules already
 * present there), once per replica:
 *   node scripts/copy-uploads-to-spaces.js [--dry-run]
 */
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const { PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");
const { spaces } = require("../src/config/spaces.client");

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const BUCKET = process.env.DO_SPACES_BUCKET;
const dryRun = process.argv.includes("--dry-run");

function walk(dir) {
  let out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out = out.concat(walk(full));
    else out.push(full);
  }
  return out;
}

async function alreadyUploaded(key) {
  try {
    await spaces.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!BUCKET) throw new Error("DO_SPACES_BUCKET is not set in this environment");
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log(`No uploads dir at ${UPLOADS_DIR} on this pod — nothing to migrate here.`);
    return;
  }

  const files = walk(UPLOADS_DIR);
  console.log(`Found ${files.length} file(s) under ${UPLOADS_DIR}`);

  let uploaded = 0, skipped = 0, failed = 0;

  for (const filePath of files) {
    const rel = path.relative(UPLOADS_DIR, filePath).split(path.sep).join("/");
    const key = `images/${rel}`;
    const ext = filePath.split(".").pop().toLowerCase();

    if (await alreadyUploaded(key)) {
      console.log(`SKIP (exists)  ${key}`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`DRY-RUN would upload  ${filePath} -> ${key}`);
      continue;
    }

    try {
      await spaces.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: fs.readFileSync(filePath),
          ContentType: mime.lookup(ext) || "application/octet-stream",
          CacheControl: "public, max-age=31536000",
        })
      );
      console.log(`OK  ${filePath} -> ${key}`);
      uploaded++;
    } catch (err) {
      console.error(`FAIL  ${filePath}:`, err.message);
      failed++;
    }
  }

  console.log(`\nDone. uploaded=${uploaded} skipped=${skipped} failed=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
