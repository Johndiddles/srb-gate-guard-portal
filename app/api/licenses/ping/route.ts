import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";

async function pingHandler() {
  try {
    return NextResponse.json(
      { success: true, message: "License is active" },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to ping license" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(pingHandler);
