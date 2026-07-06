import { NextResponse } from "next/server";
import { phoneBoothRepository } from "@/lib/repositories/PhoneBoothRepository";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";
import { PP, hasAllPortalPermissions } from "@/lib/portalPermissionMatrix";

async function releasePhoneBoothHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { app_log_id } = body;

    if (!app_log_id) {
      return NextResponse.json(
        { error: "Missing required field: app_log_id" },
        { status: 400 }
      );
    }

    if (!req.user) {
      return NextResponse.json(
        { error: "Forbidden: Portal session required" },
        { status: 403 }
      );
    }

    if (!hasAllPortalPermissions(req.user.permissions, [PP.RELEASE_PHONE_BOOTH])) {
      return NextResponse.json(
        { error: "Forbidden: Insufficient portal permissions to release slots" },
        { status: 403 }
      );
    }

    const assignment = await phoneBoothRepository.findByAppLogId(app_log_id);

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    if (assignment.status === "retrieved") {
      return NextResponse.json(
        { error: "Phone already marked as retrieved" },
        { status: 400 }
      );
    }

    // Force release
    assignment.status = "retrieved";
    assignment.retrievedAt = new Date();
    await assignment.save();

    return NextResponse.json(
      { message: "Slot released successfully", assignment },
      { status: 200 }
    );
  } catch (err) {
    console.error("Failed to release phone slot:", err);
    return NextResponse.json(
      { error: "Failed to release slot" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(releasePhoneBoothHandler, [PP.RELEASE_PHONE_BOOTH]);
