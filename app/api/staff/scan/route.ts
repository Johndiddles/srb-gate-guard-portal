import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qrData } = body;

    if (!qrData) {
      return NextResponse.json({ error: "Missing qrData" }, { status: 400 });
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch {
      // Not JSON, might just be the staff ID directly or something else
      parsedData = { staffId: qrData };
    }

    const targetStaffId = parsedData.staffId;
    
    if (!targetStaffId) {
      return NextResponse.json({ error: "Invalid QR Data: Missing staffId" }, { status: 400 });
    }

    // Since this is called by the mobile app, we might want to verify an API key
    // For now, depending on req auth headers or just open (as per current design pattern)
    // Importing staff repository inline to avoid issues in edge envs if not applicable, but this is a node env.
    const { staffRepository } = await import("@/lib/repositories/StaffRepository");
    
    const staff = await staffRepository.findByStaffId(targetStaffId);

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (error: unknown) {
    console.error("POST /api/staff/scan error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
