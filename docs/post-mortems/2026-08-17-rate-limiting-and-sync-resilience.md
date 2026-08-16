# Post-mortem: Tiered Rate Limiting, Client Debouncing & Server Source-of-Truth Sync (#8-17-2026)

**Date:** 2026-08-17  
**Scope:** Rate Limiter Middleware (`internal/api/ratelimit.go`, `internal/api/server.go`), Documents Service Concurrency (`services/documents/update.go`), Client Auto-Save Sync Engine (`client/src/components/editor/use-autosave.ts`)  
**Author:** AI agent session, per developer request  
**Status:** Resolved — All fixes implemented, tested with 100% pass, and verified  

---

## 1. Executive Summary

During active document editing in the new manuscript editor, users encountered `429 Too Many Requests` errors when typing or navigating rapidly. Investigation revealed that the server wrapped all routes in a single universal token-bucket rate limiter with a strict burst capacity of 10 tokens and 1 token/sec refill rate. Real-time client saves and page navigations quickly exhausted this shared bucket.

Additionally, high-frequency uncoordinated client auto-saves posed a risk of overwhelming the server and causing silent data loss during concurrent multi-client/multi-tab editing.

A full architectural solution was designed and shipped:
1. **Tiered Rate Limiting:** Decoupled strict brute-force defense on auth routes from high-throughput application/document routes.
2. **Client-Side Debouncing & In-Flight Mutex:** Enforced a 1.5s keystroke debounce and single-flight request queue.
3. **Server as Source of Truth with Optimistic Concurrency:** Enforced `base_updated_at` checks on updates (`409 Conflict` + canonical document) ensuring stale writes are rejected and resynced without data loss.

---

## 2. Root Cause Analysis

### 2.1 Universal Blanket Rate Limiter
The server middleware previously applied a single `newLimiterStore()` across `http.NewServeMux()`:
- **Burst limit:** 10 tokens
- **Refill rate:** 1 token/sec (60 requests/min sustained)
- **Scope:** All routes (Auth, Documents, User info) keyed on the same client IP.

When a user typed in the editor while the client auto-saved, navigated back and forth, or refreshed the dashboard, the 10 burst tokens were drained within seconds. Subsequent requests to `/api/documents/:id` were rejected with `429 Too Many Requests`.

### 2.2 Lack of Optimistic Concurrency & Stale Overwrite Risk
Before this change, `PATCH /api/documents/:id` unconditionally overwrote document content on the server with whatever the client sent, regardless of whether a newer version existed on the server. If two tabs or devices edited the same document, the slower client would silently overwrite and destroy newer cloud edits.

---

## 3. What Was Done

| Layer | File(s) | Resolution |
|---|---|---|
| **Tiered Rate Limiter** | `server/internal/api/ratelimit.go`<br>`server/internal/api/server.go` | Created `AuthLimiter` (10 burst, 1/s refill) for `/api/auth/*` and `GeneralLimiter` (60 burst, 10/s refill) for `/api/documents/*` and `/api/auth/me`. Left `/api/health` unthrottled. |
| **Server Concurrency Guard** | `server/services/documents/models.go`<br>`server/services/documents/update.go`<br>`server/internal/api/documents.go` | Added `BaseUpdatedAt` to `UpdateRequest`. If `doc.UpdatedAt > BaseUpdatedAt`, the server rejects the stale write with `409 Conflict` and returns the canonical server document. Server is the strict source of truth. |
| **Client Debouncing & Mutex** | `client/src/components/editor/use-autosave.ts` | 1.5s keystroke debounce, in-flight mutex queue (no duplicate/parallel requests), local timestamped backup in `localStorage`, and automated resync on 409 conflict. |
| **Editor UI Integration** | `client/src/components/editor/rich-editor.tsx`<br>`client/src/components/editor/editor-shell.tsx` | Wired `initialServerUpdatedAt` and conflict reconciliation callback (`editor.commands.setContent`) with "Resynced with cloud" status indicator. |
| **Automated Test Suite** | `server/tests/sync_conflict_test.go`<br>`server/tests/ratelimit_test.go` | Comprehensive automated tests proving: stale writes rejected with 409, server canonical state preserved, resync completed with zero data loss, and general routes sustaining 30+ rapid bursts. |

---

## 4. Verification & Results

1. **Go Automated Tests:** Ran full test suite (`go test -v ./tests/...`) — **100% PASS** (25.1s).
   - `TestRateLimitAuthBurstAllowed` — PASS
   - `TestRateLimitAuthExceededReturns429` — PASS
   - `TestRateLimitGeneralBucketAllowsGenerousBurst` — PASS
   - `TestRateLimitHealthRouteUnthrottled` — PASS
   - `TestSyncServerSourceOfTruthRejectsStaleWrite` — PASS (Zero data loss verified)
   - `TestSyncResyncWorkflow` — PASS
   - `TestHTTPUpdateConflictEndpoint` — PASS
2. **Frontend Build:** `npm run build` compiled with 0 errors across all routes.
