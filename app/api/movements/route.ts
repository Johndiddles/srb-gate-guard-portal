import { NextResponse } from "next/server";
import { movementRepository } from "@/lib/repositories/MovementRepository";
import { guestListRepository } from "@/lib/repositories/GuestRepository";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";

// Quick in-memory store for SSE subscribers
export const clients: Record<string, Set<ReadableStreamDefaultController>> = {
  GUEST: new Set(),
  VEHICULAR: new Set(),
};

async function postMovementHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const {
      type,
      direction,
      plate_number,
      guest_name,
      room_number,
      reason,
      app_updated_at,
      guest_id,
      app_log_id,
      timeIn,
      timeOut,
    } = body;

    if (!type || !app_log_id) {
      return NextResponse.json(
        { error: "Missing required fields: type or app_log_id" },
        { status: 400 },
      );
    }

    // Try to find existing movement by app_log_id
    let movement = await movementRepository.findByAppLogId(app_log_id);

    if (movement) {
      // Update existing movement (Closing the cycle)
      if (timeIn) movement.timeIn = new Date(timeIn);
      if (timeOut) movement.timeOut = new Date(timeOut);
      if (app_updated_at) movement.app_updated_at = new Date(app_updated_at);
      if (direction) movement.direction = direction; // Keep direction fallback if needed
      await movement.save();
    } else {
      // Create new movement cycle
      movement = await movementRepository.create({
        type,
        direction,
        plate_number,
        guest_name,
        room_number,
        reason,
        app_log_id,
        timeIn: timeIn ? new Date(timeIn) : undefined,
        timeOut: timeOut ? new Date(timeOut) : undefined,
        app_updated_at: app_updated_at ? new Date(app_updated_at) : undefined,
        timestamp: new Date(),
        deviceName: req.device?.name, // Capture device name if present
      });
    }

    const newMovement = movement;

    if (type === "GUEST" && guest_id) {
      const latestList = await guestListRepository.getLatest();
      if (latestList) {
        const guestIndex = latestList.guests.findIndex(
          (g) =>
            (
              g as unknown as { _id?: { toString: () => string } }
            )._id?.toString() === guest_id || g.id === guest_id,
        );
        if (guestIndex !== -1) {
          const guest = latestList.guests[guestIndex];
          const incomingDate = app_updated_at
            ? new Date(app_updated_at)
            : new Date();
          const existingDate = guest.app_updated_at
            ? new Date(guest.app_updated_at)
            : new Date(0);

          if (incomingDate > existingDate) {
            // If the incoming sync includes timeIn but NOT timeOut, or if it has timeIn that is newer,
            // Then the guest is back in. If it ONLY has timeOut, the guest is out.
            // Simplified logic: If we receive a timeOut, guest is out. If we receive a timeIn, guest is in.
            // BUT given this is UPSERT, 'timeOut' comes first, then 'timeIn' gets added later.
            // If the update we're processing now *added* the timeIn, they returned.
            // If sync pushes timeIn, they are IN. If it pushes only timeOut, they are OUT.
            guest.isOut = timeIn ? false : timeOut ? true : direction === "OUT";
            guest.app_updated_at = incomingDate;
            await latestList.save();
          }
        }
      }
    }

    // Dispatch to SSE clients
    if (clients[type]) {
      const payload = `data: ${JSON.stringify(newMovement)}\n\n`;
      clients[type].forEach((controller) => {
        try {
          controller.enqueue(new TextEncoder().encode(payload));
        } catch (e) {
          // ignore error if client is gone
          console.error(e);
        }
      });
    }

    return NextResponse.json(
      { message: "Movement logged successfully", movement: newMovement },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to log movement" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(postMovementHandler);
