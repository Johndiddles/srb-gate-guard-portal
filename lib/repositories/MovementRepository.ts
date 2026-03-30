import dbConnect from "../db/mongodb";
import { MovementModel, IMovement } from "../db/models/Movement";
import { MovementType, MovementDirection } from "../enums";

export interface MovementFilters {
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  name?: string | null;
  department?: string | null;
  licensePlate?: string | null;
  staffId?: string | null;
  status?: string | null;
}

export interface CreateMovementInput {
  type: MovementType;
  direction?: MovementDirection;
  plate_number?: string;
  name?: string;
  guest_name?: string;
  guest_id?: string;
  room_number?: string;
  reason?: string;
  mode?: string;
  app_updated_at?: Date;
  app_log_id: string;
  timeIn?: Date;
  timeOut?: Date;
  timestamp?: Date;
  deviceName?: string;
}

export interface IMovementRepository {
  findById(id: string): Promise<IMovement | null>;
  findByAppLogId(app_log_id: string): Promise<IMovement | null>;
  create(data: CreateMovementInput): Promise<IMovement>;
  findByType(type: MovementType, limit?: number, filters?: MovementFilters): Promise<IMovement[]>;
  findByDeviceName(deviceName: string): Promise<IMovement[]>;
  findAll(): Promise<IMovement[]>;
}

export class MongoMovementRepository implements IMovementRepository {
  async findById(id: string): Promise<IMovement | null> {
    await dbConnect();
    return MovementModel.findById(id);
  }

  async findByAppLogId(app_log_id: string): Promise<IMovement | null> {
    await dbConnect();
    return MovementModel.findOne({ app_log_id });
  }

  async create(data: CreateMovementInput): Promise<IMovement> {
    await dbConnect();
    const movement = new MovementModel({
      ...data,
      timestamp: data.timestamp || new Date(),
    });
    return movement.save();
  }

  async findByType(
    type: MovementType,
    limit: number = 50,
    filters?: MovementFilters
  ): Promise<IMovement[]> {
    await dbConnect();

    const query: any = { type };

    if (filters) {
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: "i" } },
          { guest_name: { $regex: filters.search, $options: "i" } },
          { plate_number: { $regex: filters.search, $options: "i" } },
          { reason: { $regex: filters.search, $options: "i" } },
        ];
      }
      
      if (filters.name) {
        query.$or = query.$or || [];
        query.$or.push(
          { name: { $regex: filters.name, $options: "i" } },
          { guest_name: { $regex: filters.name, $options: "i" } }
        );
      }
      
      if (filters.licensePlate) {
        query.plate_number = { $regex: filters.licensePlate, $options: "i" };
      }

      if (filters.startDate || filters.endDate) {
        query.timestamp = {};
        if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
        if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
      }

      if (filters.status) {
        if (filters.status === "active") {
          query.timeOut = { $exists: false };
        } else if (filters.status === "completed") {
          query.timeOut = { $exists: true };
        }
      }
    }

    return MovementModel.find(query).sort({ timestamp: -1 }).limit(limit);
  }

  async findByDeviceName(deviceName: string): Promise<IMovement[]> {
    await dbConnect();
    return MovementModel.find({ deviceName }).sort({ timestamp: -1 });
  }

  async findAll(): Promise<IMovement[]> {
    await dbConnect();
    return MovementModel.find({}).sort({ timestamp: -1 });
  }
}

export const movementRepository = new MongoMovementRepository();
