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
  account_id:{
    type: String,
    unique: true,
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

const CustomerModel = mongoose.model('Customer', customerSchema)

module.exports = { CustomerModel };
