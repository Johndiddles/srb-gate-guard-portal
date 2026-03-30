import { AdminRole } from "@/lib/enums";

const A = {
  create: "create",
  view: "view",
  update: "update",
  delete: "delete",
} as const;

function p(action: keyof typeof A, resource: string): string {
  return `${A[action]}:${resource}`;
}

/** Canonical portal permission strings (CRUD × module). */
export const PP = {
  // guest_list
  CREATE_GUEST_LIST: p("create", "guest_list"),
  VIEW_GUEST_LIST: p("view", "guest_list"),
  UPDATE_GUEST_LIST: p("update", "guest_list"),
  DELETE_GUEST_LIST: p("delete", "guest_list"),
  // guest_movement
  CREATE_GUEST_MOVEMENT: p("create", "guest_movement"),
  VIEW_GUEST_MOVEMENT: p("view", "guest_movement"),
  UPDATE_GUEST_MOVEMENT: p("update", "guest_movement"),
  DELETE_GUEST_MOVEMENT: p("delete", "guest_movement"),
  // vehicular_movement
  CREATE_VEHICULAR_MOVEMENT: p("create", "vehicular_movement"),
  VIEW_VEHICULAR_MOVEMENT: p("view", "vehicular_movement"),
  UPDATE_VEHICULAR_MOVEMENT: p("update", "vehicular_movement"),
  DELETE_VEHICULAR_MOVEMENT: p("delete", "vehicular_movement"),
  // staff (management)
  CREATE_STAFF: p("create", "staff"),
  VIEW_STAFF: p("view", "staff"),
  UPDATE_STAFF: p("update", "staff"),
  DELETE_STAFF: p("delete", "staff"),
  // staff_parking
  CREATE_STAFF_PARKING: p("create", "staff_parking"),
  VIEW_STAFF_PARKING: p("view", "staff_parking"),
  UPDATE_STAFF_PARKING: p("update", "staff_parking"),
  DELETE_STAFF_PARKING: p("delete", "staff_parking"),
  // staff_movement (shifts / sync)
  CREATE_STAFF_MOVEMENT: p("create", "staff_movement"),
  VIEW_STAFF_MOVEMENT: p("view", "staff_movement"),
  UPDATE_STAFF_MOVEMENT: p("update", "staff_movement"),
  DELETE_STAFF_MOVEMENT: p("delete", "staff_movement"),
  // staff_gate_pass
  CREATE_STAFF_GATE_PASS: p("create", "staff_gate_pass"),
  VIEW_STAFF_GATE_PASS: p("view", "staff_gate_pass"),
  UPDATE_STAFF_GATE_PASS: p("update", "staff_gate_pass"),
  DELETE_STAFF_GATE_PASS: p("delete", "staff_gate_pass"),
  // license
  CREATE_LICENSE: p("create", "license"),
  VIEW_LICENSE: p("view", "license"),
  UPDATE_LICENSE: p("update", "license"),
  DELETE_LICENSE: p("delete", "license"),
  // portal admin user accounts
  CREATE_USER: p("create", "user"),
  VIEW_USER: p("view", "user"),
  UPDATE_USER: p("update", "user"),
  DELETE_USER: p("delete", "user"),
} as const;

const RESOURCES = [
  "guest_list",
  "guest_movement",
  "vehicular_movement",
  "staff",
  "staff_parking",
  "staff_movement",
  "staff_gate_pass",
  "license",
  "user",
] as const;

function fullCrud(resource: (typeof RESOURCES)[number]): string[] {
  return [
    p("create", resource),
    p("view", resource),
    p("update", resource),
    p("delete", resource),
  ];
}

export function getPortalPermissionsForRole(role: AdminRole): string[] {
  if (role === AdminRole.SUPER_ADMIN) {
    return RESOURCES.flatMap((r) => fullCrud(r));
  }
  if (role === AdminRole.FRONT_DESK) {
    return fullCrud("guest_list");
  }
  if (role === AdminRole.RESORT_SECURITY) {
    return [
      PP.VIEW_GUEST_LIST,
      PP.VIEW_GUEST_MOVEMENT,
      PP.VIEW_VEHICULAR_MOVEMENT,
      ...fullCrud("staff"),
      PP.VIEW_STAFF_PARKING,
      PP.VIEW_STAFF_MOVEMENT,
      PP.VIEW_STAFF_GATE_PASS,
    ];
  }
  return [];
}

export function hasAllPortalPermissions(
  granted: string[] | undefined,
  required: string[],
): boolean {
  if (!granted?.length) return false;
  const set = new Set(granted);
  return required.every((r) => set.has(r));
}

export function hasAnyPortalPermission(
  granted: string[] | undefined,
  candidates: string[],
): boolean {
  if (!granted?.length) return false;
  const set = new Set(granted);
  return candidates.some((c) => set.has(c));
}

/**
 * Minimum `view:*` permission to open an admin route (direct URL / nav).
 * Longer paths must be listed before shorter prefixes (e.g. /admin/guests/movements before /admin/guests).
 */
const ADMIN_PATH_VIEW_GATES: { prefix: string; permission: string }[] = [
  { prefix: "/admin/users", permission: PP.VIEW_USER },
  { prefix: "/admin/licenses", permission: PP.VIEW_LICENSE },
  { prefix: "/admin/guests/movements", permission: PP.VIEW_GUEST_MOVEMENT },
  { prefix: "/admin/vehicles/movements", permission: PP.VIEW_VEHICULAR_MOVEMENT },
  { prefix: "/admin/staff-parking", permission: PP.VIEW_STAFF_PARKING },
  { prefix: "/admin/staff-movement", permission: PP.VIEW_STAFF_MOVEMENT },
  { prefix: "/admin/staff-exits", permission: PP.VIEW_STAFF_GATE_PASS },
  { prefix: "/admin/staff", permission: PP.VIEW_STAFF },
  { prefix: "/admin/guests", permission: PP.VIEW_GUEST_LIST },
];

export function getRequiredViewPermissionForAdminPath(
  pathname: string,
): string | null {
  if (pathname === "/admin" || pathname === "/admin/") {
    return null;
  }
  const sorted = [...ADMIN_PATH_VIEW_GATES].sort(
    (a, b) => b.prefix.length - a.prefix.length,
  );
  for (const { prefix, permission } of sorted) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return permission;
    }
  }
  return null;
}
