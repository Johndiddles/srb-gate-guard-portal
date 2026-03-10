import dbConnect from "../db/mongodb";
import { MovementModel, IMovement } from "../db/models/Movement";
import { MovementType, MovementDirection } from "../enums";

export interface CreateMovementInput {
  type: MovementType;
  direction: MovementDirection;
  plate_number?: string;
  guest_name?: string;
  reason?: string;
  timestamp?: Date;
}

export interface IMovementRepository {
  findById(id: string): Promise<IMovement | null>;
  create(data: CreateMovementInput): Promise<IMovement>;
  findByType(type: MovementType, limit?: number): Promise<IMovement[]>;
  findAll(): Promise<IMovement[]>;
}

export class MongoMovementRepository implements IMovementRepository {
  async findById(id: string): Promise<IMovement | null> {
    await dbConnect();
    return MovementModel.findById(id);
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
  ): Promise<IMovement[]> {
    await dbConnect();
    return MovementModel.find({ type }).sort({ timestamp: -1 }).limit(limit);
  }

  async findAll(): Promise<IMovement[]> {
    await dbConnect();
    return MovementModel.find({}).sort({ timestamp: -1 });
  }
}

export const movementRepository = new MongoMovementRepository();
