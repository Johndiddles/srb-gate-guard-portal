import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { postAuthDestination } from "@/lib/postAuthRedirect";

const authSecret = process.env.NEXTAUTH_SECRET ?? "";

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
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/change-password/:path*"],
};
