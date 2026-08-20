import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  is_super_admin: {
    type: Boolean,
    required: true
  },
  role: {
    type: String,
    enum: ['SA', 'A', 'Marketing'],
    default: 'A'
  },
  status:{
    type: String,
    default: 'active'
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true })

export const AdminModel = mongoose.model('Admin', adminSchema)