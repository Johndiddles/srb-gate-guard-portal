"use client";

import { useSession } from "next-auth/react";
import {
  hasAllPortalPermissions,
  hasAnyPortalPermission,
} from "@/lib/portalPermissionMatrix";

export function usePortalPermissions() {
  const { data, status } = useSession();
  const permissions = data?.user?.permissions ?? [];

  return {
    permissions,
    isLoading: status === "loading",
    can: (p: string) => permissions.includes(p),
    canAll: (required: string[]) =>
      hasAllPortalPermissions(permissions, required),
    canAny: (candidates: string[]) =>
      hasAnyPortalPermission(permissions, candidates),
  };
}
