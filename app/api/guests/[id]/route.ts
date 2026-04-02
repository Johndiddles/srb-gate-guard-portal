import { NextResponse } from "next/server";
import { guestListRepository } from "@/lib/repositories/GuestRepository";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";
import { LicensePermission } from "@/lib/licensePermissions";

async function putHandler(req: AuthenticatedRequest, context?: { params?: Promise<{ id?: string }> | { id?: string } }) {
  try {
    let id: string | undefined;

    if (context && context.params) {
      if (context.params instanceof Promise) {
        const resolvedParams = await context.params;
        id = resolvedParams.id;
      } else {
        id = context.params.id;
      }
    }

    if (!id) {
      return NextResponse.json({ error: "Missing guest ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !["arrival", "in-house", "checked-out"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const success = await guestListRepository.updateGuestStatus(id, status);

    if (success) {
      return NextResponse.json({ success: true, message: "Guest updated" }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Guest not found or not modified" }, { status: 404 });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update guest status" },
      { status: 500 },
    );
  }
}

export const PUT = withAuth(putHandler, undefined, [
  LicensePermission.LOG_GUEST_MOVEMENT,
]);
