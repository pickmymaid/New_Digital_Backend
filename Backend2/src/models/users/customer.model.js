const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true
  },
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  // OAuth (Google/Apple) account id; email signups don't have one. Uniqueness
  // is enforced by the partial index below, not `unique: true`.
  account_id:{
    type: String,
  },
  type: {
    type: String,
  },
  profile: {
    type: String
  },
  phone: {
    type: String,
  },
  password: {
    type: String,
  },
  reset_token: {
    type: String,
    default: null,
    allowNull: true
  },
  is_blocked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true })

customerSchema.index({ createdAt: -1 });
// Unique only when set — a plain unique index treats every customer without
// an account_id as account_id: null, so the second email signup hit E11000.
customerSchema.index(
  { account_id: 1 },
  { unique: true, partialFilterExpression: { account_id: { $type: 'string' } } }
);

const CustomerModel = mongoose.model('Customer', customerSchema)

module.exports = { CustomerModel };
