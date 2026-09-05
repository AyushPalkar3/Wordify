import "server-only";
import { GoogleGenAI, ApiError, Type } from "@google/genai";
import { buildAnalyzePrompt } from "@/lib/ai/prompts/analyzePrompt";
import { buildPracticePrompt } from "@/lib/ai/prompts/practicePrompt";
import {
  analysisResultSchema,
  practiceSentencesResponseSchema,
  type AnalysisResult,
  type PracticeItemInput,
  type PracticeSentencesResponse,
} from "@/lib/ai/schemas";

// Model choice note: gemini-2.5-flash and gemini-2.5-flash-lite are both
// scheduled to shut down October 2026, so a new integration shouldn't
// default to either. gemini-3.5-flash-lite is the current-generation,
// free-tier-eligible model as of this migration (checked live — see
// continuation state). Override via GEMINI_MODEL if you want a different one.
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new AIConfigError(
      "GEMINI_API_KEY is not set. Add it to your .env file (see .env.example)."
    );
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export class AIConfigError extends Error {}
export class AIResponseError extends Error {}

const DIFFICULTY_ENUM = ["beginner", "intermediate", "advanced"];

// These JSON schemas exist purely to steer Gemini's structured output —
// analysisResultSchema (Zod, from schemas.ts) is still the actual source of
// truth and the only thing that decides whether a response is accepted.
const WORD_MEANING_ENTRY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    meaning: { type: Type.STRING },
    exampleSentence: { type: Type.STRING },
    partOfSpeech: { type: Type.STRING },
    context: { type: Type.STRING },
  },
  required: ["meaning", "exampleSentence", "partOfSpeech", "context"],
};

// Note: minItems/maxItems are real fields on Gemini's Schema type, but the
// SDK types them as strings (a quirk of the underlying proto format), not
// numbers — confirmed against @google/genai's own .d.ts.
const WORD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["word"] },
    word: { type: Type.STRING },
    meanings: {
      type: Type.ARRAY,
      items: WORD_MEANING_ENTRY_SCHEMA,
      minItems: "1",
      maxItems: "4",
    },
    difficulty: { type: Type.STRING, enum: DIFFICULTY_ENUM },
    synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["type", "word", "meanings", "difficulty", "synonyms"],
};

const PHRASE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["phrase"] },
    phrase: { type: Type.STRING },
    meaning: { type: Type.STRING },
    exampleSentence: { type: Type.STRING },
    phraseType: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: DIFFICULTY_ENUM },
    similarPhrases: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "type",
    "phrase",
    "meaning",
    "exampleSentence",
    "phraseType",
    "difficulty",
    "similarPhrases",
  ],
};

const ANALYSIS_RESPONSE_SCHEMA = {
  anyOf: [WORD_SCHEMA, PHRASE_SCHEMA],
};

const PRACTICE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    sentences: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          sentence: { type: Type.STRING },
        },
        required: ["id", "sentence"],
      },
    },
  },
  required: ["sentences"],
};

/**
 * Maps a raw Gemini SDK error into one of our two error types so callers
 * (API routes) can give the person an appropriate message without ever
 * seeing raw provider details.
 *
 * Uses the SDK's real ApiError.status (confirmed against @google/genai's
 * own type definitions) rather than guessing from message text, so this
 * correctly distinguishes:
 *   - 401/403 (invalid/missing API key) -> AIConfigError: "fix your setup"
 *   - 429 (rate limit or free-tier quota exhausted) -> AIResponseError:
 *     "try again shortly" — this is deliberately NOT auto-retried (spec #16)
 *   - everything else -> AIResponseError, generic
 */
function mapGeminiError(error: unknown): Error {
  if (error instanceof AIConfigError || error instanceof AIResponseError) {
    return error;
  }

  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return new AIConfigError(
        `Gemini rejected the API key (HTTP ${error.status}). Check GEMINI_API_KEY.`
      );
    }
    if (error.status === 429) {
      return new AIResponseError(
        "The AI is rate-limited or has run out of free-tier quota right now. Please try again in a moment."
      );
    }
    return new AIResponseError(`Gemini request failed (HTTP ${error.status}): ${error.message}`);
  }

  if (error instanceof Error) {
    return new AIResponseError(`Gemini request failed: ${error.message}`);
  }
  return new AIResponseError("Gemini request failed with an unknown error");
}

/**
 * Sends a word/phrase to Gemini, gets back a classification + full
 * analysis in one call, and validates the shape before returning it.
 * Never trust the raw response — always parse through Zod first (spec #37).
 */
export async function analyzeVocabInput(input: string): Promise<AnalysisResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new AIResponseError("Input must not be empty");
  }

  const { system, user } = buildAnalyzePrompt(trimmed);

  let raw: string | undefined;
  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_RESPONSE_SCHEMA,
        temperature: 0.3,
      },
    });
    raw = response.text;
  } catch (error) {
    throw mapGeminiError(error);
  }

  if (!raw) {
    throw new AIResponseError("The AI returned an empty response");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new AIResponseError("The AI response was not valid JSON");
  }

  parsedJson = synthesizePrimaryWordFields(parsedJson);

  const result = analysisResultSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new AIResponseError(
      `The AI response didn't match the expected shape: ${result.error.message}`
    );
  }

  return result.data;
}

/**
 * Gemini is only asked for a "meanings" array (see WORD_SCHEMA) — it never
 * duplicates that into top-level meaning/exampleSentence/partOfSpeech
 * fields itself. Those top-level fields still need to exist for backward
 * compatibility (the database columns, and any code that hasn't been
 * updated to look at "meanings"), so we derive them here from meanings[0]
 * before validation, rather than asking the model to produce redundant
 * data it could get inconsistent.
 */
function synthesizePrimaryWordFields(json: unknown): unknown {
  if (
    !json ||
    typeof json !== "object" ||
    (json as { type?: unknown }).type !== "word"
  ) {
    return json;
  }

  const meanings = (json as { meanings?: unknown }).meanings;
  if (!Array.isArray(meanings) || meanings.length === 0) {
    return json;
  }

  const primary = meanings[0] as {
    meaning?: unknown;
    exampleSentence?: unknown;
    partOfSpeech?: unknown;
  };

  return {
    ...json,
    meaning: primary.meaning,
    exampleSentence: primary.exampleSentence,
    partOfSpeech: primary.partOfSpeech,
  };
}

/**
 * Given the items drawn for a practice session, asks Gemini for one
 * fresh example sentence per item. Validates the shape and that every
 * requested id got a sentence back before returning.
 */
export async function generatePracticeSentences(
  items: PracticeItemInput[]
): Promise<PracticeSentencesResponse> {
  if (items.length === 0) {
    throw new AIResponseError("At least one item is required");
  }

  const { system, user } = buildPracticePrompt(items);

  let raw: string | undefined;
  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: PRACTICE_RESPONSE_SCHEMA,
        temperature: 0.7,
      },
    });
    raw = response.text;
  } catch (error) {
    throw mapGeminiError(error);
  }

  if (!raw) {
    throw new AIResponseError("The AI returned an empty response");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new AIResponseError("The AI response was not valid JSON");
  }

  const result = practiceSentencesResponseSchema.safeParse(parsedJson);
  if (!result.success) {
    throw new AIResponseError(
      `The AI response didn't match the expected shape: ${result.error.message}`
    );
  }

  const returnedIds = new Set(result.data.sentences.map((s) => s.id));
  const missing = items.filter((item) => !returnedIds.has(item.id));
  if (missing.length > 0) {
    throw new AIResponseError(
      `The AI didn't return a sentence for every item (missing ${missing.length})`
    );
  }

  return result.data;
}
