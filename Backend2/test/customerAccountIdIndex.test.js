const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ci_smoke_test';

// Own database + no autoIndex, so the old index set up below isn't raced by Mongoose.
mongoose.set('autoIndex', false);
const { CustomerModel } = require('../src/models/users/customer.model');
const { fixCustomerAccountIdIndex } = require('../src/migrations/customerAccountIdIndex');

const customer = (n, extra = {}) => ({
  user_id: `user_${n}`,
  first_name: `Customer ${n}`,
  email: `customer${n}@example.com`,
  type: 'email',
  ...extra,
});

before(async () => {
  await mongoose.connect(MONGODB_URI, { dbName: 'ci_customer_index_test' });
  await CustomerModel.collection.drop().catch(() => {});
});

after(async () => {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
});

test('old plain unique index rejects a second customer without account_id', async () => {
  await CustomerModel.collection.createIndex({ account_id: 1 }, { unique: true, name: 'account_id_1' });
  await CustomerModel.collection.insertOne(customer(1));
  await assert.rejects(CustomerModel.collection.insertOne(customer(2)), { code: 11000 });
  await CustomerModel.collection.deleteMany({});
});

test('migration swaps in a partial unique index and is idempotent', async () => {
  await fixCustomerAccountIdIndex();
  await fixCustomerAccountIdIndex();

  const index = (await CustomerModel.collection.indexes()).find((i) => i.name === 'account_id_1');
  assert.equal(index.unique, true);
  assert.deepEqual(index.partialFilterExpression, { account_id: { $type: 'string' } });
});

test('many email customers can exist without account_id', async () => {
  await CustomerModel.create(customer(1));
  await CustomerModel.create(customer(2));
  await CustomerModel.create(customer(3, { account_id: null }));
  assert.equal(await CustomerModel.countDocuments({}), 3);
});

test('a given OAuth account_id is still unique', async () => {
  await CustomerModel.create(customer(4, { account_id: 'google-123' }));
  await assert.rejects(CustomerModel.create(customer(5, { account_id: 'google-123' })), { code: 11000 });
});

test('runs on a database with no customers collection yet', async () => {
  await CustomerModel.collection.drop();
  await fixCustomerAccountIdIndex();
  const index = (await CustomerModel.collection.indexes()).find((i) => i.name === 'account_id_1');
  assert.ok(index.partialFilterExpression);
});
