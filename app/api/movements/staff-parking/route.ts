import { NextResponse } from "next/server";
import { movementRepository } from "@/lib/repositories/MovementRepository";
import { MovementType } from "@/lib/enums";

export async function GET() {
  try {
    const movements = await movementRepository.findByType(
      MovementType.STAFF_PARKING,
      50,
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
