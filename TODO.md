# TODO — Inkbase Audit Trail

This file is a living document. Append — never overwrite previous entries.

---

## 2026-08-10 — Harden authentication (JWT) per flagged issues

Developer approved fixing all flagged auth issues from the Phase 2 review,
highest priority first: prod secret enforcement, XFF/rate-limit bypass,
login timing leak, iss/aud claims, server-side logout (revocation), refresh
tokens, and a client-side auto-refresh seam.

### Goalposts

1. **GP1 — Prod `JWT_SECRET` fail-fast.** `jwtSecret()` returns an error when
   `APP_ENV=production` runs without a real secret; `NewService()` validates at
   boot. Removes the token-forgery risk from the hardcoded dev fallback.
2. **GP2 — `TRUST_PROXY` gating.** `clientIP()` in `ratelimit.go` only honors
   `X-Forwarded-For`/`X-Real-IP` when `TRUST_PROXY` is set, closing the
   rate-limit bypass via header spoofing. Documented in env guide.
3. **GP3 — Login timing equalizer.** Dummy bcrypt compare when the email is
   unknown so user enumeration via response timing is neutralized.
4. **GP4 — `iss`/`aud` claims.** Tokens stamped with issuer + audience and
   validated at verify time.
5. **GP5 — Server-side sessions.** New `sessions` table; `VerifyToken` becomes
   a service method that checks session existence; `RequireAuth` wired to the
   service; login/register create a session row per sign-in.
6. **GP6 — Real logout.** `logout.go` revokes the session server-side and the
   handler clears both cookies. Logged-out tokens die instantly instead of
   remaining valid for 24 h.
7. **GP7 — Refresh tokens.** Access JWT TTL drops to 15 min; opaque rotating
   refresh cookie (7 d) exchanged at `POST /api/auth/refresh` for a fresh
   access JWT + rotated refresh token. Replayed old refresh tokens are dead.
8. **GP8 — Client `apiFetch` wrapper.** 401 → `/api/auth/refresh` → retry once.
   Seam for future authenticated client calls (no authenticated consumer yet).
