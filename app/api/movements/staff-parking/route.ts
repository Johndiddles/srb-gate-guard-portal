import { NextRequest, NextResponse } from "next/server";
import { movementRepository } from "@/lib/repositories/MovementRepository";
import { MovementType } from "@/lib/enums";
import { requirePortalRoles } from "@/lib/portalSession";
import { PORTAL_SECURITY_ROLES } from "@/lib/portalRoles";

export async function GET(req: NextRequest) {
  try {
    const gate = await requirePortalRoles(PORTAL_SECURITY_ROLES);
    if (gate.error) return gate.error;

    const { searchParams } = new URL(req.url);
    const filters = {
      search: searchParams.get("search"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      name: searchParams.get("name"),
      department: searchParams.get("department"),
      licensePlate: searchParams.get("licensePlate"),
      staffId: searchParams.get("staffId"),
      status: searchParams.get("status"),
    };

    const movements = await movementRepository.findByType(
      MovementType.STAFF_PARKING,
      50,
      filters
    );
    return NextResponse.json(movements, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch staff parking movements:", err);
    return NextResponse.json(
      { error: "Failed to fetch staff parking movements" },
      { status: 500 },
    );
  }
}
