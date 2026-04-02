import { NextResponse } from "next/server";
import { userRepository } from "@/lib/repositories/UserRepository";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      return NextResponse.json(
        {
          message: "If that email exists, a password reset link has been sent.",
        },
        { status: 200 },
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await userRepository.update(user._id.toString(), {
      reset_token: resetToken,
      reset_token_expiry: tokenExpiry,
    });

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;

    // TODO: INTEGRATE NODEMAILER FOR DELIVERING PASSWORD RESET LINK!
    console.log(
      `[MAILER MOCK]: Reset password link for ${email}: ${resetLink}`,
    );

    return NextResponse.json(
      {
        message: "If that email exists, a password reset link has been sent.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
