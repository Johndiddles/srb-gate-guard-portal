import { NextRequest, NextResponse } from "next/server";
import { userRepository } from "@/lib/repositories/UserRepository";
import bcrypt from "bcryptjs";
import { requirePortalPermissions } from "@/lib/portalSession";
import { PP } from "@/lib/portalPermissionMatrix";
import { Types } from "mongoose";

export async function GET() {
  const gate = await requirePortalPermissions([PP.VIEW_USER]);
  if (gate.error) return gate.error;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userLimitLocation = gate.session.user.role === "SUPER_ADMIN" ? undefined : (gate.session.user as any).location;
    const users = await userRepository.findAll(userLimitLocation);
    // omit passwords
    const safeUsers = users.map((u) => ({
      id: (u._id as Types.ObjectId).toString(),
      name: u.name,
      email: u.email,
      role: u.role,
      location: (u as any).location,
      requires_password_change: u.requires_password_change,
      createdAt: u.createdAt,
    }));
    return NextResponse.json(safeUsers, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requirePortalPermissions([PP.CREATE_USER]);
  if (gate.error) return gate.error;

  try {
    const body = await req.json();
    const { name, email, role, location, password } = body;

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 },
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await userRepository.create({
      name,
      email,
      role,
      location,
      password_hash,
    });

    return NextResponse.json(
      { message: "User created successfully", userId: newUser._id.toString() },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
