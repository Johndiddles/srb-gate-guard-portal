import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { userRepository } from "@/lib/repositories/UserRepository";
import { AdminRole, ResortLocation } from "@/lib/enums";
import { getPortalPermissionsForRole } from "@/lib/portalPermissionMatrix";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await userRepository.findByEmail(credentials.email);
        if (!user) {
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash,
        );
        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          requires_password_change: user.requires_password_change,
          permissions: getPortalPermissionsForRole(user.role),
          location: user.location,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.requires_password_change = user.requires_password_change;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.location = (user as any).location;
      }
      if (token.role) {
        token.permissions = [...getPortalPermissionsForRole(token.role as AdminRole)];
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as AdminRole,
          requires_password_change: token.requires_password_change as boolean,
          permissions: (token.permissions as string[]) ?? [],
          location: token.location as string | undefined,
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET ?? "",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
