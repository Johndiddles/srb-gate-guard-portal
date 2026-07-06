import { NextResponse } from "next/server";
import { phoneBoothRepository } from "@/lib/repositories/PhoneBoothRepository";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";
import { LicensePermission } from "@/lib/licensePermissions";
import { PP, hasAllPortalPermissions } from "@/lib/portalPermissionMatrix";

async function postPhoneBoothHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const {
      staffId,
      staffName,
      department,
      slotNumber,
      assignedAt,
      retrievedAt,
      status,
      app_log_id,
    } = body;

    if (!staffId || !slotNumber || !app_log_id || !assignedAt) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: staffId, slotNumber, app_log_id, or assignedAt",
        },
        { status: 400 },
      );
    }

    // Verify Device or User permissions
    if (req.device) {
      if (!req.device.permissions.includes(LicensePermission.PHONE_BOOTH)) {
        return NextResponse.json(
          { error: "Forbidden: License missing required permission" },
          { status: 403 },
        );
      }
    } else if (req.user) {
      if (
        !hasAllPortalPermissions(req.user.permissions, [PP.VIEW_PHONE_BOOTH])
      ) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient portal permissions" },
          { status: 403 },
        );
      }
    }

    // Upsert logic
    let assignment = await phoneBoothRepository.findByAppLogId(app_log_id);

    if (assignment) {
      // Once assigned, the assignment cannot be updated except to retrieve it
      if (status === "retrieved") {
        assignment.status = "retrieved";
        assignment.retrievedAt = retrievedAt
          ? new Date(retrievedAt)
          : new Date();
        await assignment.save();
      }
    } else {
      // Create new assignment
      assignment = await phoneBoothRepository.create({
        staffId,
        staffName,
        department,
        slotNumber,
        assignedAt: new Date(assignedAt),
        retrievedAt: retrievedAt ? new Date(retrievedAt) : undefined,
        status,
        app_log_id,
        deviceName: req.device?.name,
        location:
          req.device?.location ||
          (req.user as AuthenticatedRequest["user"])?.location,
      });
    }

    return NextResponse.json(
      { message: "Phone booth assignment synced successfully", assignment },
      { status: 201 },
    );
  } catch (err) {
    console.error("Failed to sync phone booth assignment:", err);
    return NextResponse.json(
      { error: "Failed to log phone booth assignment" },
      { status: 500 },
    );
  }
}

async function getPhoneBoothHandler(req: AuthenticatedRequest) {
  try {
    const location =
      req.device?.location ||
      (req.user as AuthenticatedRequest["user"])?.location;

    // Check permission
    if (req.device) {
      if (!req.device.permissions.includes(LicensePermission.PHONE_BOOTH)) {
        return NextResponse.json(
          { error: "Forbidden: License missing required permission" },
          { status: 403 },
        );
      }
    } else if (req.user) {
      if (
        !hasAllPortalPermissions(req.user.permissions, [PP.VIEW_PHONE_BOOTH])
      ) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient portal permissions" },
          { status: 403 },
        );
      }
    }

    // Read query filters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const staffId = searchParams.get("staffId");
    const slotNumber = searchParams.get("slotNumber")
      ? Number(searchParams.get("slotNumber"))
      : null;

    let assignments;
    if (search || status || staffId || slotNumber !== null) {
      assignments = await phoneBoothRepository.findByFilters(
        {
          search,
          status,
          staffId,
          slotNumber,
        },
        req.user?.role === "SUPER_ADMIN" ? undefined : location,
      );
    } else {
      assignments = await phoneBoothRepository.findAll(
        req.user?.role === "SUPER_ADMIN" ? undefined : location,
      );
    }

    return NextResponse.json(assignments, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch phone booth assignments:", err);
    return NextResponse.json(
      { error: "Failed to fetch phone booth assignments" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(postPhoneBoothHandler);
export const GET = withAuth(getPhoneBoothHandler);
