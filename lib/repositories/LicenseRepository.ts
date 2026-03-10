import dbConnect from "../db/mongodb";
import { LicenseModel, ILicense } from "../db/models/License";
import { LicenseStatus } from "../enums";

export interface CreateLicenseInput {
  key: string;
  device_name: string;
  permissions: string[];
}

export interface ILicenseRepository {
  findById(id: string): Promise<ILicense | null>;
  findByKey(key: string): Promise<ILicense | null>;
  create(data: CreateLicenseInput): Promise<ILicense>;
  update(id: string, data: Partial<ILicense>): Promise<ILicense | null>;
  findAll(): Promise<ILicense[]>;
  delete(id: string): Promise<boolean>;
  markAsUsed(id: string, deviceName: string): Promise<ILicense | null>;
}

export class MongoLicenseRepository implements ILicenseRepository {
  async findById(id: string): Promise<ILicense | null> {
    await dbConnect();
    return LicenseModel.findById(id);
  }

  async findByKey(key: string): Promise<ILicense | null> {
    await dbConnect();
    return LicenseModel.findOne({ key });
  }

  async create(data: CreateLicenseInput): Promise<ILicense> {
    await dbConnect();
    const license = new LicenseModel(data);
    return license.save();
  }

  async update(id: string, data: Partial<ILicense>): Promise<ILicense | null> {
    await dbConnect();
    return LicenseModel.findByIdAndUpdate(id, data, { new: true });
  }

  async findAll(): Promise<ILicense[]> {
    await dbConnect();
    return LicenseModel.find({}).sort({ createdAt: -1 });
  }

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await LicenseModel.findByIdAndDelete(id);
    return result !== null;
  }

  async markAsUsed(id: string, deviceName: string): Promise<ILicense | null> {
    await dbConnect();
    return LicenseModel.findByIdAndUpdate(
      id,
      { status: LicenseStatus.USED, device_name: deviceName },
      { new: true },
    );
  }
}

export const licenseRepository = new MongoLicenseRepository();
