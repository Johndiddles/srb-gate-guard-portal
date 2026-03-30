import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";
import { LicensePermission } from "@/lib/licensePermissions";

async function postHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { qrData } = body;

    if (!qrData) {
      return NextResponse.json({ error: "Missing qrData" }, { status: 400 });
    }

    let parsedData: { staffId?: string };
    try {
      parsedData = JSON.parse(qrData);
    } catch {
      parsedData = { staffId: qrData };
    }

    const targetStaffId = parsedData.staffId;

    if (!targetStaffId) {
      return NextResponse.json(
        { error: "Invalid QR Data: Missing staffId" },
        { status: 400 },
      );
    }

    const { staffRepository } = await import(
      "@/lib/repositories/StaffRepository"
    );

    const staff = await staffRepository.findByStaffId(targetStaffId);

    if (!staff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }

    return NextResponse.json({ staff });
  } catch (error: unknown) {
    console.error("POST /api/staff/scan error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(postHandler, undefined, [
  LicensePermission.SCAN_QR,
]);
