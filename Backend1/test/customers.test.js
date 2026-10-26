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
const EMAIL = `blocked-${suffix}@example.com`;

let server;
let baseUrl;
let CustomerModel;

const saToken = jwt.sign({ role: 'SA', user_id: 'test-sa' }, process.env.JWT_SECRET);

// node 20's runner doesn't reliably finish an async top-level before() ahead of
// the first test, so setup is a promise every test awaits instead.
let ready;
before(() => {
  ready = (async () => {
    const app_ = require('../src/app');
    ({ CustomerModel } = require('../src/models/users/customer.model'));
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();
    server = http.createServer(app_.app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    await CustomerModel.create({ user_id: `test-blocked-${suffix}`, first_name: 'Blocked', email: EMAIL, is_blocked: true });
  })();
});

after(async () => {
  await ready?.catch(() => {});
  if (CustomerModel) await CustomerModel.deleteMany({ email: EMAIL });
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect().catch(() => {});
});

test('GET /api/v1/admin/customer returns { customer: { data, count } } with is_blocked', async () => {
  await ready;
  const res = await fetch(`${baseUrl}/api/v1/admin/customer?page=1&search=${encodeURIComponent(EMAIL)}`, {
    headers: { Authorization: `Bearer ${saToken}` },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  // The admin dashboard reads the list from data.customer.data.
  assert.ok(Array.isArray(body.data.customer.data));
  assert.equal(body.data.customer.count, 1);
  assert.equal(body.data.customer.data[0].email, EMAIL);
  assert.equal(body.data.customer.data[0].is_blocked, true);
});
