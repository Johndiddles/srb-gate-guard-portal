import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { guestListRepository } from "@/lib/repositories/GuestRepository";
import { AdminRole } from "@/lib/enums";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    (session.user.role !== AdminRole.SUPER_ADMIN &&
      session.user.role !== AdminRole.FRONT_DESK &&
      session.user.role !== AdminRole.RESORT_SECURITY)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const lists = await guestListRepository.findAll();
    const safeLists = lists.map((l: any) => ({
      id: l._id.toString(),
      list_date: l.list_date,
      uploader_name: l.uploader_name,
      uploaded_at: l.get?.("uploaded_at") || l.uploaded_at,
      guests: l.guests.map((g: any) => ({
        id: g._id?.toString() || crypto.randomUUID(),
        firstName: g.firstName,
        lastName: g.lastName,
        roomNumber: g.roomNumber,
        status: g.status,
        arrivalDate: g.arrivalDate,
        notes: g.notes,
      })),
    }));
    return NextResponse.json(safeLists, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch guest lists" },
      { status: 500 },
    );
  }
}
