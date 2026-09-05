/**
 * Prisma's PrismaClientKnownRequestError class is only available on a
 * fully generated client. Checking the error shape structurally (instead
 * of `instanceof Prisma.PrismaClientKnownRequestError`) works identically
 * either way, and doesn't require importing a type that may not exist
 * yet on an ungenerated client.
 */
export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002"
  );
}
