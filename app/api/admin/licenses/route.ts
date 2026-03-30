import { NextRequest, NextResponse } from "next/server";
import { licenseRepository } from "@/lib/repositories/LicenseRepository";
import crypto from "crypto";
import { requirePortalPermissions } from "@/lib/portalSession";
import { PP } from "@/lib/portalPermissionMatrix";
import { Types, Document } from "mongoose";
import { ILicense } from "@/lib/db/models/License";
import { ALLOWED_LICENSE_PERMISSION_VALUES } from "@/lib/licensePermissions";

export async function GET() {
  const gate = await requirePortalPermissions([PP.VIEW_LICENSE]);
  if (gate.error) return gate.error;

  try {
    const licenses = await licenseRepository.findAll();
    const safeLicenses = licenses.map((l) => ({
      id: (l._id as Types.ObjectId).toString(),
      key: l.key,
      device_name: l.device_name,
      status: l.status,
      permissions: l.permissions,
      createdAt: (l as Document).get?.("createdAt") || l.createdAt,
    }));
    return NextResponse.json(safeLicenses, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch licenses" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const gate = await requirePortalPermissions([PP.CREATE_LICENSE]);
  if (gate.error) return gate.error;

  try {
    const body = await req.json();
    const { permissions, device_name } = body;

    if (!device_name) {
      return NextResponse.json(
        { error: "Device name is required" },
        { status: 400 },
      );
    }

    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Permissions must be an array" },
        { status: 400 },
      );
    }

    for (const p of permissions) {
      if (typeof p !== "string" || !ALLOWED_LICENSE_PERMISSION_VALUES.has(p)) {
        return NextResponse.json(
          { error: `Invalid permission: ${String(p)}` },
          { status: 400 },
        );
      }
    }

    const key = crypto
      .randomUUID()
      .replace(/-/g, "")
      .slice(0, 16)
      .toUpperCase();
    const newLicense = await licenseRepository.create({
      key,
      device_name,
      permissions,
    });

    const safeLicense = {
      id: (newLicense._id as Types.ObjectId).toString(),
      key: newLicense.key,
      device_name: newLicense.device_name,
      status: newLicense.status,
      permissions: newLicense.permissions,
      createdAt:
        (newLicense as Document).get?.("createdAt") ||
        (newLicense as ILicense).createdAt,
    };

    return NextResponse.json(
      { message: "License created successfully", license: safeLicense },
      { status: 201 },
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { error: "Failed to create license" },
      { status: 500 },
    );
  }
}
