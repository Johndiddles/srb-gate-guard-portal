import path from "path";
import * as dotenv from "dotenv";
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import bcrypt from "bcryptjs";
import { userRepository } from "../lib/repositories/UserRepository";
import { AdminRole } from "../lib/enums";

async function seed() {
  console.log("Seeding initial super admin...");
  try {
    const existingAdmin = await userRepository.findByEmail("admin@srb.com");
    if (existingAdmin) {
      console.log("Admin already exists. Exiting.");
      process.exit(0);
    }

    const password_hash = await bcrypt.hash("admin123", 10);
    await userRepository.create({
      name: "Super Admin",
      email: "admin@srb.com",
      role: AdminRole.SUPER_ADMIN,
      password_hash,
    });

    console.log("Successfully created super admin: admin@srb.com / admin123");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed:", error);
    process.exit(1);
  }
}

seed();
