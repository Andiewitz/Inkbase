# Post-mortem: Token Refresh Race Condition & Empty Dashboard State (#8-16-2026)

**Date:** 2026-08-16  
**Scope:** Client Auth Seam (`lib/api.ts`), Dashboard Lifecycle (`pages/dashboard.tsx`), Document Persistence (`services/documents/db.go`)  
**Author:** AI agent session, per developer request  
**Status:** Resolved — All fixes shipped, verified, and committed  

---

## 1. Summary

Users occasionally experienced a bug upon signing in where the dashboard mounted with an empty manuscript list and error banner. However, upon clicking the "+ New Manuscript" CTA or creating a blank document, the entire document library would suddenly reappear.

An investigation identified a multi-layered issue:
1. **Concurrent Token Refresh Collision:** Concurrent initial dashboard requests (`loadUser` and `loadDocuments`) both hit 401 when sessions refreshed, causing a race condition against rotating one-time refresh tokens.
2. **Missing In-Flight Mutex:** `apiFetch` lacked a single-flight promise lock, allowing multiple parallel refresh calls that invalidated session cookies.
3. **Fragile Empty State Grid:** When zero documents were returned due to transient errors, the dashboard swapped out the entire manuscript grid, hiding the persistent `NewDocumentCard` ("Import Document").
4. **Unseeded In-Memory Store during Local Dev:** Local backend restarts reset the in-memory document store to an empty map.

---

## 2. Root Cause Analysis

### 2.1 The Concurrent Refresh Race
In Inkbase, refresh tokens are strictly rotating and single-use (`services/auth`). When a user arrived on `/dashboard`, `dashboard.tsx` fired two simultaneous requests on mount:
- `GET /api/documents` via `loadDocuments()`
- `GET /api/auth/me` via `loadUser()`

When an access token expired:
1. Both requests received a `401 Unauthorized`.
2. Both requests simultaneously called `POST /api/auth/refresh`.
3. Request A reached the server first, validated the refresh token, and rotated it in SQLite/DynamoDB.
4. Request B reached the server milliseconds later with the already-used refresh token.
5. The server correctly identified an already-rotated token as potentially compromised, returning 401 and calling `clearSessionCookies()`.
6. Request B failed, leaving the client in an error state with an empty document list.

### 2.2 Re-fetch on User Action
When the user subsequently clicked "+ New Manuscript", `handleCreateBlank()` was executed as an isolated single request. The request refreshed the token cleanly without concurrency collisions and called `loadDocuments()`, immediately populating all manuscripts.

---

## 3. What was Done

| Component | What landed | Location |
|---|---|---|
| **Client API Seam** | Single-flight promise lock (`executeTokenRefresh`) ensuring all concurrent 401s share one in-flight refresh call | `client/src/lib/api.ts` |
| **Dashboard Page** | Sequential initialization (`loadUser().then(loadDocuments)`), error retry state, and persistent `NewDocumentCard` in empty states | `client/src/pages/dashboard.tsx` |
| **Document Store** | Dev seed data for user 1 in `NewMemoryStore()` so local restarts maintain workspace documents | `server/services/documents/db.go` |
| **Documentation** | Incident post-mortem recorded under `#8-16-2026` | `docs/post-mortems/2026-08-16-token-refresh-race-condition.md` |

---

## 4. Verification

1. **Go Test Suite:** Ran `go test ./tests/...` with 100% pass across all authentication, document, and session lifecycle tests.
2. **Frontend Production Build:** Ran `npm run build` with zero TypeScript or Turbopack errors.
3. **Manual Simulation:** Simulated multiple concurrent 401 requests; verified all callers await the same single token rotation and resolve successfully without cookie invalidation.
