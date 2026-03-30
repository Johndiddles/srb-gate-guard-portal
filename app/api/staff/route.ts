import { NextRequest, NextResponse } from "next/server";
import { staffRepository } from "@/lib/repositories/StaffRepository";
import { requirePortalRoles } from "@/lib/portalSession";
import { PORTAL_SECURITY_ROLES } from "@/lib/portalRoles";

export async function GET(req: NextRequest) {
  try {
    const gate = await requirePortalRoles(PORTAL_SECURITY_ROLES);
    if (gate.error) return gate.error;

    const { searchParams } = new URL(req.url);
    const filter: Record<string, unknown> = {};

    const status = searchParams.get("status");
    if (status) filter.status = status;

    const department = searchParams.get("department");
    if (department) filter.department = department;

    const staffId = searchParams.get("staffId");
    if (staffId) filter.staffId = { $regex: staffId, $options: "i" };

    const name = searchParams.get("name");
    if (name) {
      filter.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }

    const staffList = await staffRepository.findAll(filter);
    return NextResponse.json(staffList);
  } catch (error: unknown) {
    console.error("GET /api/staff error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requirePortalRoles(PORTAL_SECURITY_ROLES);
    if (gate.error) return gate.error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (gate.session!.user as any).id;

    const body = await req.json();
    const { firstName, lastName, staffId, department, status, rank } = body;

    if (!firstName || !lastName || !department) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let finalStaffId = staffId?.trim();
    if (!finalStaffId) {
      const ids = await staffRepository.generateNextStaffIds(1);
      finalStaffId = ids[0];
    } else {
      // Check for existing staff ID
      const existing = await staffRepository.findByStaffId(finalStaffId);
      if (existing) {
        return NextResponse.json(
          { error: "Staff ID already exists" },
          { status: 400 }
        );
      }
    }

    const newStaff = await staffRepository.create({
      firstName,
      lastName,
      staffId: finalStaffId,
      department,
      rank: rank || "Regular",
      status: status || "Active",
      createdBy: userId,
      lastUpdatedBy: userId,
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/staff error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
