import type { NextAuthConfig } from "next-auth";

const PROTECTED_PATHS = ["/dashboard", "/library", "/practice", "/history"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = PROTECTED_PATHS.some((path) =>
        nextUrl.pathname.startsWith(path)
      );
      if (isProtected) return isLoggedIn;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  // Providers that need Node APIs (Prisma, bcrypt) are added in auth.ts,
  // which is never imported by middleware.
  providers: [],
} satisfies NextAuthConfig;
