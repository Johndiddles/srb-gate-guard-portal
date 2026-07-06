import mongoose, { Schema, Document, Model } from "mongoose";
import { ResortLocation } from "../../enums";

export interface IPhoneBoothAssignment extends Document {
  staffId: string;
  staffName?: string;
  department?: string;
  slotNumber: number;
  assignedAt: Date;
  retrievedAt?: Date;
  status: "assigned" | "retrieved";
  app_log_id: string;
  deviceName?: string;
  location: ResortLocation;
  createdAt: Date;
  updatedAt: Date;
}

const PhoneBoothAssignmentSchema: Schema = new Schema(
  {
    staffId: { type: String, required: true },
    staffName: { type: String },
    department: { type: String },
    slotNumber: { type: Number, required: true },
    assignedAt: { type: Date, required: true },
    retrievedAt: { type: Date },
    status: {
      type: String,
      enum: ["assigned", "retrieved"],
      default: "assigned",
      required: true,
    },
    app_log_id: { type: String, required: true, unique: true },
    deviceName: { type: String },
    location: { type: String, enum: Object.values(ResortLocation), required: true },
  },
  { timestamps: true }
);

export const PhoneBoothAssignmentModel: Model<IPhoneBoothAssignment> =
  mongoose.models.PhoneBoothAssignment ||
  mongoose.model<IPhoneBoothAssignment>("PhoneBoothAssignment", PhoneBoothAssignmentSchema);
