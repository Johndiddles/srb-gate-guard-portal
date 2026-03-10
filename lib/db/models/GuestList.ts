import mongoose, { Schema, Document, Model } from "mongoose";

export type GuestStatus = "arrival" | "in-house" | "checked-out";

export interface IGuestEntry {
  id?: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  status: GuestStatus;
  arrivalDate: string | Date;
  notes?: string;
}

export interface IGuestList extends Document {
  list_date: Date;
  uploader_name: string;
  uploaded_at: Date;
  updatedAt: Date;
  lastUpdatedBy: string;
  guests: IGuestEntry[];
}

const GuestEntrySchema: Schema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  roomNumber: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["arrival", "in-house", "checked-out"],
  },
  arrivalDate: { type: String, required: true },
  notes: { type: String, required: false },
});

const GuestListSchema: Schema = new Schema({
  list_date: { type: Date, required: true },
  uploader_name: { type: String, required: true },
  uploaded_at: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastUpdatedBy: { type: String, required: true },
  guests: [GuestEntrySchema],
});

export const GuestListModel: Model<IGuestList> =
  mongoose.models.GuestList ||
  mongoose.model<IGuestList>("GuestList", GuestListSchema);
