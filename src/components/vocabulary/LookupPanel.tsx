"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { IndexCard } from "@/components/ui/IndexCard";
import type { AnalysisResult } from "@/lib/ai/schemas";

type Status = "idle" | "loading" | "result" | "error";
type SaveStatus = "unsaved" | "saving" | "saved" | "duplicate" | "error";

export function LookupPanel() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("unsaved");
  const [saveMessage, setSaveMessage] = useState("");

  async function handleExplain(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setStatus("loading");
    setErrorMessage("");
    setResult(null);
    setSaveStatus("unsaved");
    setSaveMessage("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setResult(data.result);
      setStatus("result");
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaveStatus("saving");
    setSaveMessage("");

    try {
      const endpoint = result.type === "word" ? "/api/words" : "/api/phrases";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      const data = await res.json();

      if (res.status === 409) {
        setSaveStatus("duplicate");
        setSaveMessage(data.error ?? "Already saved.");
        return;
      }
      if (!res.ok) {
        setSaveStatus("error");
        setSaveMessage(data.error ?? "Couldn't save that. Please try again.");
        return;
      }

      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      setSaveMessage("Couldn't reach the server. Check your connection and try again.");
    }
  }

  return (
    <div className="rounded-sm border border-rule bg-paper-card p-6">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
        Look something up
      </p>
      <p className="mt-1 text-ink-soft">
        Enter a word or phrase to get an explanation and file it into your catalog.
      </p>

      <form onSubmit={handleExplain} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. meticulous, or break the ice"
          aria-label="Word or phrase to look up"
          className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink"
          disabled={status === "loading"}
        />
        <Button type="submit" disabled={status === "loading" || !input.trim()}>
          {status === "loading" ? "Explaining…" : "Explain"}
        </Button>
      </form>

      <div aria-live="polite">
        {status === "error" && (
          <p className="mt-4 rounded-sm border border-danger/30 bg-danger-tint px-3 py-2 text-sm text-danger">
            {errorMessage}
          </p>
        )}
      </div>

      {status === "result" && result && (
        <div className="mt-6">
          <IndexCard
            kind={result.type}
            eyebrow={
              result.type === "word"
                ? result.meanings && result.meanings.length > 1
                  ? result.difficulty
                  : `${result.partOfSpeech} · ${result.difficulty}`
                : `${result.phraseType} · ${result.difficulty}`
            }
          >
            <p className="font-display text-2xl text-ink">
              {result.type === "word" ? result.word : result.phrase}
            </p>

            {result.type === "word" && result.meanings && result.meanings.length > 1 ? (
              <div className="mt-2 flex flex-col gap-3">
                {result.meanings.map((m, i) => (
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
                <p className="mt-2 text-sm text-ink-soft">{result.meaning}</p>
                <p className="mt-3 border-t border-rule-soft pt-3 font-sans text-sm italic text-ink-soft">
                  &ldquo;{result.exampleSentence}&rdquo;
                </p>
              </>
            )}
            {(result.type === "word" ? result.synonyms : result.similarPhrases).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(result.type === "word" ? result.synonyms : result.similarPhrases).map((s) => (
                  <Tag key={s} tone={result.type}>
                    {s}
                  </Tag>
                ))}
              </div>
            )}

            <div className="mt-4 border-t border-rule-soft pt-4" aria-live="polite">
              {saveStatus === "unsaved" && (
                <Button variant="secondary" onClick={handleSave}>
                  Save to {result.type === "word" ? "My Words" : "My Phrases"}
                </Button>
              )}
              {saveStatus === "saving" && <Button disabled>Saving…</Button>}
              {saveStatus === "saved" && (
                <p className="font-mono text-xs uppercase tracking-wider text-phrase">
                  ✓ Saved to your catalog
                </p>
              )}
              {saveStatus === "duplicate" && (
                <p className="text-sm text-ink-soft">{saveMessage}</p>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-danger">{saveMessage}</p>
                  <Button variant="secondary" onClick={handleSave}>
                    Retry
                  </Button>
                </div>
              )}
            </div>
          </IndexCard>
        </div>
      )}
    </div>
  );
}
