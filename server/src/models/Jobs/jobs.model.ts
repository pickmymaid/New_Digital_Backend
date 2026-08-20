import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    image:{
      type: String,
      required: true,
    },
    commitment: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    service: {
      type: String,
      required: true,
    },
    nationality:{
      type: String,
      required: true,
    },
    status: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

export const jobModel = mongoose.model('Job', jobSchema);
