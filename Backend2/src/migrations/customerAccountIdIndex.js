const { CustomerModel } = require('../models/users/customer.model');

const INDEX_NAME = 'account_id_1';

/**
 * customers.account_id used to have a plain unique index, which counts every
 * customer without an account_id (all email signups) as account_id: null —
 * so the second email signup failed with E11000. Mongoose won't replace an
 * existing index with the same name, so drop the old one here and let the
 * schema's partial unique index be created in its place. A no-op once fixed.
 */
const fixCustomerAccountIdIndex = async () => {
  const collection = CustomerModel.collection;

  let indexes = [];
  try {
    indexes = await collection.indexes();
  } catch (error) {
    if (error?.codeName !== 'NamespaceNotFound') throw error; // no customers collection yet
  }

  const old = indexes.find((index) => index.name === INDEX_NAME && !index.partialFilterExpression);
  if (old) {
    // Another replica may have dropped it first.
    await collection.dropIndex(INDEX_NAME).catch((error) => {
      if (error?.codeName !== 'IndexNotFound') throw error;
    });
    console.log(`customers.${INDEX_NAME}: replaced unique index with partial unique index`);
  }

  await CustomerModel.createIndexes();
};

module.exports = { fixCustomerAccountIdIndex };
