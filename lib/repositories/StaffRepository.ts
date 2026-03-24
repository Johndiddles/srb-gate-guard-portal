import dbConnect from "../db/mongodb";
import { StaffModel, IStaff, StaffStatus } from "../db/models/Staff";

export interface CreateStaffInput {
  firstName: string;
  lastName: string;
  staffId: string;
  department: string;
  rank?: string;
  status?: StaffStatus;
  createdBy: string;
  lastUpdatedBy: string;
}

export interface IStaffRepository {
  findById(id: string): Promise<IStaff | null>;
  findByStaffId(staffId: string): Promise<IStaff | null>;
  create(data: CreateStaffInput): Promise<IStaff>;
  update(id: string, data: Partial<IStaff>): Promise<IStaff | null>;
  findAll(query?: Record<string, unknown>): Promise<IStaff[]>;
  delete(id: string): Promise<boolean>;
  insertMany(staffList: CreateStaffInput[]): Promise<IStaff[]>;
  generateNextStaffIds(count: number): Promise<string[]>;
}

export class MongoStaffRepository implements IStaffRepository {
  async findById(id: string): Promise<IStaff | null> {
    await dbConnect();
    return StaffModel.findOne({ _id: id, isDeleted: { $ne: true } }).populate("createdBy", "name email").populate("lastUpdatedBy", "name email");
  }

  async findByStaffId(staffId: string): Promise<IStaff | null> {
    await dbConnect();
    return StaffModel.findOne({ staffId, isDeleted: { $ne: true } });
  }

  async create(data: CreateStaffInput): Promise<IStaff> {
    await dbConnect();
    const staff = new StaffModel(data);
    return staff.save();
  }

  async update(id: string, data: Partial<IStaff>): Promise<IStaff | null> {
    await dbConnect();
    return StaffModel.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async findAll(query: Record<string, unknown> = {}): Promise<IStaff[]> {
    await dbConnect();
    return StaffModel.find({ ...query, isDeleted: { $ne: true } })
      .populate("createdBy", "name")
      .populate("lastUpdatedBy", "name")
      .sort({ createdAt: -1 });
  }

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await StaffModel.findByIdAndUpdate(id, { isDeleted: true });
    return result !== null;
  }

  async insertMany(staffList: CreateStaffInput[]): Promise<IStaff[]> {
    await dbConnect();
    // Use insertMany for bulk inserts.
    // If we want to upsert or skip duplicates, we might want to handle it properly, 
    // but for now insertMany with ordered: false lets it insert all non-duplicates and fail on duplicates.
    try {
      const result = await StaffModel.insertMany(staffList, { ordered: false });
      return result;
    } catch (error: unknown) {
      // If error is 11000 (duplicate key), some might have been inserted.
      // We can return the inserted docs if available in error.insertedDocs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any).code === 11000 && (error as any).insertedDocs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (error as any).insertedDocs;
      }
      throw error;
    }
  }

  async generateNextStaffIds(count: number): Promise<string[]> {
    await dbConnect();
    const prefix = "ST";
    const lastStaff = await StaffModel.findOne({ staffId: new RegExp(`^${prefix}\\d{4}$`) })
      .sort({ staffId: -1 })
      .exec();

    let nextIdNum = 1;
    if (lastStaff) {
      const match = lastStaff.staffId.match(/\d+$/);
      if (match) {
        nextIdNum = parseInt(match[0], 10) + 1;
      }
    }

    const newIds: string[] = [];
    for (let i = 0; i < count; i++) {
      newIds.push(`${prefix}${(nextIdNum + i).toString().padStart(4, "0")}`);
    }
    return newIds;
  }
}

export const staffRepository = new MongoStaffRepository();
