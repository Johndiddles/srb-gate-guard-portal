import mongoose, { Schema, Document, Model } from "mongoose";
import { MovementType, MovementDirection } from "../../enums";

export interface IMovement extends Document {
  type: MovementType;
  direction: MovementDirection;
  plate_number?: string;
  guest_name?: string;
  reason?: string;
  timestamp: Date;
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
    required: true,
  },
  plate_number: { type: String },
  guest_name: { type: String },
  reason: { type: String },
  timestamp: { type: Date, default: Date.now, required: true },
});

export const MovementModel: Model<IMovement> =
  mongoose.models.Movement ||
  mongoose.model<IMovement>("Movement", MovementSchema);
