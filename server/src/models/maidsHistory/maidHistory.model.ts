import { Schema, model, Document } from "mongoose";

interface ChangeLog {
  [key: string]: {
    old: any;
    new: any;
  };
}

export interface IMaidHistory extends Document {
  maid_id: string;
  updated_by: string;
  changes: ChangeLog;
  revision: number;
}

const MaidHistorySchema = new Schema<IMaidHistory>(
  {
    maid_id: { type: String, required: true },
    updated_by: { type: String, required: true },
    changes: { type: Schema.Types.Mixed, required: true },
    revision: { type: Number, required: true },
  },
  { timestamps: true }
);

export const MaidHistory = model<IMaidHistory>("MaidHistory", MaidHistorySchema);
