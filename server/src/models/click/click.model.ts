import mongoose from "mongoose";

const ClickSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  }
}, { timestamps: true })

export const ClickSchemaModel = mongoose.model('click', ClickSchema)