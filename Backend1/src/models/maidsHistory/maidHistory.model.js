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

// History per maid, latest revision first.
MaidHistorySchema.index({ maid_id: 1, revision: -1 });

const MaidHistory = model("MaidHistory", MaidHistorySchema);

module.exports = { MaidHistory };
