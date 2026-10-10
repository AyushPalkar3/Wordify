import { randomBytes } from "crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { prisma } from "@/lib/db/prisma";
import { loginSchema } from "@/lib/validation/auth";
import { authConfig } from "@/lib/auth/auth.config";

// Google-authenticated users never set a password of their own, but
// `passwordHash` is a required (NOT NULL) column — changing that would be a
// schema migration, which the Google sign-in work is meant to avoid unless
// genuinely necessary. Instead we store a long random value, bcrypt-hashed
// like any real password. No plaintext password ever equals this random
// value, so credential login simply (and correctly) fails for Google-only
// accounts until/unless the user sets a real password through some future
// "set a password" flow.
function unusablePasswordHash(): Promise<string> {
  return bcrypt.hash(randomBytes(32).toString("hex"), 12);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
    Google({
      // Auth.js' Google provider defaults to reading AUTH_GOOGLE_ID /
      // AUTH_GOOGLE_SECRET from the environment, so no explicit
      // clientId/clientSecret wiring is needed here.
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Runs for every sign-in attempt, Credentials and Google alike. For
    // Google we do the account-matching / account-creation here, then stamp
    // the resolved *database* user id onto `user.id` so the existing
    // `jwt` callback (unchanged, in auth.config.ts) picks it up exactly the
    // way it already does for Credentials logins.
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email ?? profile?.email;
      const emailVerified = profile?.email_verified === true;

      // Refuse sign-in rather than trust an unverified email: matching on
      // an unverified address is how account takeover happens (someone
      // creates a Google account with your email and signs in as you).
      if (!email || !emailVerified) {
        return false;
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        // Reuse the existing account as-is. Deliberately do NOT overwrite
        // name/passwordHash/etc — a Google login shouldn't silently change
        // profile data the user set another way.
        user.id = existing.id;
        return true;
      }

      try {
        const created = await prisma.user.create({
          data: {
            name: user.name ?? email.split("@")[0],
            email,
            passwordHash: await unusablePasswordHash(),
          },
        });
        user.id = created.id;
        return true;
      } catch (error) {
        // Two concurrent first-time Google sign-ins for the same brand-new
        // email can both pass the findUnique check above and then race on
        // create(); the DB's @@unique(email) constraint is the real guard.
        // On that race, just re-fetch the row the other request created.
        if (
          error instanceof PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const createdByRace = await prisma.user.findUnique({ where: { email } });
          if (createdByRace) {
            user.id = createdByRace.id;
            return true;
          }
        }
        throw error;
      }
    },
  },
});
