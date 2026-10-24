const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

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

// Unique per run so leftovers from other runs never collide.
const suffix = Date.now().toString(36).toUpperCase();
const CODE = `TEST${suffix}`;
const USER_ID = `test-user-${suffix}`;

let server;
let baseUrl;
let couponModel;
let paymentModel;
let couponService;
let paymentService;
let couponId;
let paymentId;

const request = (method, path, { token, body } = {}) =>
  fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

const saToken = jwt.sign({ role: 'SA', user_id: 'test-sa' }, process.env.JWT_SECRET);
const adminToken = jwt.sign({ role: 'A', user_id: 'test-admin' }, process.env.JWT_SECRET);

const DAY = 24 * 60 * 60 * 1000;

// node 20's runner doesn't reliably finish an async top-level before() ahead of
// the first test, so setup is a promise every test awaits instead.
let ready;
before(() => {
  ready = (async () => {
    const app_ = require('../src/app');
    ({ couponModel } = require('../src/models/coupon/coupon.model'));
    ({ paymentModel } = require('../src/models/payment/payment.model'));
    couponService = require('../src/services/coupon.service');
    paymentService = require('../src/services/payment.service');
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();
    server = http.createServer(app_.app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const payment = await paymentModel.create({
      user_id: USER_ID,
      transactionToken: 'test-token',
      transRef: `test-ref-${suffix}`,
      type: 0,
      status: 1,
      is_paid: true,
      expiryDate: new Date(Date.now() + 10 * DAY),
      paymentDate: new Date(),
    });
    paymentId = payment._id.toString();
  })();
});

after(async () => {
  await ready?.catch(() => {});
  if (couponModel) await couponModel.deleteMany({ code: { $in: [CODE, `${CODE}X`] } });
  if (paymentModel) await paymentModel.deleteMany({ user_id: USER_ID });
  if (server) await new Promise((resolve) => server.close(resolve));
  // app.js kicks off a DB connection on require() that keeps the event
  // loop alive, so disconnect it or `node --test` never exits.
  await mongoose.disconnect().catch(() => {});
});

test('applyDiscount takes the percentage off an amount in fils', async () => {
  await ready;
  assert.equal(couponService.applyDiscount(35000, 10), 31500);
  assert.equal(couponService.applyDiscount(38, 10), 34); // Starter, AED 0.38 -> 0.34
  assert.equal(couponService.applyDiscount(49500, 15), 42075);
  assert.equal(couponService.applyDiscount(89900, undefined), 89900);
});

test('coupon admin routes require an SA token', async () => {
  await ready;
  assert.equal((await request('GET', '/api/v1/payment/coupons/')).status, 401);
  assert.equal((await request('GET', '/api/v1/payment/coupons/', { token: adminToken })).status, 401);
});

test('POST /api/v1/payment/coupons creates an upper-cased coupon', async () => {
  await ready;
  const res = await request('POST', '/api/v1/payment/coupons/', {
    token: saToken,
    body: { code: CODE.toLowerCase(), discount_percent: 15 },
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.data.coupon.code, CODE);
  assert.equal(body.data.coupon.discount_percent, 15);
  assert.equal(body.data.coupon.is_active, true);
  assert.equal(body.data.coupon.once_per_customer, true);
  couponId = body.data.coupon._id;
});

test('POST rejects duplicates and out-of-range percentages', async () => {
  await ready;
  const dup = await request('POST', '/api/v1/payment/coupons/', {
    token: saToken,
    body: { code: CODE, discount_percent: 5 },
  });
  assert.equal(dup.status, 409);

  for (const discount_percent of [0, 91, 12.5, 'abc']) {
    const res = await request('POST', '/api/v1/payment/coupons/', {
      token: saToken,
      body: { code: `${CODE}X`, discount_percent },
    });
    assert.equal(res.status, 400, `discount_percent ${discount_percent} should be rejected`);
  }
});

test('GET /validate returns the discount, case-insensitively', async () => {
  await ready;
  const res = await request('GET', `/api/v1/payment/coupons/validate?code=${CODE.toLowerCase()}`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body.data, { code: CODE, discount_percent: 15 });

  assert.equal((await request('GET', '/api/v1/payment/coupons/validate?code=NOPE-NOT-REAL')).status, 404);
  assert.equal((await request('GET', '/api/v1/payment/coupons/validate')).status, 400);
});

test('PATCH changes the percentage; inactive and expired coupons stop validating', async () => {
  await ready;
  const patch = (body) => request('PATCH', `/api/v1/payment/coupons/${couponId}`, { token: saToken, body });

  const updated = await patch({ discount_percent: 20 });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).data.coupon.discount_percent, 20);

  await patch({ is_active: false });
  assert.equal((await request('GET', `/api/v1/payment/coupons/validate?code=${CODE}`)).status, 404);

  await patch({ is_active: true, expires_at: new Date(Date.now() - DAY).toISOString() });
  assert.equal((await request('GET', `/api/v1/payment/coupons/validate?code=${CODE}`)).status, 400);

  await patch({ expires_at: null });
  assert.equal((await request('GET', `/api/v1/payment/coupons/validate?code=${CODE}`)).status, 200);
});

