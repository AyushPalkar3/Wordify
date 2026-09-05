-- Adds an optional structured "meanings" column to support words with
-- multiple distinct common meanings (e.g. "bank", "native", "light").
--
-- This is purely additive: existing rows get NULL for this column and are
-- completely unaffected. No existing column is altered, renamed, or
-- dropped. No data is migrated or at risk. Fully reversible by dropping
-- the column.

-- AlterTable
ALTER TABLE "words" ADD COLUMN "meanings" JSONB;
