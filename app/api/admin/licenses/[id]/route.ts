import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { licenseRepository } from "@/lib/repositories/LicenseRepository";
import { AdminRole } from "@/lib/enums";
import crypto from "crypto";
import { Types, Document } from "mongoose";
import { ILicense } from "@/lib/db/models/License";
import { ALLOWED_LICENSE_PERMISSION_VALUES } from "@/lib/licensePermissions";
// Wait, I need the URL parameters.

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    (session.user.role !== AdminRole.SUPER_ADMIN &&
      session.user.role !== AdminRole.RESORT_SECURITY)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;

  try {
    const license = await licenseRepository.findById(id);
    if (!license)
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    return NextResponse.json(license, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch license" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    (session.user.role !== AdminRole.SUPER_ADMIN &&
      session.user.role !== AdminRole.RESORT_SECURITY)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;

  try {
    const success = await licenseRepository.delete(id);
    if (!success)
      return NextResponse.json({ error: "License not found" }, { status: 404 });
    return NextResponse.json(
      { message: "License deleted successfully" },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete license" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !session.user ||
    (session.user.role !== AdminRole.SUPER_ADMIN &&
      session.user.role !== AdminRole.RESORT_SECURITY)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const { id } = await params;

  try {
    const body = await req.json();
    const { action, permissions } = body;

    const license = await licenseRepository.findById(id);
    if (!license)
      return NextResponse.json({ error: "License not found" }, { status: 404 });

    if (action === "regenerate") {
      const newKey = crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 16)
        .toUpperCase();

      const updated = await licenseRepository.update(id, {
        key: newKey,
        status: "UNUSED" as import("@/lib/enums").LicenseStatus,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        device_token: "" as any,
      });

      const safeLicense = updated
        ? {
            id: (updated._id as Types.ObjectId).toString(),
            key: updated.key,
            device_name: updated.device_name,
            status: updated.status,
            permissions: updated.permissions,
            createdAt:
              (updated as Document).get?.("createdAt") ||
              (updated as ILicense).createdAt,
          }
        : null;

      return NextResponse.json(
        { message: "License regenerated", license: safeLicense },
        { status: 200 },
      );
    }

    if (permissions && Array.isArray(permissions)) {
      for (const p of permissions) {
        if (typeof p !== "string" || !ALLOWED_LICENSE_PERMISSION_VALUES.has(p)) {
          return NextResponse.json(
            { error: `Invalid permission: ${String(p)}` },
            { status: 400 },
          );
        }
      }
      const updated = await licenseRepository.update(id, { permissions });
      return NextResponse.json(
        { message: "License updated", license: updated },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update license" },
      { status: 500 },
    );
  }
}
