import mongoose, { Schema, Document, Model } from "mongoose";
import { LicenseStatus, ResortLocation } from "../../enums";

export interface ILicense extends Document {
  key: string;
  device_name?: string;
  device_token?: string;
  status: LicenseStatus;
  permissions: string[];
  location: ResortLocation;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    device_name: { type: String },
    device_token: { type: String },
    status: {
      type: String,
      enum: Object.values(LicenseStatus),
      default: LicenseStatus.UNUSED,
    },
    permissions: [{ type: String }],
    location: {
      type: String,
      enum: Object.values(ResortLocation),
      required: true,
    },
  },
  { timestamps: true },
);

export const LicenseModel: Model<ILicense> =
  mongoose.models.License || mongoose.model<ILicense>("License", LicenseSchema);
