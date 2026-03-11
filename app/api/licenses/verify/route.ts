import { NextRequest, NextResponse } from "next/server";
import { licenseRepository } from "@/lib/repositories/LicenseRepository";
import { LicenseStatus } from "@/lib/enums";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { license_key, device_name } = body;

    if (!license_key || !device_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const license = await licenseRepository.findByKey(license_key);
    if (!license) {
      return NextResponse.json({ error: "Invalid license" }, { status: 404 });
    }

    if (license.device_name !== device_name) {
      return NextResponse.json(
        { error: "This license is bound to a different device" },
        { status: 400 },
      );
    }

    if (license.status === LicenseStatus.USED) {
      return NextResponse.json(
        { error: "License already used" },
        { status: 400 },
      );
    }

    const device_token = crypto.randomBytes(32).toString("hex");

    const updatedLicense = await licenseRepository.markAsUsed(
      license._id.toString(),
      device_name,
      device_token,
    );

    return NextResponse.json(
      {
        message: "License verified successfully",
        permissions: updatedLicense?.permissions,
        token: device_token,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to verify license" },
      { status: 500 },
    );
  }
}
