import { NextRequest, NextResponse } from "next/server";
import { movementRepository } from "@/lib/repositories/MovementRepository";

// Quick in-memory store for SSE subscribers
export const clients: Record<string, Set<ReadableStreamDefaultController>> = {
  GUEST: new Set(),
  VEHICULAR: new Set(),
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, direction, plate_number, guest_name, reason } = body;

    if (!type || !direction) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newMovement = await movementRepository.create({
      type,
      direction,
      plate_number,
      guest_name,
      reason,
      timestamp: new Date(),
    });

    // Dispatch to SSE clients
    if (clients[type]) {
      const payload = `data: ${JSON.stringify(newMovement)}\n\n`;
      clients[type].forEach((controller) => {
        try {
          controller.enqueue(new TextEncoder().encode(payload));
        } catch (e) {
          // ignore error if client is gone
          console.error(e);
        }
      });
    }

    return NextResponse.json(
      { message: "Movement logged successfully", movement: newMovement },
      { status: 201 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to log movement" },
      { status: 500 },
    );
  }
}
