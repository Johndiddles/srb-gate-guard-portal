import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AdminRole, LicenseStatus } from "./enums";
import { licenseRepository } from "./repositories/LicenseRepository";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    role: AdminRole;
    name?: string;
  };
  device?: {
    name: string;
    permissions: string[];
  };
}

export function withAuth(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (req: AuthenticatedRequest, ...args: any[]) => Promise<NextResponse>,
  allowedRoles?: AdminRole[],
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ...args: any[]) => {
    try {
      const authHeader = req.headers.get("authorization");

      // Check Mobile Device Token First
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const license = await licenseRepository.findByToken(token);

        if (
          !license ||
          license.status !== LicenseStatus.USED ||
          !license.device_name
        ) {
          return NextResponse.json(
            { error: "License revoked or invalid. Please reactivate." },
            { status: 299 },
          );
        }

        // Attach device context
        const authReq = req as AuthenticatedRequest;
        authReq.device = {
          name: license.device_name,
          permissions: license.permissions,
        };

        // For mobile endpoints, we usually don't verify roles, only token.
        // If an endpoint strictly requires portal roles and mobile shouldn't access it,
        // we might enforce that, but standard is token implies service/mobile access.
        return handler(authReq, ...args);
      }

      // Check Portal Session
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json(
          { error: "Unauthorized: No valid session or token found" },
          { status: 401 },
        );
      }

      const userRole = session.user.role as AdminRole;

      // Check Role Permissions
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient role permissions" },
          { status: 403 },
        );
      }

      // Attach user context
      const authReq = req as AuthenticatedRequest;
      authReq.user = {
        id: session.user.id,
        role: userRole,
        name: session.user.name || undefined,
      };

      return handler(authReq, ...args);
    } catch (err) {
      console.error("Auth Middleware Error:", err);
      return NextResponse.json(
        { error: "Internal Server Error during authentication" },
        { status: 500 },
      );
    }
  };
}
