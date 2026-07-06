import { NextResponse } from "next/server";
import { keyCollectionRepository } from "@/lib/repositories/KeyCollectionRepository";
import { withAuth, AuthenticatedRequest } from "@/lib/authMiddleware";
import { LicensePermission } from "@/lib/licensePermissions";
import { PP, hasAllPortalPermissions } from "@/lib/portalPermissionMatrix";

async function postKeysHandler(req: AuthenticatedRequest) {
  try {
    const body = await req.json();
    const {
      keyTag,
      collectingStaffId,
      collectingStaffName,
      collectingStaffDepartment,
      collectedAt,
      returningStaffId,
      returningStaffName,
      returningStaffDepartment,
      returnedAt,
      status,
      app_log_id,
    } = body;

    if (!keyTag || !collectingStaffId || !app_log_id || !collectedAt || !status) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: keyTag, collectingStaffId, app_log_id, collectedAt, or status",
        },
        { status: 400 },
      );
    }

    // Verify Device or User permissions
    if (req.device) {
      if (!req.device.permissions.includes(LicensePermission.KEYS)) {
        return NextResponse.json(
          { error: "Forbidden: License missing required keys permission" },
          { status: 403 },
        );
      }
    } else if (req.user) {
      if (
        !hasAllPortalPermissions(req.user.permissions, [PP.VIEW_KEYS])
      ) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient portal permissions" },
          { status: 403 },
        );
      }
    }

    // Upsert logic
    let keyCollection = await keyCollectionRepository.findByAppLogId(app_log_id);

    if (keyCollection) {
      // Once resolved by admin, it cannot be updated from the mobile app
      if (keyCollection.status === "resolved") {
        return NextResponse.json(
          { message: "Key collection resolved by Admin, update ignored", keyCollection },
          { status: 200 }
        );
      }

      // Update logic (like checking in key)
      if (status === "returned") {
        keyCollection.status = "returned";
        keyCollection.returningStaffId = returningStaffId || keyCollection.returningStaffId;
        keyCollection.returningStaffName = returningStaffName || keyCollection.returningStaffName;
        keyCollection.returningStaffDepartment = returningStaffDepartment || keyCollection.returningStaffDepartment;
        keyCollection.returnedAt = returnedAt ? new Date(returnedAt) : new Date();
        await keyCollection.save();
      }
    } else {
      // Create new key collection log
      keyCollection = await keyCollectionRepository.create({
        keyTag,
        collectingStaffId,
        collectingStaffName,
        collectingStaffDepartment,
        collectedAt: new Date(collectedAt),
        returningStaffId,
        returningStaffName,
        returningStaffDepartment,
        returnedAt: returnedAt ? new Date(returnedAt) : undefined,
        status,
        app_log_id,
        deviceName: req.device?.name || "Portal",
        location:
          req.device?.location ||
          (req.user as AuthenticatedRequest["user"])?.location ||
          "Jamaica", // Fallback location if none is set
      });
    }

    return NextResponse.json(
      { message: "Key collection synced successfully", keyCollection },
      { status: 201 },
    );
  } catch (err) {
    console.error("Failed to sync key collection:", err);
    return NextResponse.json(
      { error: "Failed to log key collection" },
      { status: 500 },
    );
  }
}

async function getKeysHandler(req: AuthenticatedRequest) {
  try {
    const location =
      req.device?.location ||
      (req.user as AuthenticatedRequest["user"])?.location;

    // Check permission
    if (req.device) {
      if (!req.device.permissions.includes(LicensePermission.KEYS)) {
        return NextResponse.json(
          { error: "Forbidden: License missing required keys permission" },
          { status: 403 },
        );
      }
    } else if (req.user) {
      if (
        !hasAllPortalPermissions(req.user.permissions, [PP.VIEW_KEYS])
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
    const keyTag = searchParams.get("keyTag");

    let keyCollections;
    if (search || status || staffId || keyTag) {
      keyCollections = await keyCollectionRepository.findByFilters(
        {
          search,
          status,
          staffId,
          keyTag,
        },
        req.user?.role === "SUPER_ADMIN" ? undefined : location,
      );
    } else {
      keyCollections = await keyCollectionRepository.findAll(
        req.user?.role === "SUPER_ADMIN" ? undefined : location,
      );
    }

    return NextResponse.json(keyCollections, { status: 200 });
  } catch (err) {
    console.error("Failed to fetch key collections:", err);
    return NextResponse.json(
      { error: "Failed to fetch key collections" },
      { status: 500 },
    );
  }
}

export const POST = withAuth(postKeysHandler);
export const GET = withAuth(getKeysHandler);
