import { NextResponse } from "next/server";
import { movementRepository } from "@/lib/repositories/MovementRepository";
import { guestListRepository } from "@/lib/repositories/GuestRepository";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";
import { MovementType } from "@/lib/enums";
import {
  licensePermissionForMovementType,
  LicensePermission,
} from "@/lib/licensePermissions";
import { PORTAL_SECURITY_ROLES } from "@/lib/portalRoles";

// Quick in-memory store for SSE subscribers
export const clients: Record<string, Set<ReadableStreamDefaultController>> = {
  GUEST: new Set(),
  VEHICULAR: new Set(),
  STAFF_PARKING: new Set(),
};

async function postMovementHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const {
      type,
      direction,
      plate_number,
      name,
      guest_name,
      room_number,
      reason,
      mode,
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

    if (req.device) {
      const required = licensePermissionForMovementType(type);
      if (
        required &&
        !req.device.permissions.includes(required)
      ) {
        return NextResponse.json(
          { error: "Forbidden: License missing required permission" },
          { status: 403 },
        );
      }
    } else if (req.user) {
      if (
        type === MovementType.STAFF_PARKING &&
        !PORTAL_SECURITY_ROLES.includes(req.user.role)
      ) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient role permissions" },
          { status: 403 },
        );
      }
    }

    // Try to find existing movement by app_log_id
    let movement = await movementRepository.findByAppLogId(app_log_id);

    if (movement) {
      // Update existing movement (Closing the cycle)
      if (timeIn) movement.timeIn = new Date(timeIn);
      if (timeOut) movement.timeOut = new Date(timeOut);
      if (app_updated_at) movement.app_updated_at = new Date(app_updated_at);
      if (direction) movement.direction = direction; // Keep direction fallback if needed
      if (mode) movement.mode = mode;
      await movement.save();
    } else {
      // Create new movement cycle
      movement = await movementRepository.create({
        type,
        direction,
        plate_number,
        name,
        guest_name,
        guest_id,
        room_number,
        reason,
        mode,
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

async function getMovementsHandler(req: AuthenticatedRequest) {
  console.log("Getting movements");
  try {
    const deviceName = req.device?.name;
    if (!deviceName) {
      return NextResponse.json(
        { error: "Device name required" },
        { status: 400 },
      );
    }

    const anyMovementLog: string[] = [
      LicensePermission.LOG_GUEST_MOVEMENT,
      LicensePermission.LOG_VEHICULAR_MOVEMENT,
      LicensePermission.LOG_STAFF_PARKING,
    ];
    if (
      req.device &&
      !req.device.permissions.some((p) => anyMovementLog.includes(p))
    ) {
      return NextResponse.json(
        { error: "Forbidden: License missing movement logging permission" },
        { status: 403 },
      );
    }

    const movements = await movementRepository.findByDeviceName(deviceName);
    console.log(JSON.stringify({ movements }, null, 2));
    return NextResponse.json(movements, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch movements" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(postMovementHandler);
export const GET = withAuth(getMovementsHandler);
