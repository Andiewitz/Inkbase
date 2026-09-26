# Post-mortem: flagged document/integrity remediation (2026-09-26)

## Summary

Remediated all 9 flagged areas from the 2026-09-26 full-repo audit as
commit-per-issue work on `main` (GP0–GP9 + this post-mortem), per the approved
`docs/plan.md`. Shipped: atomic compare-and-swap updates, non-destructive
409 recovery, bounded imports with explicit failure, metadata-only lists,
recoverable trash/restore, `db/` subpackage extraction, export hardening,
atomic quota + gated seeds, and docs-drift fixes. Full Go suite and Next.js
production build verified per goalpost.

## What was finished

- `docs(plan): add flagged-issue remediation plan` — `docs/plan.md` + audit-trail entry.
- `fix(documents): atomic compare-and-swap updates` — `UpdateConditional`
  (row-locked txn in Postgres, write-locked CAS in memory);
  `TestSyncConcurrentWritersSingleWinner` (20 racers → 1 win).
- `feat(editor): non-destructive conflict recovery` — 409 keeps backup and
  editor content; new `conflict-resolve.tsx` (Keep mine / Use server);
  badge reads "Conflict — action needed".
- `fix(documents): bounded safe import` — `validate-import.go`
  (10MB / 200-entry / 50MB / 1:100 caps); placeholder-success and silent txt
  fallback removed; handler caps body at 12MB, maps 400/413, generic 500.
- `perf(documents): metadata-only list` — `DocumentMeta` type (no `Content`
  field: compile-time guarantee); `Get` still returns bodies; no client
  change needed (optional `content` + excerpt fallback already existed).
- `feat(documents): recoverable trash and restore` — `deleted_at` soft
  delete; `POST /:id/restore`, `GET /documents?trash=1`; trash excluded
  from quota; owner-scoped.
- `refactor(documents): move persistence to db/` — history-preserving
  renames to `services/documents/db` (`docdb`); `errors.go` driver mapping;
  parent `types.go` aliases keep the public surface stable.
- `fix(security): sanitize export filenames` — allowlist stem, 80-rune cap,
  id fallback; generic export errors with server-side log.
- `fix(documents): atomic quota + gated seeds` — `CreateCapped`
  (memory single-lock / Postgres advisory-lock txn); seeds only with
  `SEED_DEMO=1` (`dev.sh` sets it; `.env.example` documents it).
- `chore(repo): docs drift` — Go 1.24→1.25 refs, boundaries table gains
  the `documents` row.

## Problems fixed (root → impact → fix → verification)

1. **TOCTOU in OCC** (`update.go` Get→compare→Update). Impact: concurrent
   writers silently overwrote each other. Fix: atomic `UpdateConditional`.
   Verified: 20-goroutine single-winner test + existing sync tests.
2. **Destructive 409 recovery** (`use-autosave.ts` cleared backup, forced
   server content). Impact: unsaved work destroyed on conflict. Fix:
   preserve-until-choice + resolver UI. Verified: `next lint` (zero new
   problems) + `next build` green.
3. **Unbounded import + fake success** (`io.ReadAll`, uncapped zip walks,
   `"Imported from X"` placeholder, txt fallback). Impact: ZIP-bomb DoS,
   failed imports masquerading as documents. Fix: bounds + explicit
   sentinel errors + strict format. Verified: 7-case `import_limits_test`
   plus HTTP 400/413 mapping (during which the suite caught a real
   stale-`err` shadowing bug — fixed before commit).
4. **Full-body list** (SELECT * equivalent in both stores). Impact: card
   grid paid body cost per doc. Fix: `DocumentMeta` without `Content`.
   Verified: wire-level no-`content`-key test with 1MB body (<100KB
   payload).
5. **Hard delete, no history**. Impact: accidents unrecoverable. Fix:
   `deleted_at` trash + restore + trash listing. Verified: roundtrip,
   idempotency, cross-user isolation, quota-release tests + HTTP mapping.
6. **DB code outside `db/`** (documents stores flat in service root, vs
   Rule 5). Impact: boundary violation, extraction friction. Fix: move to
   `db/` with aliases. Verified: build/vet green, no parent imports in
   `db/`, documents suite green.
7. **Export header injection + error leaks** (`filepath.Clean` on titles,
   `%v` internals to clients). Impact: CRLF/quote injection, info leak.
   Fix: allowlist sanitizer + generic 500s with server log. Verified:
   traversal/CRLF/quote/length/fallback cases via HTTP.
8. **Quota check-then-act + seeded store** (Count→Create race; unconditional
   user-1 fixtures). Impact: limit bypass under concurrency; test pollution
   + 2/3 quota consumed at boot. Fix: `CreateCapped`; `SEED_DEMO=1` gating.
   Verified: 8-racer quota test, empty/seeded store tests.
9. **Docs drift** (Go version refs, boundaries table missing `documents`).
   Fix: corrected refs. Note: the `@playwright/test` duplicate exists only
   on `feature/new-branch`, not `main` — left untouched as out of scope.

## Timeline

- Phase 1–5 (requirements → approved plan + goalposts): audit, deep review,
  approval gate.
- GP0–GP9 implementation in order, each: implement → targeted tests →
  full-suite record → commit. Two deviations from plan recorded below.
- Verification incident (rate-limiter flakes, stash-pop scare): investigated,
  recovered, documented; no silent workarounds.

## Deviations from plan (all surfaced, none silent)

- **Generic import-error mapping shipped in GP3 instead of GP7.** Touching
  the handler for body caps without closing the `%v` leak on the new error
  paths would have shipped a known leak. GP7 kept the export half.
- **Playwright dedupe not applied.** The duplicate lives on
  `feature/new-branch` (separate WIP line), not `main`. Editing across
  branches would have been scope creep; flagged for owner decision.

## Open items (awaiting developer decision)

1. **Pre-existing `TestRateLimit*` timing flakes.** `AuthExceededReturns429`
   / `TokenRefill` assume 10 bcrypt logins drain in <1s against a 1-token/s
   refill; under host load (~4) they intermittently 401 instead of 429.
   Proven unrelated (fails/passes independent of this work; passes on both
   trees when idle). Suggested fix: injectable password-hashing cost or a
   fake clock/limiter refill in tests — not implemented (out of scope).
2. **`wip-unrelated-landing` stash** (`stash@{0}`, from `feature/new-branch`
   landing WIP set aside for a clean tree). Preserved; needs owner
   disposition — reapply on its branch or drop.
3. **Pre-existing client lint errors** (`typing-effect` `any`, two
   `set-state-in-effect` in dashboard pages) + 6 warnings: untouched.
   GP2 added one scoped, justified `eslint-disable` (`preserve-manual-
   memoization` on `performSave`; manual identity is load-bearing for the
   Tiptap subscription — see code comment).
4. **Deferred by design:** revision history beyond trash/restore, source-file
   retention, fidelity warnings, CRDT collaboration (remediation Phases
   3–6 follow-ups); per-instance rate limiter (noted before); `server/api`
   stray untracked dir at repo root (pre-existing, unexamined).

## Lessons

- New failure-driven tests catch real bugs immediately: the sniff-path
  stale-`err` bug and the free-tier test collision both surfaced on first
  run — write the test before trusting the refactor.
- Timing-sensitive tests need injected clocks/costs; wall-clock + bcrypt
  assertions are load flakes waiting to happen.
- Verify which branch a finding lives on before fixing: Phase-2 reads on
  `feature/new-branch` nearly caused a cross-branch edit (playwright) and a
  dirty-tree push. `git worktree` proved the cleanest way to test a base
  commit without touching the working tree.
