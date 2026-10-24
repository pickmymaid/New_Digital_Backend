// Regression tests for bad-input 500s and auth gaps found in the API
// stability review: invalid input must get a 4xx, never a 500.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_32_chars_long';
process.env.COOKIE_KEY = process.env.COOKIE_KEY || 'test_cookie_key_at_least_32_chars_long';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ci_smoke_test';

let server;
let baseUrl;

// node 20's runner doesn't reliably finish an async top-level before() ahead of
// the first test, so setup is a promise every test awaits instead.
let ready;
before(() => {
  ready = (async () => {
    const { app, dbReady } = require('../src/app');
    await dbReady;
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  })();
  return ready;
});

after(async () => {
  await ready?.catch(() => {});
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect().catch(() => {});
});

const post = (path, body) => fetch(`${baseUrl}${path}`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

test('GET /ready reports the DB connection', async () => {
  await ready;
  const res = await fetch(`${baseUrl}/ready`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).status, 'ready');
});

test('GET /api/v1/job/all works without a page param', async () => {
  await ready;
  const res = await fetch(`${baseUrl}/api/v1/job/all`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.data.jobApplication));
});

test('invalid page numbers are a 400, not a 500', async () => {
  await ready;
  for (const path of ['/api/v1/blog/page/abc', '/api/v1/blog/page/-5', '/api/v2/maids/find/abc', '/api/v2/maids/find/0']) {
    const res = await fetch(`${baseUrl}${path}`);
    assert.equal(res.status, 400, path);
  }
});

test('POST /api/v1/contact with missing fields is a 400', async () => {
  await ready;
  const res = await post('/api/v1/contact', {});
  assert.equal(res.status, 400);
});

test('POST /api/v1/job/toggle-wishlist requires a logged-in customer', async () => {
  await ready;
  const res = await post('/api/v1/job/toggle-wishlist', { maidId: '6adc77f9af514d63b0dac9d1' });
  assert.equal(res.status, 401);
});

test('POST /api/v1/test/send-test-email requires a super admin', async () => {
  await ready;
  const res = await post('/api/v1/test/send-test-email', { to: 'x@example.test', subject: 's', message: 'm', key: 'test-email-1122334455' });
  assert.equal(res.status, 401);
});
