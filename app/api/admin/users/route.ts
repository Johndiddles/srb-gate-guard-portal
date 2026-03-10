import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { userRepository } from "@/lib/repositories/UserRepository";
import { AdminRole } from "@/lib/enums";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    (session.user.role !== AdminRole.SUPER_ADMIN &&
      session.user.role !== AdminRole.RESORT_SECURITY)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const users = await userRepository.findAll();
    // omit passwords
    const safeUsers = users.map((u) => ({
      id: (u._id as Types.ObjectId).toString(),
      name: u.name,
      email: u.email,
      role: u.role,
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
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    (session.user.role !== AdminRole.SUPER_ADMIN &&
      session.user.role !== AdminRole.RESORT_SECURITY)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, role, password } = body;

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
