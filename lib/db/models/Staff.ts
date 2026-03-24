import mongoose, { Schema, Document, Model } from "mongoose";

export enum StaffStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  SUSPENDED = "Suspended",
}

export interface IStaff extends Document {
  firstName: string;
  lastName: string;
  staffId: string;
  department: string;
  rank: string;
  status: StaffStatus;
  isDeleted: boolean;
  createdBy: mongoose.Types.ObjectId | string;
  lastUpdatedBy: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    staffId: { type: String, required: true, unique: true },
    department: { type: String, required: true },
    rank: { type: String, required: true, default: "Regular" },
    status: {
      type: String,
      enum: Object.values(StaffStatus),
      default: StaffStatus.ACTIVE,
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

if (mongoose.models.Staff) {
  delete mongoose.models.Staff;
}

export const StaffModel: Model<IStaff> = mongoose.model<IStaff>("Staff", StaffSchema);
