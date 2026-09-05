# Lexicon — AI English Vocabulary Catalog

A personal vocabulary-learning app. Look up any word or phrase, get an
AI-generated explanation, file it into your own catalog, and practice with
fresh AI-written example sentences whenever you're ready.

Built with Next.js (App Router), TypeScript, Tailwind CSS, PostgreSQL +
Prisma, NextAuth v5, and the Google Gemini API.

---

## Features

- **Look up words and phrases** — the AI decides which one it is and returns
  a meaning, example sentence, and related terms
- **Personal catalog** — saved words and phrases live in separate database
  tables (never mixed), with a tabbed library view (My Words / My Phrases / All)
- **Practice mode** — pick words, phrases, or both, choose how many, and get
  a fresh AI-written sentence for each, drawn randomly from your own catalog
- **Practice history** — every session is logged with what was drawn and the
  sentences generated for it
- **Accounts** — each user's catalog and history are completely private to them

---

## Prerequisites

- Node.js 20+
- A PostgreSQL database (local, or a hosted one — Supabase, Neon, Railway, etc. all work)
- A Google Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey) — free tier available)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

This also runs `prisma generate` automatically (via `postinstall`), which
generates the typed Prisma Client based on `prisma/schema.prisma`.

### 2. Configure environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:password@localhost:5432/lexicon` |
| `GEMINI_API_KEY` | Your Google Gemini API key — kept server-side only, never sent to the browser |
| `GEMINI_MODEL` | Optional. Defaults to `gemini-3.5-flash-lite` if unset |
| `AUTH_SECRET` | Secret used to sign session tokens. Generate one with `openssl rand -base64 32` |

### 3. Set up the database

The initial migration already exists at `prisma/migrations/20250815000000_init/`.
Apply it:

```bash
npx prisma migrate deploy
```

(Use `npx prisma migrate dev` instead if you want Prisma to manage/verify
migration state interactively during development.)

See `prisma/README.md` for more detail on the schema and how this migration
was built and verified.

### 4. Run the app

```bash
npm run dev
```

Visit `http://localhost:3000`, sign up for an account, and start looking up
words and phrases.

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run db:generate` | Regenerate the Prisma Client after a schema change |
| `npm run db:migrate` | Create/apply a migration in development |
| `npm run db:deploy` | Apply existing migrations (production-safe, non-interactive) |
| `npm run db:studio` | Open Prisma Studio to browse your database |

---

## Project structure

```
src/
  app/
    (auth)/login, signup          — public auth pages
    (main)/dashboard, library,    — authenticated app pages
           practice, history        (protected by src/proxy.ts)
    api/
      auth/[...nextauth]          — NextAuth route handlers
      analyze                     — AI word/phrase analysis
      words, words/[id]           — save/list/delete words
      phrases, phrases/[id]       — save/list/delete phrases
      practice/generate           — random selection + AI sentence generation
      practice/sessions           — practice history
  components/
    ui/                           — Button, Tag, IndexCard (design system)
    layout/                       — Navbar
    vocabulary/                   — LookupPanel, LibraryView, PracticeRunner
  lib/
    ai/                           — Gemini wrapper, prompts, response schemas
    auth/                         — NextAuth config, server actions
    db/                           — Prisma client singleton, error helpers
    validation/                   — Zod schemas for API input
    types/                        — shared client-safe types
  proxy.ts                        — route protection (Next.js 16's middleware convention)
prisma/
  schema.prisma                   — User, Word, Phrase, PracticeSession models
  migrations/                     — initial migration (see prisma/README.md)
```

Words and phrases are deliberately kept in separate database tables
(`words`, `phrases`) rather than one generic table — this is intentional
throughout the schema and API layer, not an oversight.

---

## Design

The visual language is a library card-catalog: saved words and phrases
render as index cards, color-coded consistently throughout the app — gold
for words, teal for phrases. Typefaces are self-hosted via `@fontsource`
(Fraunces for display text, IBM Plex Sans for UI, IBM Plex Mono for
catalog-style labels), so there's no runtime dependency on Google Fonts.

---

## AI Integration (Google Gemini)

### Getting a key

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Sign in with a Google account and click **Create API key**
3. Copy it into `GEMINI_API_KEY` in your `.env` file

No payment method is required to get started — see free-tier notes below.

### How it works

All Gemini calls live behind a single server-side module,
`src/lib/ai/gemini.ts` — nothing else in the app talks to Gemini directly,
and the key never reaches the browser (`import "server-only"` at the top of
that file enforces this at build time, not just by convention).

Two functions cover everything the app needs:

- **`analyzeVocabInput(input)`** — used by `POST /api/analyze`. Sends the
  word/phrase to Gemini with a JSON schema (built with the SDK's `Type`
  enum) that steers the model into returning either a *word* shape or a
  *phrase* shape — Gemini itself decides which one fits.
- **`generatePracticeSentences(items)`** — used by `POST /api/practice/generate`.
  Sends the list of saved items drawn for a session and asks for exactly one
  natural example sentence per item.

Both responses are parsed as JSON and then validated a second time through
Zod (`src/lib/ai/schemas.ts`) before anything is trusted or saved — the
Gemini-side schema keeps output *shaped* correctly most of the time, but the
Zod layer is what's actually enforced.

The prompt text itself lives in `src/lib/ai/prompts/`, split from the
provider code — `analyzePrompt.ts` and `practicePrompt.ts` build a
provider-neutral `{ system, user }` pair, which `gemini.ts` adapts into
Gemini's `systemInstruction` + `contents` call shape. This split is what
made it possible to migrate this app from OpenAI to Gemini by touching only
`gemini.ts` and two one-line import changes — the prompts, validation,
database, and UI never needed to change.

### Choosing a model

Defaults to `gemini-3.5-flash-lite` — fast, inexpensive, and currently
free-tier eligible. Override with `GEMINI_MODEL` in `.env` if you'd rather
use a different one (e.g. a `-flash` variant for higher-quality output at
higher cost). Whatever you pick needs to support structured JSON output via
`responseSchema`; check [Google's model list](https://ai.google.dev/gemini-api/docs/models)
if you're unsure, and avoid any model with an announced retirement date.

### Free-tier limitations

Google's free tier caps requests per minute and per day per model — these
limits are set by Google and are separate from this app's own internal
rate limiter (`src/lib/rate-limit.ts`, 15 lookups/min and 10 practice
sessions/min per user). If you hit Google's limit, `/api/analyze` and
`/api/practice/generate` will return a clear "try again shortly" message
rather than a raw error — see `AIResponseError` handling in `gemini.ts`.
Check current limits and your usage at [aistudio.google.com](https://aistudio.google.com).

---

## Troubleshooting

**"`@prisma/client` did not initialize yet"**
Run `npm install` (or `npx prisma generate` directly) with a real internet
connection. The Prisma Client is generated from your schema and needs to
download a small platform-specific engine the first time.

**Migration fails / schema drift warning**
If you're starting fresh, `npx prisma migrate deploy` should apply cleanly.
If you've manually changed the database outside of Prisma, you may need
`npx prisma migrate reset` (⚠️ this drops all data) or to resolve drift
manually — see [Prisma's migration docs](https://www.prisma.io/docs/orm/prisma-migrate).

**AI requests fail with a config error**
Double-check `GEMINI_API_KEY` is set in `.env` and that the key is valid —
see the AI Integration section above for how to get one.

**AI requests fail with a rate-limit/quota error**
See "Free-tier limitations" above — this is normal under heavy use and
resolves itself after a short wait.

**Google/social login**
Not implemented — this app uses email + password (NextAuth Credentials
provider) only.
