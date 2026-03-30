import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { StaffShiftModel } from "@/lib/db/models/StaffShift";
import { requirePortalRoles } from "@/lib/portalSession";
import { PORTAL_SECURITY_ROLES } from "@/lib/portalRoles";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const gate = await requirePortalRoles(PORTAL_SECURITY_ROLES);
    if (gate.error) return gate.error;

    await dbConnect();

    const { searchParams } = new URL(req.url);
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

    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = async () => {
          try {
            const latestShifts = await StaffShiftModel.find(query)
              .sort({ updatedAt: -1 })
              .limit(50)
              .lean();
            controller.enqueue(`data: ${JSON.stringify(latestShifts)}\n\n`);
          } catch (err) {
            console.error("SSE Poll Error:", err);
          }
        };

        await sendUpdate();
        const interval = setInterval(sendUpdate, 5000);

        req.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
