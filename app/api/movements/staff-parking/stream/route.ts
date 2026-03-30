import type { NextRequest } from "next/server";
import { clients } from "../../route";
import { MovementType } from "@/lib/enums";
import { requirePortalRoles } from "@/lib/portalSession";
import { PORTAL_SECURITY_ROLES } from "@/lib/portalRoles";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const gate = await requirePortalRoles(PORTAL_SECURITY_ROLES);
  if (gate.error) return gate.error;

  let controllerRef: ReadableStreamDefaultController | null = null;
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      clients[MovementType.STAFF_PARKING].add(controller);
      controller.enqueue(new TextEncoder().encode(":\n\n"));
    },
    cancel() {
      if (controllerRef) {
        clients[MovementType.STAFF_PARKING].delete(controllerRef);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
