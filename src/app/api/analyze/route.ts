import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { analyzeVocabInput, AIConfigError, AIResponseError } from "@/lib/ai/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

const requestSchema = z.object({
  input: z.string().trim().min(1, "Enter a word or phrase").max(200),
});

const RATE_LIMIT = 15; // requests
const RATE_WINDOW_MS = 60_000; // per minute, per user

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`analyze:${session.user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "You're looking things up a bit fast — try again in a moment." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeVocabInput(parsed.data.input);
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof AIConfigError) {
      return NextResponse.json(
        { error: "The AI isn't configured yet. Add GEMINI_API_KEY to your environment." },
        { status: 500 }
      );
    }
    if (error instanceof AIResponseError) {
      return NextResponse.json(
        { error: "Couldn't get a clear answer for that. Please try again." },
        { status: 502 }
      );
    }
    console.error("Unexpected error in /api/analyze:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
