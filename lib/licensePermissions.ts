import { MovementType } from "@/lib/enums";

/** Mobile app license capability strings stored on `License.permissions`. */
export const LicensePermission = {
  SCAN_QR: "scan_qr",
  VIEW_GUEST_LIST: "view_guest_list",
  LOG_VEHICULAR_MOVEMENT: "log_vehicular_movement",
  LOG_GUEST_MOVEMENT: "log_guest_movement",
  OFFLINE_MODE: "offline_mode",
  LOG_STAFF_MOVEMENT: "log_staff_movement",
  LOG_STAFF_PARKING: "log_staff_parking",
} as const;

/** Valid values accepted when creating/updating licenses via the admin API. */
export const ALLOWED_LICENSE_PERMISSION_VALUES = new Set<string>([
  LicensePermission.SCAN_QR,
  LicensePermission.VIEW_GUEST_LIST,
  LicensePermission.LOG_GUEST_MOVEMENT,
  LicensePermission.LOG_VEHICULAR_MOVEMENT,
  LicensePermission.LOG_STAFF_PARKING,
  LicensePermission.LOG_STAFF_MOVEMENT,
  LicensePermission.OFFLINE_MODE,
]);

export const LICENSE_PERMISSION_OPTIONS: { value: string; label: string }[] = [
  { value: LicensePermission.SCAN_QR, label: "Scan QR codes" },
  { value: LicensePermission.VIEW_GUEST_LIST, label: "View guest list" },
  {
    value: LicensePermission.LOG_GUEST_MOVEMENT,
    label: "Log guest movements",
  },
  {
    value: LicensePermission.LOG_VEHICULAR_MOVEMENT,
    label: "Log vehicular movements",
  },
  {
    value: LicensePermission.LOG_STAFF_PARKING,
    label: "Log staff parking",
  },
  {
    value: LicensePermission.LOG_STAFF_MOVEMENT,
    label: "Log staff movement (shifts / gate activity)",
  },
  { value: LicensePermission.OFFLINE_MODE, label: "Offline mode" },
];

const MOVEMENT_TYPE_TO_LICENSE: Record<string, string> = {
  [MovementType.GUEST]: LicensePermission.LOG_GUEST_MOVEMENT,
  [MovementType.VEHICULAR]: LicensePermission.LOG_VEHICULAR_MOVEMENT,
  [MovementType.STAFF_PARKING]: LicensePermission.LOG_STAFF_PARKING,
};

/** License permission string required to POST a movement of this type (mobile device). */
export function licensePermissionForMovementType(
  movementType: string,
): string | null {
  return MOVEMENT_TYPE_TO_LICENSE[movementType] ?? null;
}
