import { NextResponse } from "next/server";
import { guestListRepository } from "@/lib/repositories/GuestRepository";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";

async function getGuestsHandler(_req: AuthenticatedRequest) {
  try {
    const latestList = await guestListRepository.getLatest();
    if (!latestList) {
      return NextResponse.json([], { status: 200 });
    }

    // We want to return just the array of guests for the mobile app
    return NextResponse.json(latestList.guests, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch expected guests" },
      { status: 500 },
    );
  }
}

export const GET = withAuth(getGuestsHandler);
