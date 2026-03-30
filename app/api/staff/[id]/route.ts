import { NextRequest, NextResponse } from "next/server";
import { staffRepository } from "@/lib/repositories/StaffRepository";
import { requirePortalPermissions } from "@/lib/portalSession";
import { PP } from "@/lib/portalPermissionMatrix";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requirePortalPermissions([PP.UPDATE_STAFF]);
    if (gate.error) return gate.error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (gate.session!.user as any).id;
    const body = await req.json();
    
    const { firstName, lastName, staffId, department, rank, status } = body;
    const params = await props.params;
    
    const updatedStaff = await staffRepository.update(params.id, {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(staffId && { staffId }),
      ...(department && { department }),
      ...(rank && { rank }),
      ...(status && { status }),
      lastUpdatedBy: userId,
    });
    
    if (!updatedStaff) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }
    
    return NextResponse.json(updatedStaff);
  } catch (err: unknown) {
    console.error("PUT /api/staff/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const gate = await requirePortalPermissions([PP.DELETE_STAFF]);
    if (gate.error) return gate.error;
    
    const params = await props.params;
    const success = await staffRepository.delete(params.id);
    if (!success) {
      return NextResponse.json({ error: "Staff not found" }, { status: 404 });
    }
    
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (err: unknown) {
    console.error("DELETE /api/staff/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
