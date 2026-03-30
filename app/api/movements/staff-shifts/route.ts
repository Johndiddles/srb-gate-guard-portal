import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { StaffShiftModel } from "@/lib/db/models/StaffShift";
import { requirePortalPermissions } from "@/lib/portalSession";
import { PP } from "@/lib/portalPermissionMatrix";

export async function GET(req: NextRequest) {
  try {
    const gate = await requirePortalPermissions([PP.VIEW_STAFF_MOVEMENT]);
    if (gate.error) return gate.error;

    await dbConnect();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const query: any = {};
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const name = searchParams.get("name");
    const department = searchParams.get("department");
    const staffId = searchParams.get("staffId");
    const status = searchParams.get("status");

    if (search) {
      query.$or = [
        { staffName: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { staffId: { $regex: search, $options: "i" } },
      ];
    }

    if (name) query.staffName = { $regex: name, $options: "i" };
    if (department) query.department = { $regex: department, $options: "i" };
    if (staffId) query.staffId = { $regex: staffId, $options: "i" };
    if (status) query.status = status;

    if (startDate || endDate) {
      query.clockIn = {};
      if (startDate) query.clockIn.$gte = new Date(startDate);
      if (endDate) query.clockIn.$lte = new Date(endDate);
    }

    const [shifts, total] = await Promise.all([
      StaffShiftModel.find(query)
        .sort({ clockIn: -1 }) // Primary sort by initial check-in time
        .skip(skip)
        .limit(limit)
        .lean(),
      StaffShiftModel.countDocuments(query),
    ]);

    return NextResponse.json({
      data: shifts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching staff shifts:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
