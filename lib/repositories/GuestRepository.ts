import dbConnect from "../db/mongodb";
import {
  GuestListModel,
  IGuestList,
  IGuestEntry,
} from "../db/models/GuestList";

export interface CreateGuestListInput {
  list_date: Date;
  uploader_name: string;
  guests: IGuestEntry[];
}

export interface IGuestListRepository {
  findById(id: string): Promise<IGuestList | null>;
  findByDate(date: Date): Promise<IGuestList | null>;
  create(data: CreateGuestListInput): Promise<IGuestList>;
  overrideByDate(date: Date, data: CreateGuestListInput): Promise<IGuestList>;
  findAll(location?: string): Promise<IGuestList[]>;
  getLatest(location?: string): Promise<IGuestList | null>;
  delete(id: string): Promise<boolean>;
  deleteAll(): Promise<boolean>;
  updateGuestStatus(
    guestId: string,
    status: "arrival" | "in-house" | "checked-out",
  ): Promise<boolean>;
}

export class MongoGuestListRepository implements IGuestListRepository {
  async findById(id: string): Promise<IGuestList | null> {
    await dbConnect();
    return GuestListModel.findById(id);
  }

  async findByDate(date: Date): Promise<IGuestList | null> {
    await dbConnect();
    // Normalize date to start of day for comparison
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return GuestListModel.findOne({
      list_date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });
  }

  async getLatest(location?: string): Promise<IGuestList | null> {
    await dbConnect();
    const query = location ? { location } : {};
    return GuestListModel.findOne(query).sort({ uploaded_at: -1 });
  }

  async create(data: CreateGuestListInput): Promise<IGuestList> {
    await dbConnect();
    // Ensure list_date is normalized to start of day
    const normalizedDate = new Date(data.list_date);
    normalizedDate.setHours(0, 0, 0, 0);
    data.list_date = normalizedDate;

    const list = new GuestListModel(data);
    return list.save();
  }

  async overrideByDate(
    date: Date,
    data: CreateGuestListInput,
  ): Promise<IGuestList> {
    await dbConnect();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    // First, delete the existing one for today
    const existing = await this.findByDate(startOfDay);
    if (existing) {
      await GuestListModel.findByIdAndDelete(existing._id);
    }

    return this.create(data);
  }

  async findAll(location?: string): Promise<IGuestList[]> {
    await dbConnect();
    const query = location ? { location } : {};
    return GuestListModel.find(query).sort({ uploaded_at: -1 });
  }

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await GuestListModel.findByIdAndDelete(id);
    return result !== null;
  }

  async deleteAll(): Promise<boolean> {
    await dbConnect();
    await GuestListModel.deleteMany({});
    return true;
  }

  async updateGuestStatus(
    guestId: string,
    status: "arrival" | "in-house" | "checked-out",
  ): Promise<boolean> {
    await dbConnect();
    const result = await GuestListModel.updateOne(
      { "guests._id": guestId },
      {
        $set: {
          "guests.$.status": status,
          "guests.$.app_updated_at": new Date(),
        },
      },
    );
    return result.modifiedCount > 0;
  }
}

export const guestListRepository = new MongoGuestListRepository();
