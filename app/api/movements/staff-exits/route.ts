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

    const search = searchParams.get("search");
    
    // Aggregation pipeline to unwind exits
    const pipeline: any[] = [
      { $unwind: "$exits" }
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { staffName: { $regex: search, $options: "i" } },
            { department: { $regex: search, $options: "i" } },
            { staffId: { $regex: search, $options: "i" } },
            { "exits.reason": { $regex: search, $options: "i" } },
          ],
        },
      });
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
