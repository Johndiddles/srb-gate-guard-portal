import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { StaffShiftModel } from "@/lib/db/models/StaffShift";
import { requirePortalRoles } from "@/lib/portalSession";
import { PORTAL_SECURITY_ROLES } from "@/lib/portalRoles";

export async function GET(req: NextRequest) {
  try {
    const gate = await requirePortalRoles(PORTAL_SECURITY_ROLES);
    if (gate.error) return gate.error;

    await dbConnect();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const name = searchParams.get("name");
    const department = searchParams.get("department");
    const staffId = searchParams.get("staffId");
    const status = searchParams.get("status"); // Usually mapped to exits.timeIn
    
    // Initial basic match before unwind to optimize query if possible
    const initialMatch: any = {};
    if (startDate || endDate) {
      initialMatch.clockIn = {};
      if (startDate) initialMatch.clockIn.$gte = new Date(startDate);
      if (endDate) initialMatch.clockIn.$lte = new Date(endDate);
    }
    
    const pipeline: any[] = [];
    if (Object.keys(initialMatch).length > 0) {
      pipeline.push({ $match: initialMatch });
    }
    
    // Aggregation pipeline to unwind exits
    pipeline.push({ $unwind: "$exits" });

    const postMatch: any = {};
    
    if (search) {
      postMatch.$or = [
        { staffName: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { staffId: { $regex: search, $options: "i" } },
        { "exits.reason": { $regex: search, $options: "i" } },
      ];
    }

    if (name) postMatch.staffName = { $regex: name, $options: "i" };
    if (department) postMatch.department = { $regex: department, $options: "i" };
    if (staffId) postMatch.staffId = { $regex: staffId, $options: "i" };
    
    if (status) {
      if (status === "active") postMatch["exits.timeIn"] = { $exists: false }; // Currently out
      if (status === "completed") postMatch["exits.timeIn"] = { $exists: true }; // Returned
    }

    if (Object.keys(postMatch).length > 0) {
      pipeline.push({ $match: postMatch });
    }

    // Sort by exit's timeOut natively
    pipeline.push({ $sort: { "exits.timeOut": -1 } });

    // Pagination
    pipeline.push(
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                shift_id: "$_id",
                staffId: 1,
                staffName: 1,
                department: 1,
                clockIn: 1,
                timeOut: "$exits.timeOut",
                timeIn: "$exits.timeIn",
                reason: "$exits.reason",
                app_log_id: "$exits.app_log_id",
              },
            },
          ],
        },
      }
    );

    const results = await StaffShiftModel.aggregate(pipeline);
    const data = results[0]?.data || [];
    const total = results[0]?.metadata[0]?.total || 0;

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching staff exits:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
