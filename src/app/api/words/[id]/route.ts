import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  // Scope the delete to this user's own rows in the query itself, rather
  // than fetching first and checking ownership after — this way a user
  // can never even learn whether an id belonging to someone else exists.
  const { count } = await prisma.word.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (count === 0) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
