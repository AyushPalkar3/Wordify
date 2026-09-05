import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { LookupPanel } from "@/components/vocabulary/LookupPanel";

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "word" | "phrase" }) {
  const accent =
    tone === "word" ? "text-word" : tone === "phrase" ? "text-phrase" : "text-ink";
  return (
    <div className="rounded-sm border border-rule bg-paper-card px-5 py-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">{label}</p>
      <p className={`mt-1 font-display text-3xl ${accent}`}>{value}</p>
    </div>
  );
}

function RecentList({
  title,
  tone,
  items,
  emptyText,
}: {
  title: string;
  tone: "word" | "phrase";
  items: { id: string; text: string; meaning: string }[];
  emptyText: string;
}) {
  return (
    <div className="rounded-sm border border-rule bg-paper-card p-5">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">{emptyText}</p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-rule-soft">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-2.5">
              <span
                aria-hidden
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                  tone === "word" ? "bg-word" : "bg-phrase"
                }`}
              />
              <div className="min-w-0">
                <p className="font-display text-base text-ink">{item.text}</p>
                <p className="truncate text-xs text-ink-soft">{item.meaning}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Explicit row shapes for the map callbacks below — see library/page.tsx
// for why (Prisma client is an untyped stub until `prisma generate` runs).
type RecentWordRow = { id: string; word: string; meaning: string };
type RecentPhraseRow = { id: string; phrase: string; meaning: string };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id; // proxy.ts guarantees an authenticated session here
  const firstName = session?.user?.name?.split(" ")[0];

  const [wordCount, phraseCount, recentWordsRaw, recentPhrasesRaw] = await Promise.all([
    prisma.word.count({ where: { userId } }),
    prisma.phrase.count({ where: { userId } }),
    prisma.word.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.phrase.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const recentWords = recentWordsRaw.map((w: RecentWordRow) => ({
    id: w.id,
    text: w.word,
    meaning: w.meaning,
  }));
  const recentPhrases = recentPhrasesRaw.map((p: RecentPhraseRow) => ({
    id: p.id,
    text: p.phrase,
    meaning: p.meaning,
  }));

  return (
    <div className="flex flex-col gap-10">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">Dashboard</p>
        <h1 className="mt-1 font-display text-3xl text-ink">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="mt-2 text-ink-soft">Here&apos;s the state of your catalog.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Saved words" value={String(wordCount)} tone="word" />
        <StatCard label="Saved phrases" value={String(phraseCount)} tone="phrase" />
        <StatCard label="Total vocabulary" value={String(wordCount + phraseCount)} />
      </div>

      <LookupPanel />

      <div className="grid gap-6 sm:grid-cols-2">
        <RecentList
          title="Recently added words"
          tone="word"
          items={recentWords}
          emptyText="Look up a word above to start filing your catalog."
        />
        <RecentList
          title="Recently added phrases"
          tone="phrase"
          items={recentPhrases}
          emptyText="Look up a phrase above to start filing your catalog."
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/practice">
          <Button variant="secondary">Go to Practice</Button>
        </Link>
        <Link href="/library">
          <Button variant="secondary">View My Library</Button>
        </Link>
      </div>
    </div>
  );
}
