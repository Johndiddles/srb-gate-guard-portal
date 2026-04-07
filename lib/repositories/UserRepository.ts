import dbConnect from "../db/mongodb";
import { UserModel, IUser } from "../db/models/User";
import { AdminRole } from "../enums";

export interface CreateUserInput {
  name: string;
  email: string;
  role: AdminRole;
  location?: string;
  password_hash: string;
}

export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  findByResetToken(token: string): Promise<IUser | null>;
  create(data: CreateUserInput): Promise<IUser>;
  update(id: string, data: Partial<IUser>): Promise<IUser | null>;
  findAll(location?: string): Promise<IUser[]>;
  delete(id: string): Promise<boolean>;
}

export class MongoUserRepository implements IUserRepository {
  async findById(id: string): Promise<IUser | null> {
    await dbConnect();
    return UserModel.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    await dbConnect();
    return UserModel.findOne({ email });
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    await dbConnect();
    return UserModel.findOne({ reset_token: token });
  }

  async create(data: CreateUserInput): Promise<IUser> {
    await dbConnect();
    const user = new UserModel(data);
    return user.save();
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    await dbConnect();
    return UserModel.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async findAll(location?: string): Promise<IUser[]> {
    await dbConnect();
    const query = location ? { location } : {};
    return UserModel.find(query);
  }

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await UserModel.findByIdAndDelete(id);
    return result !== null;
  }
}

export const userRepository = new MongoUserRepository();
