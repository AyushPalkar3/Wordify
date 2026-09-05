import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

// Uses only the edge-safe config (no Prisma/bcrypt) so this can run
// in the Edge runtime. The `authorized` callback in auth.config.ts
// decides which paths require a session.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/dashboard/:path*", "/library/:path*", "/practice/:path*", "/history/:path*"],
};
