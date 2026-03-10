import mongoose, { Schema, Document, Model } from "mongoose";
import { GuestType } from "../../enums";

export interface IGuest extends Document {
  name: string;
  type: GuestType;
  arrival_date: Date;
  departure_date: Date;
  uploaded_at: Date;
}

const GuestSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: Object.values(GuestType),
    required: true,
  },
  arrival_date: { type: Date, required: true },
  departure_date: { type: Date, required: true },
  uploaded_at: { type: Date, default: Date.now },
});

export const GuestModel: Model<IGuest> =
  mongoose.models.Guest || mongoose.model<IGuest>("Guest", GuestSchema);
