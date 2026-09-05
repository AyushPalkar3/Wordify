export type Difficulty = "beginner" | "intermediate" | "advanced";

export type WordMeaningEntry = {
  meaning: string;
  exampleSentence: string;
  partOfSpeech: string;
  context: string;
};

export type WordItem = {
  id: string;
  word: string;
  meaning: string;
  exampleSentence: string;
  partOfSpeech: string;
  difficulty: Difficulty;
  synonyms: string[];
  // Present only when the word has more than one distinct common meaning.
  // Absent/undefined means "one meaning" — use the fields above.
  meanings?: WordMeaningEntry[];
  createdAt: string;
};

export type PhraseItem = {
  id: string;
  phrase: string;
  meaning: string;
  exampleSentence: string;
  phraseType: string;
  difficulty: Difficulty;
  similarPhrases: string[];
  createdAt: string;
};
