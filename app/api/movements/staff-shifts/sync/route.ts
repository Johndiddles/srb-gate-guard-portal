import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { StaffShiftModel } from "@/lib/db/models/StaffShift";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";
import { PP } from "@/lib/portalPermissionMatrix";
import { LicensePermission } from "@/lib/licensePermissions";

async function postHandler(req: AuthenticatedRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const shifts = Array.isArray(body) ? body : [body];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bulkOps = shifts.map((shift: any) => ({
      updateOne: {
        filter: { app_log_id: shift.app_log_id },
        update: { $set: { ...shift, location: req.device?.location } },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await StaffShiftModel.bulkWrite(bulkOps);
    }

    return NextResponse.json({ success: true, count: bulkOps.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Staff Shift Sync Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}

export const POST = withAuth(postHandler, [PP.UPDATE_STAFF_MOVEMENT], [
  LicensePermission.LOG_STAFF_MOVEMENT,
]);
