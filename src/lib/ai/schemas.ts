import { z } from "zod";

export const difficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export const wordMeaningEntrySchema = z.object({
  meaning: z.string().trim().min(1),
  exampleSentence: z.string().trim().min(1),
  partOfSpeech: z.string().trim().min(1),
  context: z.string().trim().min(1),
});

export const wordAnalysisSchema = z.object({
  type: z.literal("word"),
  word: z.string().trim().min(1),
  // Primary meaning — always present, unchanged from before this feature.
  // Existing saved words and any code that only reads these three fields
  // keep working without modification. When a word has multiple common
  // meanings, this is a synthesized copy of meanings[0].
  meaning: z.string().trim().min(1),
  exampleSentence: z.string().trim().min(1),
  partOfSpeech: z.string().trim().min(1),
  difficulty: difficultySchema,
  synonyms: z.array(z.string().trim().min(1)).max(6).default([]),
  // New, optional: the full set of distinct meanings (1-4) when a word has
  // more than one common meaning a learner would actually encounter.
  // Absent/undefined is equivalent to "one meaning" and callers should
  // fall back to the primary meaning/exampleSentence/partOfSpeech above.
  meanings: z.array(wordMeaningEntrySchema).min(1).max(4).optional(),
});

export const phraseAnalysisSchema = z.object({
  type: z.literal("phrase"),
  phrase: z.string().trim().min(1),
  meaning: z.string().trim().min(1),
  exampleSentence: z.string().trim().min(1),
  phraseType: z.string().trim().min(1),
  difficulty: difficultySchema,
  similarPhrases: z.array(z.string().trim().min(1)).max(6).default([]),
});

// The model decides for itself whether the input is a word or a phrase;
// this discriminated union is what lets us safely branch on that after
// the fact and route the result into the right table (see spec #31, #37).
export const analysisResultSchema = z.discriminatedUnion("type", [
  wordAnalysisSchema,
  phraseAnalysisSchema,
]);

export type WordMeaningEntry = z.infer<typeof wordMeaningEntrySchema>;
export type WordAnalysis = z.infer<typeof wordAnalysisSchema>;
export type PhraseAnalysis = z.infer<typeof phraseAnalysisSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

// --- Practice sentence generation -------------------------------------

export const practiceItemInputSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["word", "phrase"]),
  text: z.string().min(1),
});

export type PracticeItemInput = z.infer<typeof practiceItemInputSchema>;

export const practiceSentencesResponseSchema = z.object({
  sentences: z
    .array(
      z.object({
        id: z.string().min(1),
        sentence: z.string().trim().min(1),
      })
    )
    .min(1),
});

export type PracticeSentencesResponse = z.infer<typeof practiceSentencesResponseSchema>;
