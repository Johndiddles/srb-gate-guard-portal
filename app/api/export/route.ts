import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { guestListRepository } from "@/lib/repositories/GuestRepository";
import { movementRepository } from "@/lib/repositories/MovementRepository";
import { licenseRepository } from "@/lib/repositories/LicenseRepository";
import { StaffShiftModel } from "@/lib/db/models/StaffShift";
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
  } else if (type === "staff-movement" || type === "staff-exits") {
    if (!hasAllPortalPermissions(granted, [PP.VIEW_STAFF_MOVEMENT])) {
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
          Location: (g as { location?: string }).location || "N/A",
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
        Location: (m as { location?: string }).location || "N/A",
        Reason: m.reason || "N/A",
        Timestamp: new Date(m.timestamp!).toLocaleString(),
      }));
    } else if (type === "licenses") {
      const licenses = await licenseRepository.findAll();
      dataToExport = licenses.map((l) => ({
        Key: l.key,
        "Device Name": l.device_name || "N/A",
        Location: (l as { location?: string }).location || "N/A",
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
        Location: (m as { location?: string }).location || "N/A",
        Timestamp: new Date(m.timestamp!).toLocaleString(),
      }));
    } else if (type === "staff-movement") {
      const shifts = await StaffShiftModel.find({}).sort({ clockIn: -1 }).lean();
      dataToExport = shifts.map((s) => ({
        "Staff Member": s.staffName || "N/A",
        "Staff ID": s.staffId || "N/A",
        Department: s.department || "N/A",
        Status: s.status === "active" ? "On Duty" : "Shift Ended",
        Location: (s as { location?: string }).location || "N/A",
        "Clock In": s.clockIn ? new Date(s.clockIn).toLocaleString() : "-",
        "Clock Out": s.clockOut ? new Date(s.clockOut).toLocaleString() : "-",
      }));
    } else if (type === "staff-exits") {
      const shifts = await StaffShiftModel.find({}).sort({ clockIn: -1 }).lean();
      shifts.forEach((s) => {
        if (s.exits && Array.isArray(s.exits)) {
          s.exits.forEach((exit) => {
            dataToExport.push({
              "Staff Member": s.staffName || "N/A",
              "Staff ID": s.staffId || "N/A",
              Department: s.department || "N/A",
              Reason: exit.reason || "N/A",
              Status: !exit.timeIn ? "Currently Out" : "Returned",
              Location: (s as { location?: string }).location || "N/A",
              "Time Out": exit.timeOut ? new Date(exit.timeOut).toLocaleString() : "-",
              "Time In": exit.timeIn ? new Date(exit.timeIn).toLocaleString() : "-",
            });
          });
        }
      });
    }

    const worksheet = xlsx.utils.json_to_sheet(dataToExport);

    if (dataToExport.length > 0) {
      const keys = Object.keys(dataToExport[0]);
      worksheet["!cols"] = keys.map((key) => {
        let maxLength = key.length;
        dataToExport.forEach((row) => {
          const val = row[key];
          const valStr = val !== null && val !== undefined ? String(val) : "";
          if (valStr.length > maxLength) {
            maxLength = valStr.length;
          }
        });
        return { wch: Math.min(Math.max(maxLength + 2, 10), 100) };
      });
    }

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data");

    const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx"`,
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
