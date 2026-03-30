import { AdminRole } from "@/lib/enums";

/** Portal routes for staff operations (management, parking, movement, gate passes). */
export const PORTAL_SECURITY_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.RESORT_SECURITY,
];

/** Admin UI routes that only SUPER_ADMIN and RESORT_SECURITY may open (direct URL or nav). */
export function isSecurityOnlyAdminPath(pathname: string): boolean {
  const paths = [
    "/admin/staff",
    "/admin/staff-parking",
    "/admin/staff-movement",
    "/admin/staff-exits",
  ];
  return paths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
