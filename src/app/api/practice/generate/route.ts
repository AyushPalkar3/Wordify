import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { practiceRequestSchema } from "@/lib/validation/practice";
import {
  generatePracticeSentences,
  AIConfigError,
  AIResponseError,
} from "@/lib/ai/gemini";
import type { PracticeItemInput } from "@/lib/ai/schemas";
import type { Difficulty } from "@/lib/types/vocabulary";
import { checkRateLimit } from "@/lib/rate-limit";

type WordRow = {
  id: string;
  word: string;
  meaning: string;
  exampleSentence: string;
  partOfSpeech: string;
  difficulty: Difficulty;
};

type PhraseRow = {
  id: string;
  phrase: string;
  meaning: string;
  exampleSentence: string;
  phraseType: string;
  difficulty: Difficulty;
};

type PoolItem = {
  id: string;
  kind: "word" | "phrase";
  text: string;
  meaning: string;
  exampleSentence: string;
};

// Fisher-Yates — unbiased, unlike `.sort(() => Math.random() - 0.5)`.
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const RATE_LIMIT = 10; // sessions
const RATE_WINDOW_MS = 60_000; // per minute, per user — lower than /api/analyze since
// each call generates multiple sentences in one AI request

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`practice:${session.user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "You're starting sessions a bit fast — try again in a moment." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = practiceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { practiceType, numberOfItems } = parsed.data;
  const userId = session.user.id;

  // Scoped to this user only — practice must never draw from anyone else's
  // vocabulary (spec #33).
  const [wordPool, phrasePool] = await Promise.all([
    practiceType === "words" || practiceType === "mixed"
      ? prisma.word.findMany({ where: { userId } })
      : Promise.resolve([]),
    practiceType === "phrases" || practiceType === "mixed"
      ? prisma.phrase.findMany({ where: { userId } })
      : Promise.resolve([]),
  ]);

  const pool: PoolItem[] = [
    ...wordPool.map((w: WordRow) => ({
      id: w.id,
      kind: "word" as const,
      text: w.word,
      meaning: w.meaning,
      exampleSentence: w.exampleSentence,
    })),
    ...phrasePool.map((p: PhraseRow) => ({
      id: p.id,
      kind: "phrase" as const,
      text: p.phrase,
      meaning: p.meaning,
      exampleSentence: p.exampleSentence,
    })),
  ];

  if (pool.length < numberOfItems) {
    const label = practiceType === "mixed" ? "saved items" : `saved ${practiceType}`;
    return NextResponse.json(
      {
        error: `You only have ${pool.length} ${label} — save a few more before practicing with ${numberOfItems}.`,
      },
      { status: 400 }
    );
  }

  // Fisher-Yates over a pool of unique DB rows guarantees no duplicates.
  const selected = shuffle(pool).slice(0, numberOfItems);

  try {
    const aiInput: PracticeItemInput[] = selected.map((s) => ({
      id: s.id,
      kind: s.kind,
      text: s.text,
    }));
    const aiResult = await generatePracticeSentences(aiInput);
    const sentenceById = new Map(aiResult.sentences.map((s) => [s.id, s.sentence]));

    const items = selected.map((s) => ({
      id: s.id,
      kind: s.kind,
      text: s.text,
      meaning: s.meaning,
      // Fall back to the item's stored example sentence in the unlikely
      // event the AI response was missing this id after validation.
      sentence: sentenceById.get(s.id) ?? s.exampleSentence,
    }));

    // Snapshot the session for history (Phase 9). Stored as JSON so the
    // record survives even if the source word/phrase is later deleted
    // from the library.
    try {
      await prisma.practiceSession.create({
        data: {
          userId,
          numberOfItems,
          practiceType,
          selectedItems: items.map((i) => ({
            id: i.id,
            kind: i.kind,
            text: i.text,
            meaning: i.meaning,
          })),
          generatedSentences: items.map((i) => ({ id: i.id, sentence: i.sentence })),
        },
      });
    } catch (historyError) {
      // A failed history write shouldn't fail the practice session itself —
      // the person already has their cards. Log and move on.
      console.error("Failed to save practice session history:", historyError);
    }

    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof AIConfigError) {
      return NextResponse.json(
        { error: "The AI isn't configured yet. Add GEMINI_API_KEY to your environment." },
        { status: 500 }
      );
    }
    if (error instanceof AIResponseError) {
      return NextResponse.json(
        { error: "Couldn't generate practice sentences. Please try again." },
        { status: 502 }
      );
    }
    console.error("Unexpected error in /api/practice/generate:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