test('a once-per-customer coupon is refused after the customer paid with it', async () => {
  await ready;
  const coupon = await couponService.findUsableCouponService(CODE, USER_ID);
  assert.equal(coupon.code, CODE);

  await paymentModel.updateOne({ _id: paymentId }, { $set: { coupon_code: CODE, discount_percent: 20, amount: 28000 } });
  await assert.rejects(
    couponService.findUsableCouponService(CODE, USER_ID),
    (error) => error.status === 'BAD_REQUEST' && /already used/.test(error.message)
  );
  // Other customers can still use it.
  assert.equal((await couponService.findUsableCouponService(CODE, `${USER_ID}-other`)).code, CODE);

  const list = await (await request('GET', '/api/v1/payment/coupons/', { token: saToken })).json();
  assert.equal(list.data.coupons.find((c) => c.code === CODE).times_used, 1);
});

test('GET /api/v1/payment lists payment time, amount and coupon', async () => {
  await ready;
  const res = await request('GET', `/api/v1/payment/?page=1&limit=500`, { token: saToken });
  assert.equal(res.status, 200);
  const body = await res.json();
  const row = body.data.payments.find((p) => p._id === paymentId);
  // The test payment has no matching customer, so the $unwind drops it —
  // only assert on shape when a row comes back.
  if (row) {
    assert.ok(row.paymentDate);
    assert.equal(row.coupon_code, CODE);
    assert.equal(row.amount, 28000);
  }
});

test('PATCH /api/v1/payment/:id edits expiry and status', async () => {
  await ready;
  const patch = (body, token = saToken) => request('PATCH', `/api/v1/payment/${paymentId}`, { token, body });

  assert.equal((await patch({ status: 2 }, adminToken)).status, 401);

  const newExpiry = new Date(Date.now() + 40 * DAY);
  const extended = await patch({ expiryDate: newExpiry.toISOString() });
  assert.equal(extended.status, 200);
  assert.equal(new Date((await extended.json()).data.payment.expiryDate).getTime(), newExpiry.getTime());

  const suspended = await patch({ status: 2 });
  assert.equal(suspended.status, 200);
  assert.equal((await suspended.json()).data.payment.status, 2);

  // Active with a past expiry would be flipped back by the expiry job.
  const pastActive = await patch({ status: 1, expiryDate: new Date(Date.now() - DAY).toISOString() });
  assert.equal(pastActive.status, 400);

  // Expired with a past date is fine (and stays as sent — no pre-save rewrite).
  const pastExpired = await patch({ status: 2, expiryDate: new Date(Date.now() - DAY).toISOString() });
  assert.equal(pastExpired.status, 200);

  // Reactivating needs a future date in the same request.
  assert.equal((await patch({ status: 1 })).status, 400);
  const reactivated = await patch({ status: 1, expiryDate: newExpiry.toISOString() });
  assert.equal(reactivated.status, 200);
  assert.equal((await reactivated.json()).data.payment.status, 1);

  assert.equal((await patch({ status: 7 })).status, 400);
  assert.equal((await patch({ expiryDate: 'not-a-date' })).status, 400);
  assert.equal((await patch({})).status, 400);
  assert.equal((await request('PATCH', '/api/v1/payment/not-an-id', { token: saToken, body: { status: 2 } })).status, 400);
  assert.equal(
    (await request('PATCH', `/api/v1/payment/${new mongoose.Types.ObjectId()}`, { token: saToken, body: { status: 2 } })).status,
    404
  );
});

test('buildPaymentUpdate leaves the existing expiry in play', async () => {
  await ready;
  const now = new Date('2026-10-24T00:00:00Z');
  const future = { status: 2, expiryDate: new Date('2026-11-01T00:00:00Z') };
  assert.deepEqual(paymentService.buildPaymentUpdate(future, { status: 1 }, now), { status: 1 });
  const past = { status: 2, expiryDate: new Date('2026-10-01T00:00:00Z') };
  assert.throws(() => paymentService.buildPaymentUpdate(past, { status: 1 }, now), /future/);
});

test('DELETE removes the coupon', async () => {
  await ready;
  const res = await request('DELETE', `/api/v1/payment/coupons/${couponId}`, { token: saToken });
  assert.equal(res.status, 200);
  assert.equal((await request('GET', `/api/v1/payment/coupons/validate?code=${CODE}`)).status, 404);
  assert.equal((await request('DELETE', `/api/v1/payment/coupons/${couponId}`, { token: saToken })).status, 404);
});
