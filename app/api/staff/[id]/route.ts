import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { staffRepository } from "@/lib/repositories/StaffRepository";
import { AdminRole } from "@/lib/enums";

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (session.user as any).id;
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
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || !session.user || ((session.user as any).role !== AdminRole.SUPER_ADMIN && (session.user as any).role !== AdminRole.RESORT_SECURITY)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
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
