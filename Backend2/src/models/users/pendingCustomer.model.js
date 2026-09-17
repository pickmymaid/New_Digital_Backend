const mongoose = require("mongoose");

const pendingCustomerSchema = new mongoose.Schema({
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
  phone: {
    type: String,
  },
  password: {
    type: String,
    required: true
  },
  emirate_of_residence: {
    type: String,
  },
  position_required: {
    type: String,
  },
  otp: {
    type: String,
    required: true
  },
  otp_expires_at: {
    type: Date,
    required: true
  }
}, { timestamps: true })

// Auto-deletes the pending signup once its OTP has expired, so unverified
// attempts don't linger and block that email/phone from being retried.
pendingCustomerSchema.index({ otp_expires_at: 1 }, { expireAfterSeconds: 0 });

const PendingCustomerModel = mongoose.model('PendingCustomer', pendingCustomerSchema)

module.exports = { PendingCustomerModel };
