import dbConnect from "../db/mongodb";
import { KeyCollectionModel, IKeyCollection } from "../db/models/KeyCollection";

export interface KeyCollectionFilters {
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  keyTag?: string | null;
  staffId?: string | null;
}

export interface CreateKeyCollectionInput {
  keyTag: string;
  collectingStaffId: string;
  collectingStaffName?: string;
  collectingStaffDepartment?: string;
  collectedAt: Date;
  returningStaffId?: string;
  returningStaffName?: string;
  returningStaffDepartment?: string;
  returnedAt?: Date;
  status?: "collected" | "returned" | "resolved";
  app_log_id: string;
  deviceName: string;
  location: string;
}

export interface IKeyCollectionRepository {
  findById(id: string): Promise<IKeyCollection | null>;
  findByAppLogId(app_log_id: string): Promise<IKeyCollection | null>;
  create(data: CreateKeyCollectionInput): Promise<IKeyCollection>;
  findByFilters(
    filters?: KeyCollectionFilters,
    location?: string,
    limit?: number
  ): Promise<IKeyCollection[]>;
  findAll(location?: string): Promise<IKeyCollection[]>;
}

export class MongoKeyCollectionRepository implements IKeyCollectionRepository {
  async findById(id: string): Promise<IKeyCollection | null> {
    await dbConnect();
    return KeyCollectionModel.findById(id);
  }

  async findByAppLogId(app_log_id: string): Promise<IKeyCollection | null> {
    await dbConnect();
    return KeyCollectionModel.findOne({ app_log_id });
  }

  async create(data: CreateKeyCollectionInput): Promise<IKeyCollection> {
    await dbConnect();
    const keyCollection = new KeyCollectionModel({
      ...data,
      status: data.status || "collected",
    });
    return keyCollection.save();
  }

  async findByFilters(
    filters?: KeyCollectionFilters,
    location?: string,
    limit: number = 100
  ): Promise<IKeyCollection[]> {
    await dbConnect();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (location) query.location = location;

    if (filters) {
      if (filters.search) {
        const cleanSearch = filters.search.trim();
        query.$or = [
          { keyTag: { $regex: cleanSearch, $options: "i" } },
          { collectingStaffId: { $regex: cleanSearch, $options: "i" } },
          { collectingStaffName: { $regex: cleanSearch, $options: "i" } },
          { collectingStaffDepartment: { $regex: cleanSearch, $options: "i" } },
          { returningStaffId: { $regex: cleanSearch, $options: "i" } },
          { returningStaffName: { $regex: cleanSearch, $options: "i" } },
          { returningStaffDepartment: { $regex: cleanSearch, $options: "i" } },
        ];
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.keyTag) {
        query.keyTag = { $regex: filters.keyTag, $options: "i" };
      }

      if (filters.staffId) {
        query.$or = [
          { collectingStaffId: { $regex: filters.staffId, $options: "i" } },
          { returningStaffId: { $regex: filters.staffId, $options: "i" } },
        ];
      }

      if (filters.startDate || filters.endDate) {
        query.collectedAt = {};
        if (filters.startDate) {
          query.collectedAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.collectedAt.$lte = new Date(filters.endDate);
        }
      }
    }

    return KeyCollectionModel.find(query)
      .sort({ collectedAt: -1 })
      .limit(limit);
  }

  async findAll(location?: string): Promise<IKeyCollection[]> {
    await dbConnect();
    const query = location ? { location } : {};
    return KeyCollectionModel.find(query).sort({ collectedAt: -1 });
  }
}

export const keyCollectionRepository = new MongoKeyCollectionRepository();
