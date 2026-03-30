import "next-auth";
import { AdminRole } from "@/lib/enums";

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AdminRole;
    requires_password_change?: boolean;
    /** Populated from role via portal permission matrix */
    permissions?: string[];
  }
}

declare module "next-auth" {
  interface User {
    id: string;
    role: AdminRole;
    requires_password_change: boolean;
    permissions: string[];
  }

  interface Session {
    user: User & {
      id: string;
      role: AdminRole;
      requires_password_change: boolean;
      permissions: string[];
    };
  }
}
