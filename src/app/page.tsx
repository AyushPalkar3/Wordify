import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { IndexCard } from "@/components/ui/IndexCard";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-rule px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-baseline gap-2">
          <span className="font-display text-xl italic text-ink">Lexicon</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">
            catalog
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-16 px-6 py-16 sm:py-24">
        <div className="max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-ink-soft">
            An English vocabulary catalog
          </p>
          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
            Every word you learn, <span className="italic text-word">filed</span>.
            <br />
            Every phrase you pick up, <span className="italic text-phrase">indexed</span>.
          </h1>
          <p className="mt-5 text-balance text-lg text-ink-soft">
            Look up any word or phrase, get a clear explanation, and file it into
            your personal catalog. Then practice with fresh, AI-written sentences
            whenever you&apos;re ready.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup">
              <Button variant="primary">Start your catalog</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Log in</Button>
            </Link>
          </div>
        </div>

        <div className="grid w-full gap-6 sm:grid-cols-2">
          <IndexCard kind="word" eyebrow="Adjective · Intermediate">
            <p className="font-display text-2xl text-ink">meticulous</p>
            <p className="mt-2 text-sm text-ink-soft">
              Very careful and precise about details.
            </p>
            <p className="mt-3 border-t border-rule-soft pt-3 font-sans text-sm italic text-ink-soft">
              &ldquo;She is meticulous when checking her work.&rdquo;
            </p>
          </IndexCard>
          <IndexCard kind="phrase" eyebrow="Idiom · Intermediate">
            <p className="font-display text-2xl text-ink">break the ice</p>
            <p className="mt-2 text-sm text-ink-soft">
              To make people feel more comfortable in an awkward situation.
            </p>
            <p className="mt-3 border-t border-rule-soft pt-3 font-sans text-sm italic text-ink-soft">
              &ldquo;He told a joke to break the ice at the meeting.&rdquo;
            </p>
          </IndexCard>
        </div>
      </main>

      <footer className="border-t border-rule px-6 py-6 text-center font-mono text-xs text-ink-soft">
        Lexicon — a personal catalog for English learners
      </footer>
    </div>
  );
}
