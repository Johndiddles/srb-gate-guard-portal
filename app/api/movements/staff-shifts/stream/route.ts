import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import { StaffShiftModel } from "@/lib/db/models/StaffShift";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = async () => {
          try {
            const latestShifts = await StaffShiftModel.find()
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
