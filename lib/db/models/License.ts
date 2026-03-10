import mongoose, { Schema, Document, Model } from "mongoose";
import { LicenseStatus } from "../../enums";

export interface ILicense extends Document {
  key: string;
  device_name?: string;
  status: LicenseStatus;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    device_name: { type: String },
    status: {
      type: String,
      enum: Object.values(LicenseStatus),
      default: LicenseStatus.UNUSED,
    },
    permissions: [{ type: String }],
  },
  { timestamps: true },
);

export const LicenseModel: Model<ILicense> =
  mongoose.models.License || mongoose.model<ILicense>("License", LicenseSchema);
