import mongoose, { Schema, Document, Model } from "mongoose";
import { MovementType, MovementDirection } from "../../enums";

export interface IMovement extends Document {
  type: MovementType;
  direction?: MovementDirection;
  plate_number?: string;
  name?: string;
  guest_name?: string;
  guest_id?: string;
  room_number?: string;
  reason?: string;
  staff_id?: string;
  department?: string;
  rank?: string;
  mode?: string;
  app_updated_at?: Date;
  app_log_id: string;
  timeIn?: Date;
  timeOut?: Date;
  timestamp?: Date;
  deviceName?: string;
}

const MovementSchema: Schema = new Schema({
  type: {
    type: String,
    enum: Object.values(MovementType),
    required: true,
  },
  direction: {
    type: String,
    enum: Object.values(MovementDirection),
    required: false,
  },
  plate_number: { type: String },
  name: { type: String },
  guest_name: { type: String },
  guest_id: { type: String },
  room_number: { type: String },
  reason: { type: String },
  staff_id: { type: String },
  department: { type: String },
  rank: { type: String },
  mode: { type: String },
  app_updated_at: { type: Date },
  app_log_id: { type: String, required: true, unique: true },
  timeIn: { type: Date },
  timeOut: { type: Date },
  timestamp: { type: Date, default: Date.now },
  deviceName: { type: String },
});

export const MovementModel: Model<IMovement> =
  mongoose.models.Movement ||
  mongoose.model<IMovement>("Movement", MovementSchema);
