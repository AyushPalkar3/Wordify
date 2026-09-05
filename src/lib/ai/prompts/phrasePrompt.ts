/**
 * Describes the JSON shape ChatGPT should return when the input is
 * classified as a PHRASE. Reused by analyzePrompt.ts. Kept in its own
 * file per project spec #38 so phrase-specific AI behavior can be tuned
 * independently of word behavior.
 */
export const PHRASE_SHAPE_DESCRIPTION = `{
  "type": "phrase",
  "phrase": string,                // the phrase itself, in its common form
  "meaning": string,                // one clear, simple explanation a learner can understand
  "exampleSentence": string,        // one natural sentence that uses the phrase correctly
  "phraseType": string,             // e.g. "idiom", "phrasal verb", "collocation", "expression"
  "difficulty": "beginner" | "intermediate" | "advanced",
  "similarPhrases": string[]        // 2-4 close alternatives; [] if genuinely none fit
}`;

export const PHRASE_EXAMPLE = `{
  "type": "phrase",
  "phrase": "break the ice",
  "meaning": "To make people feel more comfortable in a new or awkward situation.",
  "exampleSentence": "He told a joke to break the ice at the meeting.",
  "phraseType": "idiom",
  "difficulty": "intermediate",
  "similarPhrases": ["start a conversation", "make people comfortable"]
}`;
