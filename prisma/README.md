# Database notes

## Schema

See `schema.prisma` for the source of truth: `User`, `Word`, `Phrase`,
`PracticeSession`, plus `Difficulty` and `PracticeType` enums. Words and
phrases are intentionally in separate tables — see spec requirement #40.

## Migrations

`migrations/20250815000000_init/migration.sql` is the initial migration.
It was written by hand to match Prisma's own SQL conventions exactly,
then applied to and verified against a real local PostgreSQL 16 database
(tables, indexes, foreign keys, cascade deletes, and the per-user unique
constraints were all tested directly with `psql`).

It was created by hand — rather than via `npx prisma migrate dev` —
because the sandbox this project was built in only allows network access
to a fixed set of domains (npm, GitHub, PyPI, etc.) and not
`binaries.prisma.sh`, which is where Prisma's schema-engine binary is
downloaded from. That engine is required for `prisma migrate` / `prisma
generate` to run at all, in every current Prisma version.

**This is a constraint of the build sandbox only, not of your environment.**
On your own machine (or a normal CI/deploy target with full internet
access), Prisma will work exactly as usual:

```bash
# 1. Set DATABASE_URL in .env to a real Postgres connection string
# 2. Install deps — this also runs `prisma generate` via postinstall
npm install
# 3. Apply the migration that's already in this repo
npx prisma migrate deploy
# (or, if you want Prisma to manage/verify migration state interactively:)
npx prisma migrate dev
```

After that, `@prisma/client` will have full generated types for `User`,
`Word`, `Phrase`, and `PracticeSession` — right now, before `generate` has
been run, `@prisma/client` resolves to an untyped stub, so editors won't
show model autocomplete until you run the command above.

## Note on the lazy client (`src/lib/db/prisma.ts`)

The Prisma client export is wrapped in a `Proxy` that defers actually
constructing `PrismaClient` until the first real query, instead of at
import time. This is a reasonable pattern on its own merits (avoids
connecting to the DB for code paths that import `prisma` but never end up
querying it, e.g. an auth session check that doesn't hit the DB) — it also
happens to be why the app can build and route correctly in this sandbox
even before `prisma generate` has been run here: pages that don't query
the DB work today; anything that actually calls `prisma.*` will only work
once you've generated a real client per the steps above.

Every piece of Phase 3's actual auth *logic* (password hashing with
bcrypt, email lookup, correct/incorrect password verification, duplicate
email detection) was independently verified against this same local
Postgres database using the same queries the app runs, just issued
directly rather than through the ungenerated Prisma client — see the
Phase 3 continuation state for specifics.
