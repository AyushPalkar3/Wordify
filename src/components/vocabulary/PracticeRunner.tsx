"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { IndexCard } from "@/components/ui/IndexCard";

type PracticeType = "words" | "phrases" | "mixed";
type Status = "setup" | "loading" | "results" | "error";

type PracticeResultItem = {
  id: string;
  kind: "word" | "phrase";
  text: string;
  meaning: string;
  sentence: string;
};

const TYPE_OPTIONS: { value: PracticeType; label: string }[] = [
  { value: "words", label: "Words" },
  { value: "phrases", label: "Phrases" },
  { value: "mixed", label: "Words + Phrases" },
];

export function PracticeRunner() {
  const [practiceType, setPracticeType] = useState<PracticeType>("mixed");
  const [numberOfItems, setNumberOfItems] = useState(4);
  const [status, setStatus] = useState<Status>("setup");
  const [errorMessage, setErrorMessage] = useState("");
  const [results, setResults] = useState<PracticeResultItem[]>([]);

  async function handleStart() {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/practice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ practiceType, numberOfItems }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }

      setResults(data.items);
      setStatus("results");
    } catch {
      setErrorMessage("Couldn't reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "results") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
            {results.length} card{results.length === 1 ? "" : "s"} drawn
          </p>
          <Button variant="secondary" onClick={() => setStatus("setup")}>
            New session
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((item) => (
            <IndexCard key={item.id} kind={item.kind}>
              <p className="font-display text-2xl text-ink">{item.text}</p>
              <p className="mt-2 text-sm text-ink-soft">{item.meaning}</p>
              <p className="mt-3 border-t border-rule-soft pt-3 font-sans text-sm italic text-ink-soft">
                &ldquo;{item.sentence}&rdquo;
              </p>
            </IndexCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md rounded-sm border border-rule bg-paper-card p-6">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
        Practice type
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Practice type">
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPracticeType(opt.value)}
            disabled={status === "loading"}
            aria-pressed={practiceType === opt.value}
            className={`rounded-sm border px-3 py-1.5 text-sm transition-colors disabled:opacity-60 ${
              practiceType === opt.value
                ? "border-ink bg-ink text-paper-card"
                : "border-rule text-ink-soft hover:text-ink"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p className="mt-6 mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
        Number of items
      </p>
      <input
        type="number"
        min={1}
        max={20}
        value={numberOfItems}
        onChange={(e) => setNumberOfItems(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
        disabled={status === "loading"}
        aria-label="Number of items to practice"
        className="w-24 rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink disabled:opacity-60"
      />

      <div aria-live="polite">
        {status === "error" && (
          <p className="mt-4 rounded-sm border border-danger/30 bg-danger-tint px-3 py-2 text-sm text-danger">
            {errorMessage}
          </p>
        )}
      </div>

      <Button onClick={handleStart} disabled={status === "loading"} className="mt-6 w-full">
        {status === "loading" ? "Drawing cards…" : "Start practice"}
      </Button>
    </div>
  );
}
