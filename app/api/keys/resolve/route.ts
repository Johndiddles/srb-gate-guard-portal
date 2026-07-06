import { NextResponse } from "next/server";
import { keyCollectionRepository } from "@/lib/repositories/KeyCollectionRepository";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";
import { AdminRole } from "@/lib/enums";

async function resolveKeyHandler(req: AuthenticatedRequest) {
  try {
    if (!req.user || req.user.role !== AdminRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: "Forbidden: Only Super Admin can resolve key collections" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { app_log_id } = body;

    if (!app_log_id) {
      return NextResponse.json(
        { error: "Missing required field: app_log_id" },
        { status: 400 },
      );
    }

    const keyCollection = await keyCollectionRepository.findByAppLogId(app_log_id);

    if (!keyCollection) {
      return NextResponse.json(
        { error: "Key collection log not found" },
        { status: 404 },
      );
    }

    // Resolve the key log
    keyCollection.status = "resolved";
    keyCollection.resolvedBy = "Admin";
    keyCollection.resolvedAt = new Date();

    await keyCollection.save();

    return NextResponse.json(
      { message: "Key collection resolved successfully by Admin", keyCollection },
      { status: 200 },
    );
  } catch (err) {
    console.error("Failed to resolve key collection:", err);
    return NextResponse.json(
      { error: "Failed to resolve key collection" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(resolveKeyHandler);
