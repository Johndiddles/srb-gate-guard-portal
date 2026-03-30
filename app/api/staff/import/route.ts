import { NextRequest, NextResponse } from "next/server";
import { staffRepository } from "@/lib/repositories/StaffRepository";
import * as xlsx from "xlsx";
import { requirePortalPermissions } from "@/lib/portalSession";
import { PP } from "@/lib/portalPermissionMatrix";

export async function POST(req: NextRequest) {
  try {
    const gate = await requirePortalPermissions([PP.CREATE_STAFF]);
    if (gate.error) return gate.error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = (gate.session!.user as any).id;
    const reqFormData = await req.formData();
    const file = reqFormData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse workbook
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Get JSON data
    // Assuming headers are: firstName, lastName, staffId, department, status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }

    const unassignedRecords = data.filter(r => !String(r.staffId || r["Staff ID"] || "").trim());
    const generatedIds = unassignedRecords.length > 0 ? await staffRepository.generateNextStaffIds(unassignedRecords.length) : [];
    let idIndex = 0;

    const staffListToInsert = data.map((row) => {
      let mappedStaffId = String(row.staffId || row["Staff ID"] || "").trim();
      if (!mappedStaffId) {
        mappedStaffId = generatedIds[idIndex++];
      }

      return {
        firstName: row.firstName || row["First Name"],
        lastName: row.lastName || row["Last Name"],
        staffId: mappedStaffId,
        department: row.department || row["Department"],
        rank: row.rank || row["Rank"] || "Regular",
        status: row.status || row["Status"] || "Active",
        createdBy: userId,
        lastUpdatedBy: userId,
      };
    }).filter(staff => staff.firstName && staff.lastName && staff.department);

    if (staffListToInsert.length === 0) {
      return NextResponse.json({ error: "No valid staff rows found. Ensure required columns are present." }, { status: 400 });
    }

    const result = await staffRepository.insertMany(staffListToInsert);

    return NextResponse.json({ message: "Import successful", count: result.length }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/staff/import error:", error);
    return NextResponse.json({ error: "Failed to import staff data" }, { status: 500 });
  }
}
