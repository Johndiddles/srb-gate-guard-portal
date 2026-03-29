import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { StaffShiftModel } from "@/lib/db/models/StaffShift";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const query: any = {};
    const search = searchParams.get("search");
    if (search) {
      query.$or = [
        { staffName: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { staffId: { $regex: search, $options: "i" } },
      ];
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
