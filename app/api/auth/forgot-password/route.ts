import { NextResponse } from "next/server";
import { userRepository } from "@/lib/repositories/UserRepository";
import { sendPasswordResetEmail } from "@/lib/mail/sendPasswordResetEmail";
import crypto from "crypto";

function publicAppBaseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

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

    const resetLink = `${publicAppBaseUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`;

    try {
      await sendPasswordResetEmail(user.email, resetLink);
    } catch (mailErr) {
      console.error("Password reset email failed:", mailErr);
      await userRepository.clearPasswordResetFields(user._id.toString());
      return NextResponse.json(
        { error: "Could not send reset email. Please try again later." },
        { status: 503 },
      );
    }

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
