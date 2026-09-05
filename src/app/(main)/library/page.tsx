import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { LibraryView } from "@/components/vocabulary/LibraryView";
import type { WordItem, PhraseItem, Difficulty, WordMeaningEntry } from "@/lib/types/vocabulary";

// Explicit row shapes for the map callbacks below. @prisma/client resolves
// to an untyped stub until `prisma generate` has been run (see prisma/README.md),
// so without these, TS can't infer the callback parameter types.
type WordRow = {
  id: string;
  word: string;
  meaning: string;
  exampleSentence: string;
  partOfSpeech: string;
  difficulty: Difficulty;
  synonyms: string[];
  meanings: WordMeaningEntry[] | null;
  createdAt: Date;
};

type PhraseRow = {
  id: string;
  phrase: string;
  meaning: string;
  exampleSentence: string;
  phraseType: string;
  difficulty: Difficulty;
  similarPhrases: string[];
  createdAt: Date;
};

export default async function LibraryPage() {
  const session = await auth();
  const userId = session!.user.id; // proxy.ts guarantees an authenticated session here

  const [words, phrases] = await Promise.all([
    prisma.word.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.phrase.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  const wordItems: WordItem[] = words.map((w: WordRow) => ({
    id: w.id,
    word: w.word,
    meaning: w.meaning,
    exampleSentence: w.exampleSentence,
    partOfSpeech: w.partOfSpeech,
    difficulty: w.difficulty,
    synonyms: w.synonyms,
    meanings: w.meanings ?? undefined,
    createdAt: w.createdAt.toISOString(),
  }));

  const phraseItems: PhraseItem[] = phrases.map((p: PhraseRow) => ({
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
        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">My Library</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Your catalog</h1>
        <p className="mt-2 text-ink-soft">
          Words and phrases you&apos;ve saved live here, filed separately.
        </p>
      </div>

      <LibraryView initialWords={wordItems} initialPhrases={phraseItems} />
    </div>
  );
}
