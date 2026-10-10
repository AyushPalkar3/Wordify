import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { LibraryView } from "@/components/vocabulary/LibraryView";
import type {
  WordItem,
  PhraseItem,
  Difficulty,
  WordMeaningEntry,
} from "@/lib/types/vocabulary";
import type { Prisma } from "@prisma/client";

function isWordMeaningEntry(value: unknown): value is WordMeaningEntry {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.meaning === "string" &&
    typeof entry.partOfSpeech === "string" &&
    typeof entry.exampleSentence === "string"
  );
}

function parseMeanings(value: Prisma.JsonValue): WordMeaningEntry[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const entries: unknown[] = value;

  if (!entries.every(isWordMeaningEntry)) {
    return undefined;
  }

  return entries;
}

export default async function LibraryPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [words, phrases] = await Promise.all([
    prisma.word.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.phrase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const wordItems: WordItem[] = words.map((w) => ({
    id: w.id,
    word: w.word,
    meaning: w.meaning,
    exampleSentence: w.exampleSentence,
    partOfSpeech: w.partOfSpeech,
    difficulty: w.difficulty,
    synonyms: w.synonyms,
    meanings: parseMeanings(w.meanings),
    createdAt: w.createdAt.toISOString(),
  }));

  const phraseItems: PhraseItem[] = phrases.map((p) => ({
    id: p.id,
    phrase: p.phrase,
    meaning: p.meaning,
    exampleSentence: p.exampleSentence,
    phraseType: p.phraseType,
    difficulty: p.difficulty,
    similarPhrases: p.similarPhrases,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
          My Library
        </p>
        <h1 className="mt-1 font-display text-3xl text-ink">
          Your catalog
        </h1>
        <p className="mt-2 text-ink-soft">
          Words and phrases you&apos;ve saved live here, filed separately.
        </p>
      </div>

      <LibraryView initialWords={wordItems} initialPhrases={phraseItems} />
    </div>
  );
}