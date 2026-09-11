// Smoke test — boots the real app (including passport strategy setup)
// and hits /health. Runs in CI before the image is built, so a broken
// import/bootstrap fails the pipeline before anything gets pushed.
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
// Not read at boot (only lazily when actually minting an Apple client
// secret JWT), so a nonexistent path is fine for this smoke test.
process.env.APPLE_AUTH_KEY_PATH = process.env.APPLE_AUTH_KEY_PATH || '/tmp/ci-dummy-AuthKey.p8';

let server;
let baseUrl;

before(async () => {
  const app_ = require('../src/app');
  server = http.createServer(app_.app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  // app.js kicks off a DB connection on require() that keeps the event
  // loop alive, so disconnect it or `node --test` never exits.
  await mongoose.disconnect().catch(() => {});
});

test('GET /health returns 200 with service identity', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'backend2-auth-payment');
});
