import { NextRequest } from "next/server";
import { clients } from "../../route";
import { MovementType } from "@/lib/enums";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  let controllerRef: ReadableStreamDefaultController | null = null;
  const stream = new ReadableStream({
    start(controller) {
      controllerRef = controller;
      clients[MovementType.GUEST].add(controller);
      controller.enqueue(new TextEncoder().encode(":\n\n"));
    },
    cancel() {
      if (controllerRef) {
        clients[MovementType.GUEST].delete(controllerRef);
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
