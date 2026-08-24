const { Schema, model } = require("mongoose");

const MaidHistorySchema = new Schema(
  {
    maid_id: { type: String, required: true },
    updated_by: { type: String, required: true },
    changes: { type: Schema.Types.Mixed, required: true },
    revision: { type: Number, required: true },
  },
  { timestamps: true }
);

const MaidHistory = model("MaidHistory", MaidHistorySchema);

module.exports = { MaidHistory };
