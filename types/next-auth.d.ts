import "next-auth";
import { AdminRole } from "@/lib/enums";

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: AdminRole;
    requires_password_change?: boolean;
  }
}

declare module "next-auth" {
  interface User {
    id: string;
    role: AdminRole;
    requires_password_change: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      role: AdminRole;
      requires_password_change: boolean;
    };
  }
}
