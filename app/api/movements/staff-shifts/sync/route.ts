import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { StaffShiftModel } from "@/lib/db/models/StaffShift";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const shifts = Array.isArray(body) ? body : [body];

    const bulkOps = shifts.map((shift: any) => ({
      updateOne: {
        filter: { app_log_id: shift.app_log_id },
        update: { $set: shift },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await StaffShiftModel.bulkWrite(bulkOps);
    }

    return NextResponse.json({ success: true, count: bulkOps.length });
  } catch (error: any) {
    console.error("Staff Shift Sync Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
