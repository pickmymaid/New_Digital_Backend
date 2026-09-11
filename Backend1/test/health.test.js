// Smoke test — boots the real app and hits /health. Runs in CI before
// the image is built, so a broken import/bootstrap fails the pipeline
// before anything gets pushed to the registry.
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

before(async () => {
  const { app } = require('../src/app');
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  // app.js kicks off a DB connection on require() — close it so the
  // process can exit instead of hanging on the open socket/timers.
  await mongoose.disconnect().catch(() => {});
});

test('GET /health returns 200 with service identity', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.service, 'backend1');
});
