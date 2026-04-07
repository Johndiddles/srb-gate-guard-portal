import { NextRequest, NextResponse } from "next/server";
import { movementRepository } from "@/lib/repositories/MovementRepository";
import { MovementType } from "@/lib/enums";
import { requirePortalPermissions } from "@/lib/portalSession";
import { PP } from "@/lib/portalPermissionMatrix";

export async function GET(req: NextRequest) {
  const gate = await requirePortalPermissions([PP.VIEW_GUEST_MOVEMENT]);
  if (gate.error) return gate.error;

  try {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userLimitLocation = gate.session.user.role === "SUPER_ADMIN" ? undefined : (gate.session.user as any).location;

    const movements = await movementRepository.findByType(
      MovementType.GUEST,
      50,
      filters,
      userLimitLocation
    );
    return NextResponse.json(movements, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch guest movements:", err);
    return NextResponse.json(
      { error: "Failed to fetch guest movements" },
      { status: 500 },
    );
  }
}
