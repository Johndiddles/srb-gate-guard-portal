import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/", // Redirect unauthenticated users to the root
  },
});

export const config = {
  // Protect all routes under /admin and /change-password
  matcher: ["/admin/:path*", "/change-password/:path*"],
};
