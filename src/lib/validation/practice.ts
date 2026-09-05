import { z } from "zod";

export const practiceRequestSchema = z.object({
  practiceType: z.enum(["words", "phrases", "mixed"]),
  numberOfItems: z.coerce.number().int().min(1, "Choose at least 1 item").max(20, "20 items max per session"),
});

export type PracticeRequest = z.infer<typeof practiceRequestSchema>;
