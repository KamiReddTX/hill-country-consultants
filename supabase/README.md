# Supabase SQL — how to run these (read first)

**Your production database is already fully set up.** In normal operation you do
**not** re-run anything here. You only run a single new migration file when a
feature ships that needs one (I hand you that specific file and you paste it into
the Supabase SQL Editor once).

Everything in this folder is a **manual, one-at-a-time** script — nothing runs
automatically. That's why the guidance below matters.

---

## ⛔ Do NOT run these (disabled)

These are old "set up everything" monoliths that carry **weaker** security
policies than what's live now. They're kept only for reference / an intentional
from-scratch rebuild. Each one now **aborts immediately** if you paste it into the
SQL Editor, so it can't downgrade your security by accident:

- `schema.sql`
- `setup-all.sql`

To run one on purpose (only during a deliberate rebuild — see below), delete the
`DO $$ … $$;` guard block at the very top of the file first.

## Read-only helpers (safe, change nothing)

- `verify-rls-access.sql` — checks that row-level security is scoped correctly.
- `check-vault-write.sql` — checks the vault write policy is the strict one.

Run these anytime to confirm the database is healthy.

## The golden rule

The **security layer must be applied LAST.** These files define the strict
"a client/employee can only see what they should" policies, and they must run
*after* every table exists:

1. `team-model.sql` (defines `can_access_client()`, `is_privileged()`, etc.)
2. `strict-access.sql`
3. `vault-access.sql`
4. `role-array-fix.sql`
5. `security-fixes.sql`

If you ever run an older feature script after these, just re-run the five files
above and the database converges back to the correct, strict policies. (All
current migrations are idempotent — `create table if not exists`,
`drop policy if exists` — so re-running them is safe.)

---

## Rebuilding from scratch (rare)

Only if you're standing up a brand-new empty Supabase project:

1. Remove the guard block from `schema.sql` and run it first (creates the core
   tables).
2. Run every other feature migration in this folder (order among them doesn't
   matter — each is additive). Skip `setup-all.sql` (it duplicates the above).
3. Run the **security layer LAST**, in the order listed under "The golden rule."
4. Run `verify-rls-access.sql` to confirm isolation.

That's it. In day-to-day use you'll only ever run the occasional single new
migration file that ships with a feature.
