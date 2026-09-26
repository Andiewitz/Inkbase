# Plan — Flagged document/integrity remediation (2026-09-26)

**Status:** Approved. Implementation is commit-per-issue on `main`.
**Source:** Full-repo audit 2026-09-26 (entire repo, high-level map).
**Trail:** `TODO.md` entry `2026-09-26 — Remediate flagged document/integrity issues per audit`.

## Scope

All 9 flagged areas. No new product surface. No CRDT collaboration
(remediation doc Phases 1–5 only; collaboration stays out of scope).

Non-goals: billing, auth redesign, landing redesign, multi-replica rate
limiting (still per-instance in-memory — documented, deferred).

## Problem-by-problem reasoning

### 1. Non-atomic OCC (read-check-write race)
- **Now:** `services/documents/update.go:20-30` Gets, compares
  `BaseUpdatedAt`, then `store.Update`. `postgres.go:127-153` is a blind
  `UPDATE ... WHERE user_id+id`. Two writers on one base both pass.
- **Fix:** Conditional write. Postgres: `UPDATE ... WHERE user_id=$1 AND id=$2
  AND updated_at=$3` (base timestamp); `RowsAffected==0` → re-Get to
  distinguish 404 vs 409, return canonical doc without mutating.
  MemoryStore: same compare under write lock, single critical section.
  `update.go` becomes thin delegation (fetch for 404 only, attempt CAS).
- **Accept:** 20 parallel same-base writers → exactly 1 success, 19×
  `ErrDocumentConflict`; survivor content intact.

### 2. Destructive 409 recovery (client)
- **Now:** `use-autosave.ts:109-117` clears `localStorage` backup and forces
  server content into editor on 409.
- **Fix:** Never auto-clear on 409. Keep `LocalDraftBackup`, set status
  `conflict`, expose both revisions in new `conflict-resolve.tsx`
  (Keep mine / Take server / Copy both). `rich-editor.tsx` applies only the
  chosen result. `editor-shell.tsx` only composes the UI.
- **Accept:** 409 leaves local HTML untouched and restorable after refresh.

### 3. Unbounded import + placeholder success
- **Now:** `internal/api/documents.go:73` 32MB form, `parse.go:20`
  `io.ReadAll` unbounded, zip entry walk uncapped (`parse.go:87-100`,
  `115+`). Unknown ext falls back to txt (`create.go:75-78`). Parse error
  returns `"Imported from X"` string as success (`parse.go:57-65`).
  Handler leaks internals (`documents.go:96` `%v`).
- **Fix:** New `validate-import.go` (one job: limits) — max 10MB raw,
  max 200 entries, max 50MB decompressed, max ratio 1:100, sniffed-format
  allowlist. `parse.go` uses `LimitReader` + capped zip open. `create.go`
  rejects unknown/unsupported ext (no txt fallback). Handler wraps
  `http.MaxBytesReader(12MB)`, returns generic `could not import file`.
- **Accept:** Oversized / bomb / empty / malformed → 4xx, zero docs created.

### 4. Full-body list
- **Now:** `postgres.go:97-124` + `memory.go:97-114` select full `content`;
  `handleListDocuments` returns it. Card grid pays body cost.
- **Fix:** `ListMeta` query without `content` (keep excerpt/word_count).
  `List` service returns meta; `Get` unchanged. Fix `dashboard.tsx` /
  `paper-preview.tsx` callers that read `list[].content`.
- **Accept:** 1MB-body doc → list payload without `content` key, <10KB.

### 5. Hard delete (unrecoverable)
- **Now:** `delete.go` + `postgres.go:155-164` hard `DELETE`.
- **Fix:** `deleted_at TIMESTAMPTZ NULL` migration. `trash.go` sets it;
  `restore.go` clears it (owner-scoped). `List`/`Count` exclude trashed;
  `Get` on trashed → `ErrDocumentNotFound` (→404). New thin handlers
  `POST /api/documents/{id}/restore`, `GET /api/documents?trash=1` optional.
  Trash excluded from free-tier count (documented decision).
- **Accept:** delete → hidden + 404; restore → identical id/content.

