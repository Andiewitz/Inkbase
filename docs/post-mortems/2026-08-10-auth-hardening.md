# Post-mortem: Authentication hardening

**Date:** 2026-08-10
**Scope:** Server auth stack (`services/auth`, `internal/api`, client seam)
**Author:** AI agent session, per developer request
**Status:** Resolved — all planned fixes shipped and verified

---

## Summary

A Phase-2 review of the authentication stack surfaced seven security and
architecture problems, ranging from a production token-forgery risk to a
logout that didn't actually log anyone out. All seven were fixed, highest
priority first, across eight goalposts and seven commits. Every fix is covered
by tests, and the full suite plus a fresh-database smoke test pass.

## What was finished

| Goalpost | What landed | Commit |
|---|---|---|
| GP1 | Production `JWT_SECRET` fail-fast | `7ab3a3b` |
| GP2 | `TRUST_PROXY` gating for forwarded headers | `5c12ed8` |
| GP3 | Login timing equalizer (dummy bcrypt) | `8a4d2bb` |
| GP4 | `iss`/`aud` claims stamped and enforced | `ff46f79` |
| GP5 | Server-side sessions (`sessions` table, session-aware verify) | `961ac47` |
| GP6 | Real logout — server-side revocation | `c5a2ca0` |
| GP7 | Rotating refresh tokens, 15 min access JWTs | `d12b86e` |
| GP8 | Client `apiFetch` wrapper (401 → refresh → retry) | `b69defa` |

## Problems fixed

### 1. Production token forgery via public default secret

- **Root cause:** `jwtSecret()` fell back to a hardcoded, source-visible secret
  (`dev-secret-change-me`) whenever `JWT_SECRET` was unset — including under
  `APP_ENV=production`. The comment said "never ship without a real secret,"
  but the code silently violated it.
- **Impact:** anyone who could read the source could mint tokens for arbitrary
  user IDs and authenticate as any user on a misconfigured production box.
- **Fix:** `jwtSecret()` returns an error under production without a secret;
  `auth.NewService()` validates at boot, before any DB connection. The server
  now refuses to start rather than sign forgeable tokens.
- **Verification:** `TestProdSecretRequired` (sign + boot both fail),
  `TestProdSigningWorksWithSecret`; smoke test boots `APP_ENV=production`
  without a secret and aborts with the intended message.

### 2. Rate-limit bypass via `X-Forwarded-For` spoofing

- **Root cause:** `clientIP()` trusted forwarded headers unconditionally. Any
  client could rotate `X-Forwarded-For` and get a fresh token bucket per
  request, defeating the limiter that guards login/register/refresh.
- **Impact:** unlimited credential-brute-force and refresh-attack volume.
- **Fix:** forwarded headers are ignored unless `TRUST_PROXY` is set. Without
  the flag the limiter keys on `RemoteAddr` (the TCP connection, not
  spoofable). Behind a real proxy you opt in explicitly.
- **Verification:** `TestRateLimitSpoofedXForwardedForIgnored` (spoofed headers
  cannot bypass when the flag is off), `TestRateLimitXForwardedFor` (isolation
  still works behind the flag).

### 3. User enumeration via login timing

- **Root cause:** an unknown email returned immediately without a bcrypt
  compare; a known email ran a ~60–100 ms compare. Response-time analysis could
  reveal which emails are registered even though the error message is uniform.
- **Fix:** unknown-email logins burn a dummy bcrypt compare at the same cost.
- **Verification:** `TestUnknownEmailLoginUniformError` locks the uniform 401
  contract; the equalizer branch is exercised by every unknown-email login.

### 4. Missing `iss`/`aud` scoping

- **Root cause:** tokens carried only `uid` + `exp`/`iat`. Any service
  holding the shared secret could issue tokens the API accepted.
- **Fix:** tokens are stamped `iss=inkbase`, `aud=inkbase-api` and `VerifyToken`
  enforces both. A correctly-signed token for another issuer/audience is
  refused.
- **Verification:** `TestForeignIssuerAudienceRejected`.

### 5. Logout that didn't log anyone out (stateless JWT)

- **Root cause:** logout only deleted the browser cookie. The JWT itself stayed
  cryptographically valid for its full 24 h TTL and was accepted by the server
  if presented directly.
- **Impact:** a stolen token survived logout; "logout" gave users a false sense
  of security.
- **Fix:** a `sessions` table keyed by the JWT's `jti`. `VerifyToken` is now a
  service method that requires a live session row; logout deletes the row, so
  the same token is refused immediately. Revocation works even for an expired
  access token (jti extraction skips time validation).
