const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      ref:'Customer'
    },
    reciept_number:{
      type: Number,
    },
    transactionToken: {
      type: String,
      required: true,
    },
    transRef:{
        type: String,
        required: true,
    },
    type: {
      type: Number,
      required: true,
    },
    transactionID: {
      type: String,
    },
    is_paid: {
      type: Boolean
    },
    status: {
      type: Number,
      default: 0,
    },
    expiryDate: {
      type: Date,
    },
    paymentDate: {
      type: Date
    },
    // Charged amount in fils (AED * 100), after any coupon. Older records
    // don't have it — fall back to getSubscriptionAmount(type) for those.
    amount: {
      type: Number,
    },
    coupon_code: {
      type: String,
    },
    discount_percent: {
      type: Number,
    }
  },
  { timestamps: true }
);


paymentSchema.pre('save', function (next) {
  // Update the status to 2 if the expiry date has passed
  if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 2;
  }
  next();
});



// Subscriber check on every maid profile view, plus checkout/verify flows.
paymentSchema.index({ user_id: 1, status: 1 });
paymentSchema.index({ transRef: 1 });
// Expiry cron: { expiryDate < now, status != 2 }.
paymentSchema.index({ expiryDate: 1 });
// Reconcile job: { status: 0, createdAt in range } sorted by createdAt.
paymentSchema.index({ status: 1, createdAt: 1 });

const paymentModel = mongoose.model('Payment', paymentSchema);

module.exports = { paymentModel };
