import dbConnect from "../db/mongodb";
import { PhoneBoothAssignmentModel, IPhoneBoothAssignment } from "../db/models/PhoneBoothAssignment";

export interface PhoneBoothFilters {
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  staffId?: string | null;
  status?: string | null;
  slotNumber?: number | null;
}

export interface CreatePhoneBoothInput {
  staffId: string;
  staffName?: string;
  department?: string;
  slotNumber: number;
  assignedAt: Date;
  retrievedAt?: Date;
  status?: "assigned" | "retrieved";
  app_log_id: string;
  deviceName?: string;
  location?: string;
}

export interface IPhoneBoothRepository {
  findById(id: string): Promise<IPhoneBoothAssignment | null>;
  findByAppLogId(app_log_id: string): Promise<IPhoneBoothAssignment | null>;
  create(data: CreatePhoneBoothInput): Promise<IPhoneBoothAssignment>;
  findByFilters(
    filters?: PhoneBoothFilters,
    location?: string,
    limit?: number
  ): Promise<IPhoneBoothAssignment[]>;
  findActiveAssignments(location?: string): Promise<IPhoneBoothAssignment[]>;
  findAll(location?: string): Promise<IPhoneBoothAssignment[]>;
}

export class MongoPhoneBoothRepository implements IPhoneBoothRepository {
  async findById(id: string): Promise<IPhoneBoothAssignment | null> {
    await dbConnect();
    return PhoneBoothAssignmentModel.findById(id);
  }

  async findByAppLogId(app_log_id: string): Promise<IPhoneBoothAssignment | null> {
    await dbConnect();
    return PhoneBoothAssignmentModel.findOne({ app_log_id });
  }

  async create(data: CreatePhoneBoothInput): Promise<IPhoneBoothAssignment> {
    await dbConnect();
    const assignment = new PhoneBoothAssignmentModel({
      ...data,
      status: data.status || "assigned",
    });
    return assignment.save();
  }

  async findByFilters(
    filters?: PhoneBoothFilters,
    location?: string,
    limit: number = 100
  ): Promise<IPhoneBoothAssignment[]> {
    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (location) query.location = location;

    if (filters) {
      if (filters.search) {
        const cleanSearch = filters.search.trim();
        const isNum = !isNaN(Number(cleanSearch));
        query.$or = [
          { staffName: { $regex: cleanSearch, $options: "i" } },
          { staffId: { $regex: cleanSearch, $options: "i" } },
          { department: { $regex: cleanSearch, $options: "i" } },
        ];
        if (isNum) {
          query.$or.push({ slotNumber: Number(cleanSearch) });
        }
      }

      if (filters.staffId) {
        query.staffId = { $regex: filters.staffId, $options: "i" };
      }

      if (filters.slotNumber !== undefined && filters.slotNumber !== null) {
        query.slotNumber = filters.slotNumber;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        query.assignedAt = {};
        if (filters.startDate) {
          query.assignedAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.assignedAt.$lte = new Date(filters.endDate);
        }
      }
    }

    return PhoneBoothAssignmentModel.find(query)
      .sort({ assignedAt: -1 })
      .limit(limit);
  }

  async findActiveAssignments(location?: string): Promise<IPhoneBoothAssignment[]> {
    await dbConnect();
    const query: Record<string, unknown> = { status: "assigned" };
    if (location) query.location = location;
    return PhoneBoothAssignmentModel.find(query).sort({ slotNumber: 1 });
  }

  async findAll(location?: string): Promise<IPhoneBoothAssignment[]> {
    await dbConnect();
    const query = location ? { location } : {};
    return PhoneBoothAssignmentModel.find(query).sort({ assignedAt: -1 });
  }
}

export const phoneBoothRepository = new MongoPhoneBoothRepository();
