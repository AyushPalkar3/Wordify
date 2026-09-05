/**
 * Describes the JSON shape ChatGPT/Gemini should return when the input is
 * classified as a WORD. Reused by analyzePrompt.ts. Kept in its own file
 * per project spec #38 so word-specific AI behavior can be tuned
 * independently of phrase behavior.
 *
 * Note: this only asks the model for "meanings" (an array). The top-level
 * "meaning"/"exampleSentence"/"partOfSpeech" fields that older code and the
 * database still rely on are synthesized in code from meanings[0] — the
 * model doesn't need to duplicate that itself.
 */
export const WORD_SHAPE_DESCRIPTION = `{
  "type": "word",
  "word": string,                 // the word itself, lowercase unless a proper noun
  "meanings": [                    // 1 to 4 entries — see rules below
    {
      "meaning": string,           // one clear, simple definition a learner can understand
      "exampleSentence": string,   // one natural sentence using the word with THIS meaning
      "partOfSpeech": string,      // e.g. "noun", "verb", "adjective" — for THIS meaning
      "context": string            // short label for when this meaning applies,
                                    // e.g. "Finance", "Technology", "People and places"
    }
  ],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "synonyms": string[]             // 2-4 close synonyms overall; [] if genuinely none fit
}

Rules for "meanings":
- Most words have exactly ONE common meaning a learner would use — return exactly
  one entry in that case. Do not invent extra meanings to pad the list.
- Only return multiple entries (up to 4) when the word has genuinely distinct,
  COMMONLY used meanings — e.g. "bank" (financial institution vs. river bank),
  "native" (person born somewhere vs. native language vs. native software).
- Do not include obscure, archaic, or highly specialized meanings unless they
  are genuinely common in everyday English.
- Each entry must be meaningfully distinct — do not split one meaning into
  near-duplicate entries just to have more than one.`;

export const WORD_EXAMPLE_SINGLE_MEANING = `{
  "type": "word",
  "word": "meticulous",
  "meanings": [
    {
      "meaning": "Very careful and precise about details.",
      "exampleSentence": "She is meticulous when checking her work.",
      "partOfSpeech": "adjective",
      "context": "General"
    }
  ],
  "difficulty": "intermediate",
  "synonyms": ["careful", "precise", "thorough"]
}`;

export const WORD_EXAMPLE_MULTIPLE_MEANINGS = `{
  "type": "word",
  "word": "native",
  "meanings": [
    {
      "meaning": "A person born in a particular place.",
      "exampleSentence": "He is a native of Mumbai.",
      "partOfSpeech": "noun",
      "context": "People and places"
    },
    {
      "meaning": "A language learned from birth or early childhood.",
      "exampleSentence": "Marathi is her native language.",
      "partOfSpeech": "adjective",
      "context": "Language"
    },
    {
      "meaning": "Designed specifically for a particular platform or system.",
      "exampleSentence": "This is a native Android application.",
      "partOfSpeech": "adjective",
      "context": "Technology"
    }
  ],
  "difficulty": "intermediate",
  "synonyms": ["local", "indigenous", "original"]
}`;
