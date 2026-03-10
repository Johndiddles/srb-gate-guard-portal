import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { guestListRepository } from "@/lib/repositories/GuestRepository";
import { movementRepository } from "@/lib/repositories/MovementRepository";
import { licenseRepository } from "@/lib/repositories/LicenseRepository";
import * as xlsx from "xlsx";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  try {
    let dataToExport: Array<Record<string, string | number | boolean>> = [];

    if (type === "guests") {
      const lists = await guestListRepository.findAll();

      // Flatten out all guests from the recent lists or just extract guests from latest?
      // For export let's export all guests from the latest list, which is normally what they'd export.
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
        Direction: m.direction,
        "Guest Name": m.guest_name || "N/A",
        "Plate Number": m.plate_number || "N/A",
        Reason: m.reason || "N/A",
        Timestamp: new Date(m.timestamp).toLocaleString(),
      }));
    } else if (type === "licenses") {
      const licenses = await licenseRepository.findAll();
      dataToExport = licenses.map((l) => ({
        Key: l.key,
        "Device Name": l.device_name || "N/A",
        Status: l.status,
        Permissions: l.permissions.join(", "),
      }));
    } else {
      return NextResponse.json(
        { error: "Invalid type requested" },
        { status: 400 },
      );
    }

    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Data");

    // Convert to buffer
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
