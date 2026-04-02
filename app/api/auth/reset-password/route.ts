import { NextResponse } from "next/server";
import { userRepository } from "@/lib/repositories/UserRepository";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    const user = await userRepository.findByResetToken(token);

    if (!user || !user.reset_token_expiry) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 },
      );
    }

    if (new Date() > user.reset_token_expiry) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 },
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRepository.update(user._id.toString(), {
      password_hash: hashedPassword,
      requires_password_change: false,
      reset_token: undefined,
      reset_token_expiry: undefined,
    } as Record<string, unknown>);

    return NextResponse.json(
      { success: true, message: "Password has been successfully reset" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 },
    );
  }
}
