import dbConnect from "../db/mongodb";
import { LicenseModel, ILicense } from "../db/models/License";
import { LicenseStatus } from "../enums";

export interface CreateLicenseInput {
  key: string;
  device_name: string;
  location: string;
  permissions: string[];
}

export interface ILicenseRepository {
  findById(id: string): Promise<ILicense | null>;
  findByKey(key: string): Promise<ILicense | null>;
  findByToken(token: string): Promise<ILicense | null>;
  create(data: CreateLicenseInput): Promise<ILicense>;
  update(id: string, data: Partial<ILicense>): Promise<ILicense | null>;
  findAll(location?: string): Promise<ILicense[]>;
  delete(id: string): Promise<boolean>;
  markAsUsed(
    id: string,
    deviceName: string,
    deviceToken: string,
  ): Promise<ILicense | null>;
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

  async findByToken(token: string): Promise<ILicense | null> {
    await dbConnect();
    return LicenseModel.findOne({ device_token: token });
  }

  async create(data: CreateLicenseInput): Promise<ILicense> {
    await dbConnect();
    const license = new LicenseModel(data);
    return license.save();
  }

  async update(id: string, data: Partial<ILicense>): Promise<ILicense | null> {
    await dbConnect();
    return LicenseModel.findByIdAndUpdate(id, data, { returnDocument: 'after' });
  }

  async findAll(location?: string): Promise<ILicense[]> {
    await dbConnect();
    const query = location ? { location } : {};
    return LicenseModel.find(query).sort({ createdAt: -1 });
  }

  async delete(id: string): Promise<boolean> {
    await dbConnect();
    const result = await LicenseModel.findByIdAndDelete(id);
    return result !== null;
  }

  async markAsUsed(
    id: string,
    deviceName: string,
    deviceToken: string,
  ): Promise<ILicense | null> {
    await dbConnect();
    return LicenseModel.findByIdAndUpdate(
      id,
      {
        status: LicenseStatus.USED,
        device_name: deviceName,
        device_token: deviceToken,
      },
      { returnDocument: 'after' },
    );
  }
}

export const licenseRepository = new MongoLicenseRepository();
