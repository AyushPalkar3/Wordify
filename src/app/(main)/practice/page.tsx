import { PracticeRunner } from "@/components/vocabulary/PracticeRunner";

export default function PracticePage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">Practice</p>
        <h1 className="mt-1 font-display text-3xl text-ink">Draw some cards</h1>
        <p className="mt-2 text-ink-soft">
          Pick what to practice and how many. The system will pull random
          items from your catalog and write a fresh sentence for each.
        </p>
      </div>

      <PracticeRunner />
    </div>
  );
}
