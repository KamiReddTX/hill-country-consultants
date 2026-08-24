# Supabase SQL — how this works (read first)

**Your production database is already fully set up.** In normal operation you do
**not** run anything in this folder. You only paste a single new migration file
into the Supabase SQL Editor when a feature ships that needs one (I hand you that
specific file).

## The one file that matters: `setup.sql`

`setup.sql` is the **canonical, validated, idempotent** full database build — the
single source of truth. It creates every table and function in the correct order
and applies the current **strict** row-level-security policies last. It was
verified by running it against a fresh Postgres (49 tables · 91 policies ·
17 functions), and it's safe to run more than once.

- **Fresh rebuild / new Supabase project:** paste all of `setup.sql` into the SQL
  Editor and run it. That's the whole database. (Supabase provides `pgcrypto` and
  the `auth`/`storage` schemas automatically.)
- **Existing production DB:** you don't need it — you're already set up.

## Everything else in this folder = historical migrations

The individual `*.sql` files are the migrations as they were applied over time,
kept for reference and git history. **You no longer run them one at a time** —
`setup.sql` already contains all of them, consolidated and in the right order.

## ⛔ Do NOT run these (disabled)

Two old "set up everything" monoliths carried **weaker** security than what's
live now. Each one **aborts immediately** if pasted into the SQL Editor, so it
can't downgrade security by accident:

- `schema.sql`
- `setup-all.sql`

(They're superseded by `setup.sql`. Ignore them.)

## Read-only helpers (safe, change nothing)

- `verify-rls-access.sql` — checks row-level security is scoped correctly.
- `check-vault-write.sql` — checks the vault write policy is the strict one.

Run these anytime to confirm the database is healthy.

---

### If an old script ever gets run by mistake

Because every current migration is idempotent, just re-run `setup.sql` (or, at
minimum, the security section: `team-model.sql` → `strict-access.sql` →
`vault-access.sql` → `role-array-fix.sql` → `security-fixes.sql`) and the
database converges back to the correct, strict policies.
