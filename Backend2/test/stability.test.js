// Regression tests for the crash and auth gaps found in the API stability
// review (public debug receipt route, public invoice/manual-verify routes).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_at_least_32_chars_long';
process.env.COOKIE_KEY = process.env.COOKIE_KEY || 'test_cookie_key_at_least_32_chars_long';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ci_smoke_test';
process.env.BASE_API_URL = process.env.BASE_API_URL || 'http://localhost:8081';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'ci-dummy';
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'ci-dummy';
process.env.FB_APP_ID = process.env.FB_APP_ID || 'ci-dummy';
process.env.FB_APP_SECRET = process.env.FB_APP_SECRET || 'ci-dummy';
process.env.APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID || 'ci-dummy';
process.env.APPLE_TEAM_ID = process.env.APPLE_TEAM_ID || 'ci-dummy';
process.env.APPLE_KEY_ID = process.env.APPLE_KEY_ID || 'ci-dummy';
process.env.APPLE_AUTH_KEY_PATH = process.env.APPLE_AUTH_KEY_PATH || '/tmp/ci-dummy-AuthKey.p8';

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

test('the debug receipt route is gone', async () => {
  await ready;
  const res = await fetch(`${baseUrl}/api/v2/payment/generate-reciept`);
  assert.equal(res.status, 404);
});

test('POST /api/v2/payment/download-invoice requires a logged-in customer', async () => {
  await ready;
  const res = await post('/api/v2/payment/download-invoice', { ref: 'x', user_id: 'someone-else' });
  assert.equal(res.status, 401);
});

test('POST /api/v1/payment/manual-verify requires a super admin', async () => {
  await ready;
  const res = await post('/api/v1/payment/manual-verify', { ref: { $ne: null } });
  assert.equal(res.status, 401);
});
