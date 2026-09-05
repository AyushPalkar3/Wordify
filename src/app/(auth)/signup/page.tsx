"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { signupAction, type AuthActionState } from "@/lib/auth/actions";

const initialState: AuthActionState = undefined;

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, initialState);

  return (
    <div className="rounded-sm border border-rule bg-paper-card p-6">
      <h1 className="font-display text-2xl text-ink">Start your catalog</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Create an account to save words and phrases.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
            Name
          </span>
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
            Password
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink"
          />
          <span className="text-xs text-ink-soft">At least 8 characters.</span>
        </label>

        {state?.error && (
          <p
            role="alert"
            className="rounded-sm border border-danger/30 bg-danger-tint px-3 py-2 text-sm text-danger"
          >
            {state.error}
          </p>
        )}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating account…" : "Sign up"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/login" className="text-ink underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}
