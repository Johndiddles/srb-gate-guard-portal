import { AdminRole } from "@/lib/enums";

export function postAuthDestination(user: {
  requires_password_change?: boolean;
  role?: AdminRole | string;
}): string {
  if (user.requires_password_change === true) {
    return "/change-password";
  }
  if (user.role === AdminRole.FRONT_DESK) {
    return "/admin/guests";
  }
  return "/admin";
}