### 6. Documents DB outside `db/`
- **Now:** `services/documents/{db,memory,postgres}.go` flat. Violates
  `service-boundaries.md` Rule 5 (auth complies via `services/auth/db/`).
- **Fix:** Move to `services/documents/db/` (`db.go` interface+factory,
  `postgres.go`, `memory.go`, `errors.go`). Service API unchanged.
  Pure move + import rewiring; no behavior change.
- **Accept:** `go vet`, `go test ./...` green; no cross-service imports.

### 7. Export filename + error disclosure
- **Now:** `documents.go:248-253` `filepath.Clean(title)` + `%q` — Clean is
  path semantics, allows `../`, CRLF, quotes. `documents.go:96` leaks `%v`.
- **Fix:** Sanitize: allow `[A-Za-z0-9-_]+`, collapse rest to `_`, trim to
  80 chars, fallback to doc id. Log detail server-side, return generic
  `could not import file`.
- **Accept:** Hostile titles → safe `attachment; filename="..."`, no CRLF.

### 8. Free-tier check-then-act + seeded store
- **Now:** `create.go:27-33,65-72` Count→Create non-atomic; 5 concurrent
  creates exceed limit 3. `memory.go:17-65` always seeds 2 docs for user 1.
- **Fix:** Postgres: unique guard via transactional `SELECT COUNT ... FOR
  UPDATE` or conditional insert (documented in code); MemoryStore: same
  check under write lock covering Create+Import. Seeds only when
  `SEED_DEMO=1`, else empty store.
- **Accept:** 5 concurrent creates → ≤3 succeed; default test store empty.

### 9. Hygiene drift
- **Now:** `service-boundaries.md` omits `documents`; README/railway say Go
  1.24 vs `go.mod 1.25.0`; `client/package.json` has two
  `@playwright/test` entries.
- **Fix:** Update boundaries table, correct Go version refs, dedupe to
  `^1.63.0`. Docs-only.
- **Accept:** `rg` shows no stale version, `npm ls` single playwright.

## Commit map (each = test → commit → verify)

| # | Commit subject | Files |
|---|---|---|
| GP0 | `docs(plan): add flagged-issue remediation plan` | `docs/plan.md`, `TODO.md` |
| GP1 | `fix(documents): atomic compare-and-swap updates` | `update.go`, `postgres.go`, `memory.go`, `sync_conflict_test.go` |
| GP2 | `feat(editor): non-destructive conflict recovery` | `use-autosave.ts`, `conflict-resolve.tsx`, `editor-shell.tsx`, `rich-editor.tsx` |
| GP3 | `fix(documents): bounded safe import` | `validate-import.go`, `parse.go`, `create.go`, `internal/api/documents.go`, `import_limits_test.go` |
| GP4 | `perf(documents): metadata-only list` | `list.go`, `postgres.go`, `memory.go`, dashboard callers |
| GP5 | `feat(documents): recoverable trash and restore` | `trash.go`, `restore.go`, migration, handlers |
| GP6 | `refactor(documents): move persistence to db/` | `services/documents/db/` move |
| GP7 | `fix(security): sanitize export filename, generic errors` | `internal/api/documents.go` |
| GP8 | `fix(documents): atomic quota + gated seeds` | `create.go`, `memory.go` |
| GP9 | `chore(repo): docs drift + playwright dedupe` | `service-boundaries.md`, `architecture.md`, `package.json` |
| GP10 | `docs(post-mortem): 2026-09-26 document fixes` | `docs/post-mortems/2026-09-26-document-fixes.md`, `docs/README.md` |

## Test gates (per commit)

`go test ./...` from `server/`; `npm run lint && npm run build` from
`client/` for client-touching commits. Targeted tests per §Problem accept
lines above. Manual two-browser conflict + trash-restore rehearsal before
GP10 push.

## Service boundaries

New files live under `services/documents/` (one op each). Handlers stay
thin (parse → service → write). Nothing new in `shared/`. No
service-to-service imports. Each file answers its responsibility in one
sentence or it gets split.

## Push strategy

Work on `main` from a clean tree (unrelated landing WIP stashed on
`feature/new-branch`). One commit per goalpost after green gates. Push
`main` → `origin/main` after GP10. Post-mortem in existing
`docs/post-mortems/` (no new subdir per approval).
