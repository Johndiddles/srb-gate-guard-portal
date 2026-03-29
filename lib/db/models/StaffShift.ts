import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStaffShift extends Document {
  staffId: string;
  staffName: string;
  department: string;
  clockIn: Date;
  clockOut?: Date;
  status: "active" | "completed";
  app_log_id: string; // Top level shift identifier
  deviceName?: string;
  exits: {
    timeOut: Date;
    timeIn?: Date;
    reason?: string;
    app_log_id: string; // Identifier for the sub-activity row
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const StaffShiftSchema: Schema = new Schema(
  {
    staffId: { type: String, required: true },
    staffName: { type: String, required: true },
    department: { type: String, required: true },
    clockIn: { type: Date, required: true },
    clockOut: { type: Date },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
      required: true,
    },
    app_log_id: { type: String, required: true, unique: true },
    deviceName: { type: String },
    exits: [
      {
        timeOut: { type: Date, required: true },
        timeIn: { type: Date },
        reason: { type: String },
        app_log_id: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

export const StaffShiftModel: Model<IStaffShift> =
  mongoose.models.StaffShift ||
  mongoose.model<IStaffShift>("StaffShift", StaffShiftSchema);
