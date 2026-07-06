import mongoose, { Schema, Document, Model } from "mongoose";
import { ResortLocation } from "../../enums";

export interface IKeyCollection extends Document {
  keyTag: string;
  collectingStaffId: string;
  collectingStaffName?: string;
  collectingStaffDepartment?: string;
  collectedAt: Date;
  returningStaffId?: string;
  returningStaffName?: string;
  returningStaffDepartment?: string;
  returnedAt?: Date;
  status: "collected" | "returned" | "resolved";
  resolvedBy?: string;
  resolvedAt?: Date;
  app_log_id: string;
  deviceName: string;
  location: ResortLocation;
  createdAt: Date;
  updatedAt: Date;
}

const KeyCollectionSchema: Schema = new Schema(
  {
    keyTag: { type: String, required: true },
    collectingStaffId: { type: String, required: true },
    collectingStaffName: { type: String },
    collectingStaffDepartment: { type: String },
    collectedAt: { type: Date, required: true },
    returningStaffId: { type: String },
    returningStaffName: { type: String },
    returningStaffDepartment: { type: String },
    returnedAt: { type: Date },
    status: {
      type: String,
      enum: ["collected", "returned", "resolved"],
      default: "collected",
      required: true,
    },
    resolvedBy: { type: String },
    resolvedAt: { type: Date },
    app_log_id: { type: String, required: true, unique: true },
    deviceName: { type: String, required: true },
    location: { type: String, enum: Object.values(ResortLocation), required: true },
  },
  { timestamps: true }
);

if (mongoose.models.KeyCollection) {
  delete mongoose.models.KeyCollection;
}

export const KeyCollectionModel: Model<IKeyCollection> =
  mongoose.models.KeyCollection ||
  mongoose.model<IKeyCollection>("KeyCollection", KeyCollectionSchema);
