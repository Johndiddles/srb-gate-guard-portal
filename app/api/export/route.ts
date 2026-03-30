import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { guestListRepository } from "@/lib/repositories/GuestRepository";
import { movementRepository } from "@/lib/repositories/MovementRepository";
import { licenseRepository } from "@/lib/repositories/LicenseRepository";
import * as xlsx from "xlsx";
import {
  PP,
  hasAllPortalPermissions,
  hasAnyPortalPermission,
} from "@/lib/portalPermissionMatrix";
import { MovementType } from "@/lib/enums";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const granted = session.user.permissions ?? [];

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "guests") {
    if (!hasAllPortalPermissions(granted, [PP.VIEW_GUEST_LIST])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (type === "movements") {
    if (
      !hasAnyPortalPermission(granted, [
        PP.VIEW_GUEST_MOVEMENT,
        PP.VIEW_VEHICULAR_MOVEMENT,
      ])
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (type === "licenses") {
    if (!hasAllPortalPermissions(granted, [PP.VIEW_LICENSE])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (type === "staff-parking" || type === "staff_parking") {
    if (!hasAllPortalPermissions(granted, [PP.VIEW_STAFF_PARKING])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json(
      { error: "Invalid type requested" },
      { status: 400 },
    );
  }

  try {
    let dataToExport: Array<Record<string, string | number | boolean>> = [];

    if (type === "guests") {
      const lists = await guestListRepository.findAll();

      const latestList = lists.length > 0 ? lists[0] : null;

      if (latestList) {
        dataToExport = latestList.guests.map((g) => ({
          Name: `${g.firstName} ${g.lastName}`.trim(),
          "Room Number": g.roomNumber,
          Status: g.status,
          "Arrival Date": g.arrivalDate
            ? new Date(g.arrivalDate).toLocaleDateString()
            : "",
          Notes: g.notes || "",
        }));
      }
    } else if (type === "movements") {
      const movements = await movementRepository.findAll();
      dataToExport = movements.map((m) => ({
        Type: m.type,
        Direction: m.direction || "-",
        "Guest Name": m.guest_name || "N/A",
        "Plate Number": m.plate_number || "N/A",
        Reason: m.reason || "N/A",
        Timestamp: new Date(m.timestamp!).toLocaleString(),
      }));
    } else if (type === "licenses") {
      const licenses = await licenseRepository.findAll();
      dataToExport = licenses.map((l) => ({
        Key: l.key,
        "Device Name": l.device_name || "N/A",
        Status: l.status,
        Permissions: l.permissions.join(", "),
      }));
    } else if (type === "staff-parking" || type === "staff_parking") {
      const movements = await movementRepository.findByType(
        MovementType.STAFF_PARKING,
        10_000,
        {},
      );
      dataToExport = movements.map((m) => ({
        Type: m.type,
        Direction: m.direction || "-",
        Name: m.name || "N/A",
        "Plate Number": m.plate_number || "N/A",
        Department: m.department || "N/A",
        Timestamp: new Date(m.timestamp!).toLocaleString(),
      }));
    }

    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data");

    const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}_export.xlsx"`,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 },
    );
  }
}
