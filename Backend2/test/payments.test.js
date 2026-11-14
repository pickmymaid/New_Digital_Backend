const { test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const axios = require('axios');

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
process.env.INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'test-internal-token';

// Unique per run so leftovers from other runs never collide.
const suffix = Date.now().toString(36).toUpperCase();
const USER_ID = `pay-test-user-${suffix}`;
const OTHER_USER_ID = `pay-test-other-${suffix}`;
const MINUTE = 60 * 1000;

let server;
let baseUrl;
let paymentModel;
let CustomerModel;
let paymentService;
let gateway;
let accessTokens;
let sesMail;
let refCounter = 0;

// What the stubbed N-Genius returns, per order reference.
const gatewayOrders = new Map();
let mailMock;

const request = (method, path, { headers, body } = {}) =>
  fetch(`${baseUrl}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

const waitFor = async (check, timeoutMs = 5000) => {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error('timed out waiting');
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
};

// A pending N-Genius order, as create-payment saves it.
const createPending = async ({ amount = 35000, userId = USER_ID, ageMs, gatewayState, chargedAmount } = {}) => {
  refCounter += 1;
  const transRef = `pay-test-ref-${suffix}-${refCounter}`;
  const payment = await paymentModel.create({
    user_id: userId,
    transactionToken: 'test-token',
    transRef,
    type: 0,
    amount,
    status: 0,
  });
  if (ageMs !== undefined) {
    // Bypass mongoose timestamps to backdate the order.
    await paymentModel.collection.updateOne({ _id: payment._id }, { $set: { createdAt: new Date(Date.now() - ageMs) } });
  }
  if (gatewayState) {
    gatewayOrders.set(transRef, {
      paid: ['PURCHASED', 'CAPTURED'].includes(gatewayState),
      state: gatewayState,
      amount: chargedAmount ?? amount,
      currency: 'AED',
    });
  }
  return transRef;
};

const statusOf = async (transRef) => (await paymentModel.findOne({ transRef }).lean())?.status;

let ready;
before(() => {
  ready = (async () => {
    const app_ = require('../src/app');
    ({ paymentModel } = require('../src/models/payment/payment.model'));
    ({ CustomerModel } = require('../src/models/users/customer.model'));
    paymentService = require('../src/services/v2/payment.service');
    gateway = require('../src/utils/verifyPayment/verifyPayment');
    accessTokens = require('../src/utils/generatePaymentAccessToken/generatePaymentAccessToken');
    sesMail = require('../src/utils/sendMail/sendSESMail');
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise();

    mock.method(accessTokens, 'generateAccessToken', async () => 'fresh-token');
    mock.method(gateway, 'getOrderStatus', async (token, ref) =>
      gatewayOrders.get(ref) ?? { paid: false, state: 'STARTED', amount: undefined, currency: 'AED' }
    );
    mailMock = mock.method(sesMail, 'sendSesEmailWithAttachment', async () => true);

    await CustomerModel.create({ user_id: USER_ID, first_name: 'Paytest', email: `pay-test-${suffix}@example.invalid` });

    server = http.createServer(app_.app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  })();
});

beforeEach(() => {
  mailMock?.mock.resetCalls();
});

after(async () => {
  await ready?.catch(() => {});
  if (paymentModel) await paymentModel.deleteMany({ transRef: { $regex: `^pay-test-ref-${suffix}` } });
  if (CustomerModel) await CustomerModel.deleteMany({ user_id: USER_ID });
  if (server) await new Promise((resolve) => server.close(resolve));
  mock.restoreAll();
  await mongoose.disconnect().catch(() => {});
});

test('getOrderStatus counts an order as paid when a later attempt succeeded', async (t) => {
  await ready;
  // The other tests stub getOrderStatus; load an unstubbed copy of the module.
  const modulePath = require.resolve('../src/utils/verifyPayment/verifyPayment');
  const cached = require.cache[modulePath];
  delete require.cache[modulePath];
  const freshGateway = require(modulePath);
  require.cache[modulePath] = cached;

  t.mock.method(axios, 'get', async () => ({
    data: {
      amount: { value: 35000, currencyCode: 'AED' },
      _embedded: { payment: [{ state: 'FAILED' }, { state: 'PURCHASED' }] },
    },
  }));
  assert.deepEqual(await freshGateway.getOrderStatus('token', 'REF'), {
    paid: true,
    state: 'PURCHASED',
    amount: 35000,
    currency: 'AED',
  });

  axios.get.mock.mockImplementation(async () => ({
    data: { amount: { value: 35000, currencyCode: 'AED' }, _embedded: { payment: [{ state: 'AWAIT_3DS' }] } },
  }));
  assert.equal((await freshGateway.getOrderStatus('token', 'REF')).paid, false);
});

test('confirmPayment activates a paid order and emails one receipt', async () => {
  await ready;
  const ref = await createPending({ gatewayState: 'PURCHASED' });
  const payment = await paymentModel.findOne({ transRef: ref });

  const result = await paymentService.confirmPayment(payment);

  assert.equal(result.paid, true);
  assert.equal(result.payment.status, 1);
  const saved = await paymentModel.findOne({ transRef: ref }).lean();
  assert.equal(saved.status, 1);
  assert.equal(saved.is_paid, true);
  await waitFor(() => mailMock.mock.callCount() === 1);
});

test('concurrent confirmations activate the order and send the receipt only once', async () => {
  await ready;
  const ref = await createPending({ gatewayState: 'PURCHASED' });
  const payment = await paymentModel.findOne({ transRef: ref });

  const results = await Promise.all([1, 2, 3, 4].map(() => paymentService.confirmPayment(payment)));

  assert.ok(results.every((r) => r.paid && r.payment.status === 1));
  await waitFor(() => mailMock.mock.callCount() >= 1);
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(mailMock.mock.callCount(), 1);
});

test('an unpaid order stays pending', async () => {
  await ready;
  const ref = await createPending({ gatewayState: 'STARTED' });

  await assert.rejects(paymentService.verifyPaymentService(ref), (error) => typeof error === 'string' && /issue with your payment/.test(error));
  assert.equal(await statusOf(ref), 0);
});

test('a charge for a different amount is not activated', async () => {
  await ready;
  const ref = await createPending({ amount: 31500, gatewayState: 'PURCHASED', chargedAmount: 100 });
  const payment = await paymentModel.findOne({ transRef: ref });

  await assert.rejects(paymentService.confirmPayment(payment), /expected 31500 AED/);
  assert.equal(await statusOf(ref), 0);
  assert.equal(mailMock.mock.callCount(), 0);
});

test('paying one order no longer deletes the customer\'s other unconfirmed orders', async () => {
  await ready;
  const other = await createPending({ gatewayState: 'STARTED' });
  const paid = await createPending({ gatewayState: 'PURCHASED' });

  await paymentService.verifyPaymentService(paid, USER_ID);

  assert.equal(await statusOf(paid), 1);
  assert.equal(await statusOf(other), 0);
});

test('acknowledge works without a session, but not for someone else\'s order', async () => {
  await ready;
  const ref = await createPending({ gatewayState: 'PURCHASED' });

  const res = await request('POST', `/api/v2/payment/acknowledge/${ref}`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).data.status, 1);

  await assert.rejects(paymentService.verifyPaymentService(ref, OTHER_USER_ID), (error) => /missmatching/.test(error));

  const unknown = await request('POST', `/api/v2/payment/acknowledge/pay-test-ref-${suffix}-nope`);
  assert.equal(unknown.status, 400);
});

test('the webhook needs the configured secret and then confirms the order', async () => {
  await ready;
  const ref = await createPending({ gatewayState: 'PURCHASED' });
  const body = { eventName: 'PURCHASED', order: { reference: ref } };

  delete process.env.PG_WEBHOOK_SECRET;
  assert.equal((await request('POST', '/api/v2/payment/webhook', { body })).status, 404);

  process.env.PG_WEBHOOK_SECRET = 'webhook-secret';
  assert.equal((await request('POST', '/api/v2/payment/webhook', { body })).status, 401);
  assert.equal((await request('POST', '/api/v2/payment/webhook', { body, headers: { 'x-webhook-secret': 'wrong' } })).status, 401);
  assert.equal(await statusOf(ref), 0);

  const ok = await request('POST', '/api/v2/payment/webhook', { body, headers: { 'x-webhook-secret': 'webhook-secret' } });
  assert.equal(ok.status, 200);
  assert.equal(await statusOf(ref), 1);

  // Unknown orders are acknowledged so N-Genius doesn't keep retrying them.
  const unknown = await request('POST', '/api/v2/payment/webhook', {
    body: { order: { reference: 'not-ours' } },
    headers: { 'x-webhook-secret': 'webhook-secret' },
  });
  assert.equal(unknown.status, 200);
  delete process.env.PG_WEBHOOK_SECRET;
});

test('the reconcile job confirms missed payments and leaves the rest alone', async () => {
  await ready;
  const missed = await createPending({ ageMs: 10 * MINUTE, gatewayState: 'PURCHASED' });
  const abandoned = await createPending({ ageMs: 10 * MINUTE, gatewayState: 'STARTED' });
  const tooNew = await createPending({ gatewayState: 'PURCHASED' });
  const tooOld = await createPending({ ageMs: 72 * 60 * MINUTE, gatewayState: 'PURCHASED' });

  assert.equal((await request('POST', '/internal/reconcile-payments')).status, 401);
  const res = await request('POST', '/internal/reconcile-payments', {
    headers: { 'x-internal-token': process.env.INTERNAL_SERVICE_TOKEN },
  });
  assert.equal(res.status, 200);

  assert.equal(await statusOf(missed), 1);
  assert.equal(await statusOf(abandoned), 0);
  assert.equal(await statusOf(tooNew), 0); // left to the customer's return page
  assert.equal(await statusOf(tooOld), 0); // outside the 48-hour window
});
