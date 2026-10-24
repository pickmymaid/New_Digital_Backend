const mongoose = require('mongoose');

// Admin-managed discount codes applied to package payments
// (/api/v2/payment/create-payment). Codes are stored upper-cased so
// "welcome10" and "WELCOME10" are the same coupon.
const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 30,
    },
    // Whole-number percentage taken off the package price. Capped below 100
    // because the payment gateway rejects zero-amount orders.
    discount_percent: {
      type: Number,
      required: true,
      min: 1,
      max: 90,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    // Optional — the coupon stops applying after this moment.
    expires_at: {
      type: Date,
      default: null,
    },
    // Each customer can complete at most one paid order with this code.
    once_per_customer: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const couponModel = mongoose.model('Coupon', couponSchema);

module.exports = { couponModel };
