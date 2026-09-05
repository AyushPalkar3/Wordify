import { ReactNode } from "react";

type Kind = "word" | "phrase";

const kindStyles: Record<Kind, { accent: string; tint: string; label: string }> = {
  word: { accent: "var(--word)", tint: "var(--word-tint)", label: "Word" },
  phrase: { accent: "var(--phrase)", tint: "var(--phrase-tint)", label: "Phrase" },
};

export function IndexCard({
  kind,
  eyebrow,
  children,
  className = "",
}: {
  kind: Kind;
  /** small typewriter-style meta line, e.g. "ADJECTIVE · INTERMEDIATE" */
  eyebrow?: string;
  children: ReactNode;
  className?: string;
}) {
  const styles = kindStyles[kind];
  return (
    <div
      className={`relative rounded-sm border bg-paper-card shadow-[2px_3px_0_0_var(--rule)] transition-transform hover:-translate-y-0.5 hover:shadow-[3px_5px_0_0_var(--rule)] ${className}`}
      style={{ borderColor: "var(--rule)" }}
    >
      {/* hole-punch dot */}
      <span
        aria-hidden
        className="absolute left-3 top-3 h-2 w-2 rounded-full"
        style={{ backgroundColor: "var(--paper)", boxShadow: "inset 0 0 0 1px var(--rule)" }}
      />
      {/* colored tab denoting word vs phrase */}
      <span
        aria-hidden
        className="absolute -top-2 right-4 rounded-t-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-paper-card"
        style={{ backgroundColor: styles.accent }}
      >
        {styles.label}
      </span>
      <div className="px-5 pb-5 pt-6">
        {eyebrow && (
          <p
            className="mb-1 font-mono text-[11px] uppercase tracking-wider"
            style={{ color: styles.accent }}
          >
            {eyebrow}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
