import mongoose, { Schema, Document, Model } from "mongoose";
import { AdminRole, ResortLocation } from "../../enums";

export interface IUser extends Document {
  name: string;
  email: string;
  role: AdminRole;
  password_hash: string;
  requires_password_change: boolean;
  reset_token?: string;
  reset_token_expiry?: Date;
  location?: ResortLocation;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: Object.values(AdminRole),
      required: true,
    },
    password_hash: { type: String, required: true },
    requires_password_change: { type: Boolean, default: true },
    reset_token: { type: String, required: false },
    reset_token_expiry: { type: Date, required: false },
    location: {
      type: String,
      enum: Object.values(ResortLocation),
      required: false,
    },
  },
  { timestamps: true },
);

export const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
