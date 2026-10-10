"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import {
  loginAction,
  signInWithGoogleAction,
  type AuthActionState,
} from "@/lib/auth/actions";

const initialState: AuthActionState = undefined;

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const [googleState, googleFormAction, isGooglePending] = useActionState(
    signInWithGoogleAction,
    initialState
  );

  return (
    <div className="rounded-sm border border-rule bg-paper-card p-6">
      <h1 className="font-display text-2xl text-ink">Log in</h1>
      <p className="mt-1 text-sm text-ink-soft">Welcome back to your catalog.</p>

      <form action={googleFormAction} className="mt-6">
        <Button
          type="submit"
          variant="secondary"
          disabled={isGooglePending}
          className="w-full"
        >
          <svg aria-hidden="true" viewBox="0 0 18 18" className="h-4 w-4 shrink-0">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.88 2.68-6.62Z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18Z"
            />
            <path
              fill="#FBBC05"
              d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33Z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
            />
          </svg>
          {isGooglePending ? "Connecting…" : "Continue with Google"}
        </Button>
        {googleState?.error && (
          <p
            role="alert"
            className="mt-2 rounded-sm border border-danger/30 bg-danger-tint px-3 py-2 text-sm text-danger"
          >
            {googleState.error}
          </p>
        )}
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-rule" />
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          or
        </span>
        <div className="h-px flex-1 bg-rule" />
      </div>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
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
            autoComplete="current-password"
            className="rounded-sm border border-rule bg-paper px-3 py-2 text-sm text-ink"
          />
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
          {isPending ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        No account yet?{" "}
        <Link href="/signup" className="text-ink underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </div>
  );
}