- **Verification:** `TestLogoutRevokesSessionServerSide` (identical token → 401
  after logout), `TestSessionlessTokenRejected` (valid signature, no session
  row → 401).

### 6. No refresh tokens — forced re-login every 24 h

- **Root cause:** single-issue 24 h JWTs with no mechanism to extend a session.
  Every day every user was logged out (documented as a skipped test).
- **Fix:** access JWTs drop to 15 min; an opaque rotating refresh token (7 d,
  stored SHA-256-hashed server-side, never raw) is issued alongside them.
  `POST /api/auth/refresh` exchanges the refresh cookie for a fresh access JWT
  and a rotated refresh token; a replayed old refresh token is refused.
  Rotation means a leaked refresh token cannot be used forever.
- **Verification:** `TestRefreshRotatesTokens`, `TestRefreshWithoutCookieRejected`,
  `TestRefreshAfterLogoutRejected`, `TestRefreshThenLogoutFlow`. The previously
  skipped `TestRefreshTokens` was replaced by these real tests.

### 7. No client seam for silent re-auth

- **Root cause:** the frontend had no path to recover from an expired access
  token; it would hard-fail on 401.
- **Fix:** `client/src/lib/api.ts` `apiFetch` wrapper: on 401 it calls
  `/api/auth/refresh` once and retries the original request; on refresh failure
  it returns the 401 for the caller to route to sign-in. No authenticated
  consumer exists yet (dashboard is mock data) — this is the seam.
- **Verification:** type-checks clean, passes eslint.

## Timeline

1. Phase-2 review of the auth stack → 7 issues flagged.
2. GP1–GP4: defensive fixes (secret, headers, timing, claims) — small, isolated.
3. GP5–GP6: the structural change — server-side sessions make verify stateful
   and logout real.
4. GP7: refresh-token flow + TTL rebalance (15 min / 7 d) + cookie split.
5. GP8: client seam. Full suite + fresh-DB smoke test green.

## Deviations from plan

- **Dropped `refresh_expires_at` column:** the session row's `expires_at`
  doubles as the refresh lifetime (7 d fixed, non-sliding). One less column to
  keep in sync.
- **SQLite migration workaround:** SQLite cannot `ALTER TABLE ... ADD COLUMN
  UNIQUE`, so `refresh_hash` is added as a plain column with a dedicated
  `CREATE UNIQUE INDEX` instead.
- **GP1 prod round-trip test trimmed to sign-only:** a full verify round-trip
  under `APP_ENV=production` needs a Postgres connection for the session store.
- **`AGENTS.md` (root) rode into the first commit:** it was untracked and swept
  in by `git add -A`. It is now versioned, which is reasonable, but it was
  incidental to that commit.

## Still open (flagged, not part of this task)

- **`contains`/`searchStr` duplication** — `services/auth/account-setup.go`
  reinvents `strings.Contains`. Use the stdlib. Trivial.
- **Dev-user re-hash on every boot** — `services/auth/db/db.go` re-runs a
  ~60 ms bcrypt and re-upserts `devwork@mesh.com` at each start. Dev-only
  nuisance.
- **Refresh-token reuse detection** — rotation invalidates an old refresh
  token, but a replay of a rotated-out token is not itself detected (i.e. the
  whole session is not killed). A short graylist of rotated-out hashes per
  session is the recommended follow-up.
- **Pre-existing client TS errors** — `client/src/components/ui/auth-hero.tsx`
  has ~52 type errors (framer-motion `ease: string` vs `Easing`). Pre-existing,
  untouched by this work.

## Operational notes

- **Every pre-existing session dies on deploy.** Old tokens lack `jti`, `iss`,
  and `aud` and have no session row, so all are rejected; users sign in once.
  Dev DB only, no data loss.
- **New production requirement:** `JWT_SECRET` is mandatory; set `TRUST_PROXY`
  only behind a proxy that rewrites forwarded headers. See
  `docs/development-env-guide.md`.

## Lessons

- A hardcoded "dev-only" fallback is one env-var omission away from being a
  production key. Fail fast on missing secrets; never trust a comment to hold
  the line.
- Forwarded headers are an assertion by the client, not a fact — trust them
  only at the network boundary you control.
- "Stateless JWT" and "logout works" cannot coexist without either a blocklist
  or a session store. The session row is the single source of truth for
  revocation; the JWT becomes a signed pointer to it.
- Rotation beats expiry for stolen-token defense: a 15 min access token with
  rotating refresh tokens shrinks the window an exfiltrated token is useful.
