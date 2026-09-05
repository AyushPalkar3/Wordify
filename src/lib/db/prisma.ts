import { PrismaClient } from "@prisma/client";

// Standard Next.js Prisma singleton pattern: in dev, Next's hot-reload
// re-executes this module on every change, which would otherwise open a
// new PrismaClient (and a new DB connection pool) each time. Stashing the
// instance on `globalThis` survives the reload.
//
// The client is also constructed lazily (on first property access, via
// Proxy) rather than at import time. This means modules that import
// `prisma` but only use it conditionally — e.g. a NextAuth session check
// that never actually queries the DB — don't pay the cost (or risk) of
// connecting until a query is actually made.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
