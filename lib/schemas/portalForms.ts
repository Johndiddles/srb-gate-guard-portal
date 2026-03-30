import { z } from "zod";
import { AdminRole } from "@/lib/enums";

export const loginFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const changePasswordFormSchema = z
  .object({
    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export const adminUserFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  role: z.nativeEnum(AdminRole),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export type AdminUserFormValues = z.infer<typeof adminUserFormSchema>;

export const licenseCreateFormSchema = z.object({
  device_name: z.string().trim().min(1, "Device name is required"),
  permissions: z
    .array(z.string())
    .min(1, "Select at least one permission"),
});

export type LicenseCreateFormValues = z.infer<typeof licenseCreateFormSchema>;

export const staffRecordFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  staffId: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  rank: z.string().min(1, "Rank is required"),
  status: z.string().min(1, "Status is required"),
});

export type StaffRecordFormValues = z.infer<typeof staffRecordFormSchema>;

export const staffRecordFormDefaults: StaffRecordFormValues = {
  firstName: "",
  lastName: "",
  staffId: "",
  department: "",
  rank: "Regular",
  status: "Active",
};

function isSpreadsheetFileName(name: string): boolean {
  const n = name.toLowerCase();
  return n.endsWith(".xlsx") || n.endsWith(".csv");
}

export const staffImportFormSchema = z
  .object({
    file: z.custom<FileList | undefined>(() => true),
  })
  .superRefine((data, ctx) => {
    const f = data.file;
    if (typeof FileList === "undefined" || !(f instanceof FileList) || f.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: "Select a file",
      });
      return;
    }
    if (!isSpreadsheetFileName(f[0]!.name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: "File must be .xlsx or .csv",
      });
    }
  });

export type StaffImportFormValues = z.infer<typeof staffImportFormSchema>;

/** Validated on file pick + submit (same step). */
export const guestListUploadFormSchema = z
  .object({
    file: z.custom<FileList | undefined>(() => true),
  })
  .superRefine((data, ctx) => {
    const f = data.file;
    if (typeof FileList === "undefined" || !(f instanceof FileList) || f.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: "Select a file",
      });
      return;
    }
    if (!isSpreadsheetFileName(f[0]!.name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["file"],
        message: "Please select a valid .xlsx or .csv file",
      });
    }
  });

export type GuestListUploadFormValues = z.infer<typeof guestListUploadFormSchema>;
