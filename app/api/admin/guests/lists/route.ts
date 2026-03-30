import { NextResponse } from "next/server";
import { guestListRepository } from "@/lib/repositories/GuestRepository";
import crypto from "crypto";
import { withAuth } from "@/lib/authMiddleware";
import { PP } from "@/lib/portalPermissionMatrix";

async function getListsHandler() {
  try {
    const lists = await guestListRepository.findAll();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeLists = lists.map((l: any) => ({
      id: l._id.toString(),
      list_date: l.list_date,
      uploader_name: l.uploader_name,
      uploaded_at: l.get?.("uploaded_at") || l.uploaded_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export const GET = withAuth(getListsHandler, [PP.VIEW_GUEST_LIST]);
