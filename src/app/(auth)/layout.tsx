import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="mb-8 flex items-baseline gap-2">
        <span className="font-display text-2xl italic text-ink">Lexicon</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
          catalog
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
