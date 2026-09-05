import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { wordAnalysisSchema } from "@/lib/ai/schemas";
import { isUniqueConstraintError } from "@/lib/db/errors";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().slice(0, 200);

  const words = await prisma.word.findMany({
    where: {
      userId: session.user.id,
      ...(q ? { word: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ words });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = wordAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid word data" },
      { status: 400 }
    );
  }

  const { word, meaning, exampleSentence, partOfSpeech, difficulty, synonyms, meanings } =
    parsed.data;
  const userId = session.user.id;

  // Case-insensitive duplicate check — the DB unique constraint from
  // Phase 2 is an exact-match backstop; this is the real check.
  const existing = await prisma.word.findFirst({
    where: { userId, word: { equals: word, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json(
      { error: `You've already saved "${existing.word}" to your library.` },
      { status: 409 }
    );
  }

  try {
    const saved = await prisma.word.create({
      data: {
        userId,
        word,
        meaning,
        exampleSentence,
        partOfSpeech,
        difficulty,
        synonyms,
        // Only stored when the word genuinely has more than one meaning —
        // a single-entry array is redundant with the primary fields above,
        // so we don't bother persisting it (keeps old-vs-new rows visually
        // consistent: meanings is populated only when it adds information).
        meanings: meanings && meanings.length > 1 ? meanings : undefined,
      },
    });
    return NextResponse.json({ word: saved }, { status: 201 });
  } catch (error) {
    // Backstop in case of a race between the check above and the insert.
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "You've already saved this word to your library." },
        { status: 409 }
      );
    }
    console.error("Unexpected error in POST /api/words:", error);
    return NextResponse.json({ error: "Couldn't save that word. Please try again." }, { status: 500 });
  }
}
