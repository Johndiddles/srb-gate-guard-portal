import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { postAuthDestination } from "@/lib/postAuthRedirect";
import { isSecurityOnlyAdminPath } from "@/lib/portalRoles";
import { AdminRole } from "@/lib/enums";

const authSecret =
  process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET ?? "";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const token = await getToken({
    req,
    secret: authSecret,
  });

  if (pathname === "/") {
    if (token) {
      const dest = postAuthDestination(token);
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/change-password")
  ) {
    if (!token) {
      const signIn = new URL("/", req.url);
      signIn.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(signIn);
    }
    if (
      pathname.startsWith("/admin") &&
      isSecurityOnlyAdminPath(pathname)
    ) {
      const role = token.role as AdminRole | undefined;
      if (
        role !== AdminRole.SUPER_ADMIN &&
        role !== AdminRole.RESORT_SECURITY
      ) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/change-password/:path*"],
};
