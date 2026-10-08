const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_32_chars_long';
process.env.COOKIE_KEY = process.env.COOKIE_KEY || 'test_cookie_key_at_least_32_chars_long';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ci_smoke_test';

// Unique per run so leftovers from other runs never collide.
const suffix = Date.now().toString(36);
const NAME = `Test Skill ${suffix}`;
const RENAMED = `Renamed Skill ${suffix}`;

let server;
let baseUrl;
let SkillModel;
let jobApplicationModel;
let maidId;

const request = (method, path, { token, body } = {}) =>
  fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const adminToken = jwt.sign({ role: 'A', user_id: 'test-admin' }, process.env.JWT_SECRET);
const marketingToken = jwt.sign({ role: 'Marketing', user_id: 'test-marketing' }, process.env.JWT_SECRET);

// node 20's runner doesn't reliably finish an async top-level before() ahead of
// the first test, so setup is a promise every test awaits instead.
let ready;
before(() => {
  ready = (async () => {
    const { app } = require('../src/app');
    ({ SkillModel } = require('../src/models/skill/skill.model'));
    ({ jobApplicationModel } = require('../src/models/jobApplication/jobApplication.model'));
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    await mongoose.connection.asPromise();
    await SkillModel.init(); // make sure the unique index exists before the duplicate tests

    // Raw insert — skip the maid schema's required fields, only `skills` matters here.
    const { insertedId } = await jobApplicationModel.collection.insertOne({ name: `maid ${suffix}`, skills: [NAME, 'Cooking'] });
    maidId = insertedId;
  })();
  return ready;
});

after(async () => {
  await ready?.catch(() => {});
  await SkillModel.deleteMany({ name: { $in: [NAME, RENAMED] } }).catch(() => {});
  await jobApplicationModel.collection.deleteOne({ _id: maidId }).catch(() => {});
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect().catch(() => {});
});

test('write endpoints reject missing or non-admin tokens', async () => {
  await ready;
  assert.equal((await request('POST', '/api/v1/skills', { body: { name: NAME } })).status, 401);
  assert.equal((await request('POST', '/api/v1/skills', { token: marketingToken, body: { name: NAME } })).status, 401);
  assert.equal((await request('GET', '/api/v1/skills/admin')).status, 401);
});

test('skill CRUD round-trip', async (t) => {
  await ready;
  let id;

  await t.test('create', async () => {
    const res = await request('POST', '/api/v1/skills', { token: adminToken, body: { name: `  ${NAME}  ` } });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.data.skill.name, NAME);
    assert.equal(body.data.skill.is_active, true);
    id = body.data.skill._id;
  });

  await t.test('rejects blank and case-insensitive duplicate names', async () => {
    assert.equal((await request('POST', '/api/v1/skills', { token: adminToken, body: { name: '   ' } })).status, 400);
    const dup = await request('POST', '/api/v1/skills', { token: adminToken, body: { name: NAME.toUpperCase() } });
    assert.equal(dup.status, 409);
  });

  await t.test('public list shows active skills', async () => {
    const res = await request('GET', '/api/v1/skills');
    assert.equal(res.status, 200);
    const names = (await res.json()).data.skills.map((s) => s.name);
    assert.ok(names.includes(NAME));
  });

  await t.test('deactivating hides it from the public list but not the admin list', async () => {
    const res = await request('PATCH', `/api/v1/skills/${id}`, { token: adminToken, body: { is_active: false } });
    assert.equal(res.status, 200);
    const pub = (await (await request('GET', '/api/v1/skills')).json()).data.skills.map((s) => s.name);
    assert.ok(!pub.includes(NAME));
    const admin = (await (await request('GET', '/api/v1/skills/admin', { token: adminToken })).json()).data.skills;
    assert.equal(admin.find((s) => s._id === id)?.is_active, false);
  });

  await t.test('renaming carries over to maid profiles', async () => {
    const res = await request('PATCH', `/api/v1/skills/${id}`, { token: adminToken, body: { name: RENAMED } });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.skill.name, RENAMED);
    assert.equal(body.data.maidsUpdated, 1);
    const maid = await jobApplicationModel.collection.findOne({ _id: maidId });
    assert.deepEqual(maid.skills, [RENAMED, 'Cooking']);
  });

  await t.test('rejects bad ids and unknown skills', async () => {
    assert.equal((await request('PATCH', '/api/v1/skills/not-an-id', { token: adminToken, body: { name: 'x' } })).status, 400);
    const missing = new mongoose.Types.ObjectId().toString();
    assert.equal((await request('DELETE', `/api/v1/skills/${missing}`, { token: adminToken })).status, 404);
  });

  await t.test('delete removes it from the catalog but leaves maid profiles alone', async () => {
    const res = await request('DELETE', `/api/v1/skills/${id}`, { token: adminToken });
    assert.equal(res.status, 200);
    assert.equal((await res.json()).data.maidsUsing, 1);
    assert.equal(await SkillModel.countDocuments({ _id: id }), 0);
    const maid = await jobApplicationModel.collection.findOne({ _id: maidId });
    assert.ok(maid.skills.includes(RENAMED));
  });
});
