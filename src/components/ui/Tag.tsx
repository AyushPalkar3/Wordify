export function Tag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "word" | "phrase";
}) {
  const toneClasses = {
    neutral: "border-rule text-ink-soft",
    word: "border-word/30 text-word bg-word-tint",
    phrase: "border-phrase/30 text-phrase bg-phrase-tint",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${toneClasses}`}
    >
      {children}
    </span>
  );
}
