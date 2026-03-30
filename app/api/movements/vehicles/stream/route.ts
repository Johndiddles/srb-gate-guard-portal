import type { NextRequest } from "next/server";
import { clients } from "../../route";
import { MovementType } from "@/lib/enums";
import { requirePortalPermissions } from "@/lib/portalSession";
import { PP } from "@/lib/portalPermissionMatrix";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const gate = await requirePortalPermissions([PP.VIEW_VEHICULAR_MOVEMENT]);
  if (gate.error) return gate.error;

  let controllerRef: ReadableStreamDefaultController | null = null;
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      clients[MovementType.VEHICULAR].add(controller);
      controller.enqueue(new TextEncoder().encode(":\n\n"));
    },
    cancel() {
      if (controllerRef) {
        clients[MovementType.VEHICULAR].delete(controllerRef);
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
