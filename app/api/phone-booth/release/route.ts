import { NextResponse } from "next/server";
import { phoneBoothRepository } from "@/lib/repositories/PhoneBoothRepository";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";
import { PP, hasAllPortalPermissions } from "@/lib/portalPermissionMatrix";

async function releasePhoneBoothHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const { app_log_id, app_log_ids } = body;

    if (
      !app_log_id &&
      (!app_log_ids || !Array.isArray(app_log_ids) || app_log_ids.length === 0)
    ) {
      return NextResponse.json(
        { error: "Missing required field: app_log_id or app_log_ids" },
        { status: 400 },
      );
    }

    if (!req.user) {
      return NextResponse.json(
        { error: "Forbidden: Portal session required" },
        { status: 403 },
      );
    }

    if (
      !hasAllPortalPermissions(req.user.permissions, [PP.RELEASE_PHONE_BOOTH])
    ) {
      return NextResponse.json(
        {
          error: "Forbidden: Insufficient portal permissions to release slots",
        },
        { status: 403 },
      );
    }

    const ids = app_log_ids ? app_log_ids : [app_log_id];

    const result = await phoneBoothRepository.releaseBulk(ids);

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "No matching active assignments found to release" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        message:
          ids.length === 1
            ? "Slot released successfully"
            : `${result.modifiedCount} slots released successfully`,
        modifiedCount: result.modifiedCount,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("Failed to release phone slot(s):", err);
    return NextResponse.json(
      { error: "Failed to release slot(s)" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(releasePhoneBoothHandler, [
  PP.RELEASE_PHONE_BOOTH,
]);
