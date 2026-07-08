import { NextResponse } from "next/server";
import { PhoneBoothAssignmentModel } from "@/lib/db/models/PhoneBoothAssignment";
import { phoneBoothRepository } from "@/lib/repositories/PhoneBoothRepository";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";
import { PP } from "@/lib/portalPermissionMatrix";

// POST: Lock a slot
async function lockSlotHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { slotNumber } = body;

    const slotVal = Number(slotNumber);
    if (isNaN(slotVal) || slotVal < 41 || slotVal > 294) {
      return NextResponse.json(
        { error: "Invalid slot number. Must be between 41 and 294." },
        { status: 400 },
      );
    }

    if (!req.user) {
      return NextResponse.json(
        { error: "Forbidden: Portal session required" },
        { status: 403 },
      );
    }

    // Check if slot is already occupied or locked
    const active = await PhoneBoothAssignmentModel.findOne({
      slotNumber: slotVal,
      status: "assigned",
    });

    if (active) {
      if (active.staffId === "LOCKED") {
        return NextResponse.json(
          { error: "Slot is already locked." },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: "Slot is currently occupied." },
        { status: 400 },
      );
    }

    // Create a dummy assignment representing the lock
    const location = req.user.location;

    const assignment = await phoneBoothRepository.create({
      staffId: "LOCKED",
      staffName: "Locked Slot",
      department: "System",
      slotNumber: slotVal,
      assignedAt: new Date(),
      status: "assigned",
      app_log_id: `LOCKED-${slotVal}`,
      deviceName: "Admin Portal",
      location: location || "The Bahamas", // Fallback location if undefined
    });

    return NextResponse.json(
      { message: "Slot locked successfully", assignment },
      { status: 201 },
    );
  } catch (err) {
    console.error("Failed to lock slot:", err);
    return NextResponse.json({ error: "Failed to lock slot" }, { status: 500 });
  }
}

// DELETE: Unlock a slot
async function unlockSlotHandler(req: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slotNumberParam = searchParams.get("slotNumber");

    // If not in query params, check body
    let slotVal: number | null = null;
    if (slotNumberParam) {
      slotVal = Number(slotNumberParam);
    } else {
      try {
        const body = await req.json();
        slotVal = Number(body.slotNumber);
      } catch {}
    }

    if (!slotVal || isNaN(slotVal) || slotVal < 41 || slotVal > 294) {
      return NextResponse.json(
        { error: "Invalid slot number. Must be between 41 and 294." },
        { status: 400 },
      );
    }

    if (!req.user) {
      return NextResponse.json(
        { error: "Forbidden: Portal session required" },
        { status: 403 },
      );
    }

    const result = await PhoneBoothAssignmentModel.deleteOne({
      slotNumber: slotVal,
      staffId: "LOCKED",
      status: "assigned",
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "No active lock found for this slot." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "Slot unlocked successfully" },
      { status: 200 },
    );
  } catch (err) {
    console.error("Failed to unlock slot:", err);
    return NextResponse.json(
      { error: "Failed to unlock slot" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(lockSlotHandler, [PP.RELEASE_PHONE_BOOTH]);
export const DELETE = withAuth(unlockSlotHandler, [PP.RELEASE_PHONE_BOOTH]);
