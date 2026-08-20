import mongoose from 'mongoose';

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



export const paymentModel = mongoose.model('Payment', paymentSchema);
