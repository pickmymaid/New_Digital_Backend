/**
 * One-off: maid profiles' `location` and `option` became lists (multi-select in
 * the admin panel). Rewrites profiles that still store a single string as a
 * list, and splits "Live In And Live Out" into ["Live In", "Live Out"].
 * The API accepts both shapes, so this can run any time after the deploy.
 *
 * Run from inside the backend1 pod (env vars + node_modules already present):
 *   node scripts/migrate-maid-multiselect.js [--dry-run]
 */
require("dotenv").config();
const mongoose = require("mongoose");
const { toStringList, toOptionList } = require("../src/utils/maids/multiSelect");

const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set in this environment");
  await mongoose.connect(process.env.MONGODB_URI);
  // Raw collection: the model would already cast strings to lists on read.
  const maids = mongoose.connection.collection("jobapplications");

  const cursor = maids.find(
    { $or: [{ location: { $type: "string" } }, { option: { $type: "string" } }, { option: "Live In And Live Out" }] },
    { projection: { ref_number: 1, location: 1, option: 1 } }
  );

  let updated = 0;
  for await (const maid of cursor) {
    const set = {};
    if (typeof maid.location === "string") set.location = toStringList(maid.location);
    if (typeof maid.option === "string" || maid.option?.includes("Live In And Live Out")) {
      set.option = toOptionList(maid.option);
    }
    console.log(`${maid.ref_number}: ${JSON.stringify({ location: maid.location, option: maid.option })} -> ${JSON.stringify(set)}`);
    if (!dryRun) await maids.updateOne({ _id: maid._id }, { $set: set });
    updated++;
  }

  console.log(`${dryRun ? "Would update" : "Updated"} ${updated} profile(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
