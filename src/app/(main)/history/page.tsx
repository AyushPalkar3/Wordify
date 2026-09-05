import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

type SelectedItem = { id: string; kind: "word" | "phrase"; text: string; meaning: string };
type GeneratedSentence = { id: string; sentence: string };

type SessionRow = {
  id: string;
  numberOfItems: number;
  practiceType: "words" | "phrases" | "mixed";
  selectedItems: unknown;
  generatedSentences: unknown;
  createdAt: Date;
};

const TYPE_LABEL: Record<SessionRow["practiceType"], string> = {
  words: "Words",
  phrases: "Phrases",
  mixed: "Words + Phrases",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function HistoryPage() {
  const session = await auth();
  const userId = session!.user.id; // proxy.ts guarantees an authenticated session here

  const sessions: SessionRow[] = await prisma.practiceSession.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">History</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Practice sessions</h1>
        <p className="mt-2 text-ink-soft">
          Every set of cards you&apos;ve drawn, with the sentences generated for it.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-rule bg-paper-card/60 px-6 py-16 text-center">
          <p className="font-display text-xl italic text-ink-soft">No sessions yet</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Run a practice session and it&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => {
            const items = (s.selectedItems as SelectedItem[] | null) ?? [];
            const sentences = (s.generatedSentences as GeneratedSentence[] | null) ?? [];
            const sentenceById = new Map(sentences.map((x) => [x.id, x.sentence]));

            return (
              <details
                key={s.id}
                className="group rounded-sm border border-rule bg-paper-card open:bg-paper-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-display text-lg text-ink">
                      {dateFormatter.format(s.createdAt)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-ink-soft">
                      {s.numberOfItems} item{s.numberOfItems === 1 ? "" : "s"} ·{" "}
                      {TYPE_LABEL[s.practiceType]}
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="font-mono text-ink-soft transition-transform group-open:rotate-180"
                  >
                    ⌄
                  </span>
                </summary>
                <div className="flex flex-col gap-3 border-t border-rule-soft px-5 py-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                          item.kind === "word" ? "bg-word" : "bg-phrase"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-display text-base text-ink">{item.text}</p>
                        <p className="text-xs text-ink-soft">{item.meaning}</p>
                        {sentenceById.get(item.id) && (
                          <p className="mt-1 text-sm italic text-ink-soft">
                            &ldquo;{sentenceById.get(item.id)}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      )}
    </div>
  );
}
