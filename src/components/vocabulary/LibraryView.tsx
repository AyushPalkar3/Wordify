"use client";

import { useMemo, useState } from "react";
import { IndexCard } from "@/components/ui/IndexCard";
import { Tag } from "@/components/ui/Tag";
import type { WordItem, PhraseItem } from "@/lib/types/vocabulary";

type Tab = "words" | "phrases" | "all";

export function LibraryView({
  initialWords,
  initialPhrases,
}: {
  initialWords: WordItem[];
  initialPhrases: PhraseItem[];
}) {
  const [words, setWords] = useState(initialWords);
  const [phrases, setPhrases] = useState(initialPhrases);
  const [tab, setTab] = useState<Tab>("words");
  const [query, setQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filteredWords = useMemo(
    () => words.filter((w) => w.word.toLowerCase().includes(q)),
    [words, q]
  );
  const filteredPhrases = useMemo(
    () => phrases.filter((p) => p.phrase.toLowerCase().includes(q)),
    [phrases, q]
  );

  async function handleDeleteWord(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/words/${id}`, { method: "DELETE" });
      if (res.ok) setWords((prev) => prev.filter((w) => w.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeletePhrase(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/phrases/${id}`, { method: "DELETE" });
      if (res.ok) setPhrases((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "words", label: "My Words", count: words.length },
    { key: "phrases", label: "My Phrases", count: phrases.length },
    { key: "all", label: "All", count: words.length + phrases.length },
  ];

  const showWords = tab === "words" || tab === "all";
  const showPhrases = tab === "phrases" || tab === "all";
  const visibleCount =
    (showWords ? filteredWords.length : 0) + (showPhrases ? filteredPhrases.length : 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 border-b border-rule">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-t-sm px-4 py-2 font-sans text-sm transition-colors ${
              tab === t.key
                ? "border border-b-0 border-rule bg-paper-card text-ink"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            {t.label} <span className="font-mono text-xs text-ink-soft">({t.count})</span>
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your catalog…"
        aria-label="Search your catalog"
        className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink"
      />

      {visibleCount === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-rule bg-paper-card/60 px-6 py-16 text-center">
          <p className="font-display text-xl italic text-ink-soft">
            {query ? "No matches" : "The drawer is empty"}
          </p>
          <p className="max-w-sm text-sm text-ink-soft">
            {query
              ? "Try a different search term."
              : "Look something up from the dashboard to start filing words and phrases here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {showWords &&
            filteredWords.map((w) => (
              <IndexCard
                key={w.id}
                kind="word"
                eyebrow={
                  w.meanings && w.meanings.length > 1
                    ? w.difficulty
                    : `${w.partOfSpeech} · ${w.difficulty}`
                }
              >
                <p className="font-display text-2xl text-ink">{w.word}</p>
                {w.meanings && w.meanings.length > 1 ? (
                  <div className="mt-2 flex flex-col gap-3">
                    {w.meanings.map((m, i) => (
                      <div key={i} className={i > 0 ? "border-t border-rule-soft pt-3" : ""}>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-word">
                          Meaning {i + 1} — {m.context} · {m.partOfSpeech}
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">{m.meaning}</p>
                        <p className="mt-2 font-sans text-sm italic text-ink-soft">
                          &ldquo;{m.exampleSentence}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-sm text-ink-soft">{w.meaning}</p>
                    <p className="mt-3 border-t border-rule-soft pt-3 font-sans text-sm italic text-ink-soft">
                      &ldquo;{w.exampleSentence}&rdquo;
                    </p>
                  </>
                )}
                {w.synonyms.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {w.synonyms.map((s) => (
                      <Tag key={s} tone="word">
                        {s}
                      </Tag>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex justify-end border-t border-rule-soft pt-3">
                  <button
                    onClick={() => handleDeleteWord(w.id)}
                    disabled={deletingId === w.id}
                    aria-label={`Remove "${w.word}" from your words`}
                    className="font-mono text-xs uppercase tracking-wider text-danger hover:underline disabled:opacity-50"
                  >
                    {deletingId === w.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              </IndexCard>
            ))}

          {showPhrases &&
            filteredPhrases.map((p) => (
              <IndexCard key={p.id} kind="phrase" eyebrow={`${p.phraseType} · ${p.difficulty}`}>
                <p className="font-display text-2xl text-ink">{p.phrase}</p>
                <p className="mt-2 text-sm text-ink-soft">{p.meaning}</p>
                <p className="mt-3 border-t border-rule-soft pt-3 font-sans text-sm italic text-ink-soft">
                  &ldquo;{p.exampleSentence}&rdquo;
                </p>
                {p.similarPhrases.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.similarPhrases.map((s) => (
                      <Tag key={s} tone="phrase">
                        {s}
                      </Tag>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex justify-end border-t border-rule-soft pt-3">
                  <button
                    onClick={() => handleDeletePhrase(p.id)}
                    disabled={deletingId === p.id}
                    aria-label={`Remove "${p.phrase}" from your phrases`}
                    className="font-mono text-xs uppercase tracking-wider text-danger hover:underline disabled:opacity-50"
                  >
                    {deletingId === p.id ? "Removing…" : "Remove"}
                  </button>
                </div>
              </IndexCard>
            ))}
        </div>
      )}
    </div>
  );
}
