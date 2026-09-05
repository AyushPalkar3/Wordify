import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { phraseAnalysisSchema } from "@/lib/ai/schemas";
import { isUniqueConstraintError } from "@/lib/db/errors";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().slice(0, 200);

  const phrases = await prisma.phrase.findMany({
    where: {
      userId: session.user.id,
      ...(q ? { phrase: { contains: q, mode: "insensitive" as const } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ phrases });
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

  const parsed = phraseAnalysisSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid phrase data" },
      { status: 400 }
    );
  }

  const { phrase, meaning, exampleSentence, phraseType, difficulty, similarPhrases } = parsed.data;
  const userId = session.user.id;

  const existing = await prisma.phrase.findFirst({
    where: { userId, phrase: { equals: phrase, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json(
      { error: `You've already saved "${existing.phrase}" to your library.` },
      { status: 409 }
    );
  }

  try {
    const saved = await prisma.phrase.create({
      data: { userId, phrase, meaning, exampleSentence, phraseType, difficulty, similarPhrases },
    });
    return NextResponse.json({ phrase: saved }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "You've already saved this phrase to your library." },
        { status: 409 }
      );
    }
    console.error("Unexpected error in POST /api/phrases:", error);
    return NextResponse.json({ error: "Couldn't save that phrase. Please try again." }, { status: 500 });
  }
}
