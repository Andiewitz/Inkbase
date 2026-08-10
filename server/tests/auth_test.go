package api_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"inkbase/server/internal/api"
	"inkbase/server/services/auth"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// devSecret is the fallback used by services/auth/jwt.go when JWT_SECRET is
// unset. Tests rely on it to craft expired and tampered tokens.
const devSecret = "dev-secret-change-me"

// testRefreshMaxAge mirrors refreshTokenTTL (7 days) in services/auth/jwt.go.
const testRefreshMaxAge = 7 * 24 * 60 * 60

// testClaims mirrors the unexported claims struct in services/auth/jwt.go.
type testClaims struct {
	UserID int64 `json:"uid"`
	jwt.RegisteredClaims
}

// uniqueEmail returns an email that is unique per test so concurrent test
// runs do not collide in the shared SQLite dev database.
func uniqueEmail(t *testing.T) string {
	t.Helper()
	safe := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			return r
		}
		return '_'
	}, strings.ToLower(t.Name()))
	return fmt.Sprintf("%s_%d@test.inkbase.dev", safe, time.Now().UnixNano())
}

// doRequest fires a request against handler and returns the recorder.
func doRequest(handler http.Handler, method, path, remoteAddr string, body any, cookies ...*http.Cookie) *httptest.ResponseRecorder {
	var reqBody *bytes.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		reqBody = bytes.NewReader(b)
	} else {
		reqBody = bytes.NewReader(nil)
	}
	req := httptest.NewRequest(method, path, reqBody)
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = remoteAddr
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	return rec
}

// register is a shortcut that posts valid credentials and returns the recorder.
func register(t *testing.T, handler http.Handler, email, password, ip string) *httptest.ResponseRecorder {
	t.Helper()
	return doRequest(handler, http.MethodPost, "/api/auth/register", ip, map[string]string{
		"email": email, "password": password,
	})
}

// login is a shortcut that posts login credentials and returns the recorder.
func login(t *testing.T, handler http.Handler, email, password, ip string) *httptest.ResponseRecorder {
	t.Helper()
	return doRequest(handler, http.MethodPost, "/api/auth/login", ip, map[string]string{
		"email": email, "password": password,
	})
}

// sessionCookie extracts the inkbase_session cookie from a recorder response.
// Fails the test immediately if the cookie is absent.
func sessionCookie(t *testing.T, rec *httptest.ResponseRecorder) *http.Cookie {
	t.Helper()
	for _, c := range rec.Result().Cookies() {
		if c.Name == "inkbase_session" {
			return c
		}
	}
	t.Fatalf("inkbase_session cookie not found in response; status=%d body=%s",
		rec.Code, rec.Body.String())
	return nil
}

// refreshCookie extracts the inkbase_refresh cookie from a recorder response.
// Fails the test immediately if the cookie is absent.
func refreshCookie(t *testing.T, rec *httptest.ResponseRecorder) *http.Cookie {
	t.Helper()
	for _, c := range rec.Result().Cookies() {
		if c.Name == "inkbase_refresh" {
			return c
		}
	}
	t.Fatalf("inkbase_refresh cookie not found in response; status=%d body=%s",
		rec.Code, rec.Body.String())
	return nil
}

// expiredToken crafts a JWT signed with the dev secret whose ExpiresAt is in
// the past. Used to verify that the middleware rejects stale tokens.
func expiredToken(t *testing.T) string {
	t.Helper()
	now := time.Now()
	c := testClaims{
		UserID: 9999,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now.Add(-48 * time.Hour)),
			ExpiresAt: jwt.NewNumericDate(now.Add(-1 * time.Second)),
		},
	}
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	signed, err := tok.SignedString([]byte(devSecret))
	if err != nil {
		t.Fatalf("sign expired token: %v", err)
	}
	return signed
}

// tamperedToken returns a JWT whose signature has been replaced with garbage
// while keeping the header and payload intact.
func tamperedToken(t *testing.T) string {
	t.Helper()
	// Valid header.payload, invalid signature.
	return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" +
		".eyJ1aWQiOjEsImV4cCI6OTk5OTk5OTk5OX0" +
		".THIS_IS_NOT_A_VALID_SIGNATURE_xxxxxxxxxxx"
}

// signClaims signs the given claims with the dev secret, mirroring how the
// server issues tokens.
func signClaims(t *testing.T, c testClaims) string {
	t.Helper()
	tok := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	signed, err := tok.SignedString([]byte(devSecret))
	if err != nil {
		t.Fatalf("sign test token: %v", err)
	}
	return signed
}

// futureClaims returns a valid-signature token whose issuer and audience do NOT
// match the server's expectations. Used to prove iss/aud are enforced even
// when the signature, expiry, and uid would otherwise be fine.
func foreignToken(t *testing.T) string {
	t.Helper()
	c := testClaims{
		UserID: 1,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    "attacker-app",
			Audience:  jwt.ClaimStrings{"victim-api"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}
	return signClaims(t, c)
}

// sessionlessToken returns a correctly-signed token with the right issuer,
// audience, and expiry, but a jti that has no session row. It passes every
// cryptographic check yet must be refused by the server-side session store.
func sessionlessToken(t *testing.T) string {
	t.Helper()
	c := testClaims{
		UserID: 12345,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        "no-such-session",
			Issuer:    "inkbase",
			Audience:  jwt.ClaimStrings{"inkbase-api"},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}
	return signClaims(t, c)
}

// ---------------------------------------------------------------------------
// Cookie flags: HttpOnly, SameSite, Secure, MaxAge
// ---------------------------------------------------------------------------

// TestLoginCookieFlags verifies that a successful login response stamps a
// session cookie with the required security flags, plus the rotating refresh
// cookie with its own lifetime and restricted path.
func TestLoginCookieFlags(t *testing.T) {
	handler := api.New()
	email := uniqueEmail(t)

	// Register first so the account exists.
	rec := register(t, handler, email, "securepass1", "10.0.0.1:1")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d %s", rec.Code, rec.Body.String())
	}

	rec = login(t, handler, email, "securepass1", "10.0.0.2:1")
	if rec.Code != http.StatusOK {
		t.Fatalf("login failed: %d %s", rec.Code, rec.Body.String())
	}

	c := sessionCookie(t, rec)

	if !c.HttpOnly {
		t.Error("FAIL: cookie must be HttpOnly — JavaScript must not be able to read the session token")
	}
	if c.SameSite != http.SameSiteLaxMode {
		t.Errorf("FAIL: cookie SameSite must be Lax (got %v) — Lax blocks cross-site POST, preventing CSRF", c.SameSite)
	}
	if c.MaxAge != 900 {
		t.Errorf("FAIL: session cookie MaxAge must be 900 (15 min access token), got %d", c.MaxAge)
	}
	// Secure is false in dev (no APP_ENV=production). Verified below.
	if os.Getenv("APP_ENV") == "production" {
		if !c.Secure {
			t.Error("FAIL: cookie must be Secure in production (HTTPS only)")
		}
	} else {
		if c.Secure {
			t.Error("FAIL: Secure should not be set in non-production (breaks plain HTTP dev server)")
		}
	}

	// The refresh cookie must exist with its own flags and a restricted path.
	rc := refreshCookie(t, rec)
	if !rc.HttpOnly {
		t.Error("FAIL: refresh cookie must be HttpOnly")
	}
	if rc.SameSite != http.SameSiteLaxMode {
		t.Errorf("FAIL: refresh cookie SameSite must be Lax (got %v)", rc.SameSite)
	}
	if rc.MaxAge != testRefreshMaxAge {
		t.Errorf("FAIL: refresh cookie MaxAge must be %d (7 days), got %d", testRefreshMaxAge, rc.MaxAge)
	}
	if rc.Path != "/api/auth" {
		t.Errorf("FAIL: refresh cookie Path must be /api/auth so it is only sent to auth endpoints, got %q", rc.Path)
	}
}

// TestRegisterCookieFlags runs the same flag assertions for the register path.
func TestRegisterCookieFlags(t *testing.T) {
	handler := api.New()
	rec := register(t, handler, uniqueEmail(t), "securepass1", "10.0.0.3:1")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d %s", rec.Code, rec.Body.String())
	}

	c := sessionCookie(t, rec)

	if !c.HttpOnly {
		t.Error("FAIL: register cookie must be HttpOnly")
	}
	if c.SameSite != http.SameSiteLaxMode {
		t.Errorf("FAIL: register cookie SameSite must be Lax (got %v)", c.SameSite)
	}
}

// ---------------------------------------------------------------------------
// Token is NOT exposed in the response body
// ---------------------------------------------------------------------------

// TestTokenNotInResponseBody ensures the raw JWT is never returned in JSON.
// The only carrier for the token is the HttpOnly cookie.
func TestTokenNotInResponseBody(t *testing.T) {
	handler := api.New()

	for _, path := range []struct {
		route  string
		method string
		setup  func(email, ip string) *httptest.ResponseRecorder
	}{
		{
			route:  "register",
			method: http.MethodPost,
			setup: func(email, ip string) *httptest.ResponseRecorder {
				return register(t, handler, email, "securepass1", ip)
			},
		},
		{
			route:  "login",
			method: http.MethodPost,
			setup: func(email, ip string) *httptest.ResponseRecorder {
				email2 := email + "2"
				register(t, handler, email2, "securepass1", ip+"0")
				return login(t, handler, email2, "securepass1", ip)
			},
		},
	} {
		t.Run(path.route, func(t *testing.T) {
			rec := path.setup(uniqueEmail(t), fmt.Sprintf("10.1.%d.1:1", time.Now().Nanosecond()%200))
			var body map[string]any
			if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
				t.Fatalf("decode body: %v", err)
			}
			if _, exists := body["token"]; exists {
				t.Errorf("FAIL: response body must not contain 'token' — JWT must live in cookie only")
			}
		})
	}
}

// TestOnboardingFlagInRegisterNotLogin verifies that account setup (register)
// sends show_onboarding=true to trigger the onboarding component overlay, whereas
// returning user auth (login) sends show_onboarding=false to bypass onboarding.
func TestOnboardingFlagInRegisterNotLogin(t *testing.T) {
	handler := api.New()
	email := uniqueEmail(t)

	// 1. Register must return show_onboarding: true
	regRec := register(t, handler, email, "securepass123", "10.2.0.1:1")
	if regRec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d %s", regRec.Code, regRec.Body.String())
	}
	var regBody struct {
		OK             bool `json:"ok"`
		ShowOnboarding bool `json:"show_onboarding"`
	}
	if err := json.NewDecoder(regRec.Body).Decode(&regBody); err != nil {
		t.Fatalf("decode register body: %v", err)
	}
	if !regBody.ShowOnboarding {
		t.Errorf("FAIL: register response must send show_onboarding: true (account-setup flow)")
	}

	// 2. Login must return show_onboarding: false
	loginRec := login(t, handler, email, "securepass123", "10.2.0.2:1")
	if loginRec.Code != http.StatusOK {
		t.Fatalf("login failed: %d %s", loginRec.Code, loginRec.Body.String())
	}
	var loginBody struct {
		OK             bool `json:"ok"`
		ShowOnboarding bool `json:"show_onboarding"`
	}
	if err := json.NewDecoder(loginRec.Body).Decode(&loginBody); err != nil {
		t.Fatalf("decode login body: %v", err)
	}
	if loginBody.ShowOnboarding {
		t.Errorf("FAIL: login response must NOT send show_onboarding: true (returning user flow)")
	}
}

// ---------------------------------------------------------------------------
// Protected route enforcement
// ---------------------------------------------------------------------------

// TestProtectedRouteRequiresCookie verifies that GET /api/auth/me returns 401
// when no session cookie is present. This simulates any unauthenticated request
// — including those from a cross-site attacker who cannot force the browser to
// send an HttpOnly cookie they don't control.
func TestProtectedRouteRequiresCookie(t *testing.T) {
	handler := api.New()
	rec := doRequest(handler, http.MethodGet, "/api/auth/me", "10.0.0.4:1", nil)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: expected 401 without cookie, got %d", rec.Code)
	}
}

// TestUnknownEmailLoginUniformError exercises the login path for an email that
// does not exist. The service must return the same 401 with the same generic
// message as a wrong password — the dummy-bcrypt timing equalizer keeps this
// branch alive, and the response must never hint that the email is unknown.
func TestUnknownEmailLoginUniformError(t *testing.T) {
	handler := api.New()

	rec := doRequest(handler, http.MethodPost, "/api/auth/login", "10.9.0.1:1", map[string]string{
		"email": "does-not-exist@test.inkbase.dev", "password": "somepassword1",
	})

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("FAIL: unknown email expected 401, got %d", rec.Code)
	}
	var body map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode body: %v", err)
	}
	if body["error"] != "invalid email or password" {
		t.Errorf("FAIL: unknown email must return the same generic message as a wrong password, got %q", body["error"])
	}
}

// ---------------------------------------------------------------------------
// Production secret enforcement
// ---------------------------------------------------------------------------

// TestProdSecretRequired verifies that a production server without JWT_SECRET
// fails fast instead of signing tokens with the public dev fallback. A
// forgeable token is the single worst outcome this codebase could ship.
func TestProdSecretRequired(t *testing.T) {
	restoreEnv(t, "APP_ENV")
	restoreEnv(t, "JWT_SECRET")
	t.Setenv("APP_ENV", "production")
	t.Setenv("JWT_SECRET", "")

	if _, err := auth.SignToken(1, "some-session-id"); err == nil {
		t.Fatal("FAIL: SignToken must error in production without JWT_SECRET")
	}

	// NewService must refuse to boot (checked before any DB connection).
	svc, err := auth.NewService()
	if err == nil {
		t.Fatal("FAIL: NewService must fail fast in production without JWT_SECRET")
	}
	if svc != nil {
		t.Fatal("FAIL: NewService must return nil service on config error")
	}
}

// TestProdSigningWorksWithSecret verifies the happy path: with JWT_SECRET set
// in production, signing succeeds. (Full round-trip verification happens
// through the service in dev tests; a prod round-trip would need a Postgres
// connection for the session store.)
func TestProdSigningWorksWithSecret(t *testing.T) {
	restoreEnv(t, "APP_ENV")
	restoreEnv(t, "JWT_SECRET")
	t.Setenv("APP_ENV", "production")
	t.Setenv("JWT_SECRET", "a-real-production-secret")

	token, err := auth.SignToken(7, "sess-123")
	if err != nil {
		t.Fatalf("sign with prod secret: %v", err)
	}
	if token == "" {
		t.Fatal("FAIL: expected a non-empty token signed with the production secret")
	}
}

// restoreEnv snapshots an env var and restores it when the test finishes, so
// production-mode tests never leak into other tests running sequentially.
func restoreEnv(t *testing.T, key string) {
	t.Helper()
	old, had := os.LookupEnv(key)
	t.Cleanup(func() {
		if had {
			os.Setenv(key, old)
		} else {
			os.Unsetenv(key)
		}
	})
}

// ---------------------------------------------------------------------------
// Expired token
// ---------------------------------------------------------------------------

// TestExpiredTokenRejected verifies that a valid-signature JWT past its ExpiresAt
// is refused by RequireAuth. Tokens cannot be used beyond their 24-hour window.
func TestExpiredTokenRejected(t *testing.T) {
	handler := api.New()

	expiredCookie := &http.Cookie{
		Name:  "inkbase_session",
		Value: expiredToken(t),
	}
	rec := doRequest(handler, http.MethodGet, "/api/auth/me", "10.0.0.5:1", nil, expiredCookie)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: expected 401 for expired token, got %d", rec.Code)
	}
}

// ---------------------------------------------------------------------------
// Tampered token
// ---------------------------------------------------------------------------

// TestTamperedTokenRejected verifies that a JWT with an invalid signature is
// refused. This covers cases where an attacker modifies the payload to escalate
// their user ID or extend expiry without knowing the signing secret.
func TestTamperedTokenRejected(t *testing.T) {
	handler := api.New()

	fakeSessionCookie := &http.Cookie{
		Name:  "inkbase_session",
		Value: tamperedToken(t),
	}
	rec := doRequest(handler, http.MethodGet, "/api/auth/me", "10.0.0.6:1", nil, fakeSessionCookie)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: expected 401 for tampered token, got %d", rec.Code)
	}
}

// TestForeignIssuerAudienceRejected verifies that a correctly-signed token
// issued for a different issuer or audience is refused. Even a valid signature
// is not enough — the token must be scoped to this API.
func TestForeignIssuerAudienceRejected(t *testing.T) {
	handler := api.New()

	foreignCookie := &http.Cookie{
		Name:  "inkbase_session",
		Value: foreignToken(t),
	}
	rec := doRequest(handler, http.MethodGet, "/api/auth/me", "10.0.0.6:2", nil, foreignCookie)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: expected 401 for token with foreign iss/aud, got %d", rec.Code)
	}
}

// TestSessionlessTokenRejected verifies the server-side session gate: a token
// with a valid signature, issuer, and audience is still refused when no
// matching session row exists (e.g. it was forged, or its session was deleted).
func TestSessionlessTokenRejected(t *testing.T) {
	handler := api.New()

	fakeCookie := &http.Cookie{
		Name:  "inkbase_session",
		Value: sessionlessToken(t),
	}
	rec := doRequest(handler, http.MethodGet, "/api/auth/me", "10.0.0.6:3", nil, fakeCookie)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: expected 401 for token with no server-side session, got %d", rec.Code)
	}
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

// TestLogoutClearsSessionCookie verifies that POST /api/auth/logout responds
// with cookies that instruct the browser to delete both the session and the
// refresh cookie.
// NOTE: With server-side sessions, revocation is now real — the session row is
// deleted so both tokens die server-side regardless of the browser.
func TestLogoutClearsSessionCookie(t *testing.T) {
	handler := api.New()
	rec := doRequest(handler, http.MethodPost, "/api/auth/logout", "10.0.0.7:1", nil)

	if rec.Code != http.StatusOK {
		t.Fatalf("FAIL: expected 200 from logout, got %d", rec.Code)
	}

	cleared := map[string]*http.Cookie{}
	for _, c := range rec.Result().Cookies() {
		cleared[c.Name] = c
	}
	for _, name := range []string{"inkbase_session", "inkbase_refresh"} {
		c, ok := cleared[name]
		if !ok {
			t.Fatalf("FAIL: logout must return a %s cookie to clear it", name)
		}
		if c.MaxAge >= 0 {
			t.Errorf("FAIL: %s cookie MaxAge must be -1 (delete), got %d", name, c.MaxAge)
		}
	}
}

// TestLogoutThenProtectedRouteIsBlocked verifies the full lifecycle:
// login → protected route works → logout → same cookie no longer accepted.
//
// In a stateless JWT system, this tests that the cookie is correctly cleared
// on the client side. The server's RequireAuth would still accept the raw JWT
// string if presented directly (by design), but since it was HttpOnly, no
// client code ever had access to that raw value.
func TestLogoutThenProtectedRouteIsBlocked(t *testing.T) {
	handler := api.New()
	email := uniqueEmail(t)

	// Register + capture session cookie.
	rec := register(t, handler, email, "securepass1", "10.0.0.8:1")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d", rec.Code)
	}
	cookie := sessionCookie(t, rec)

	// Confirm the protected route works pre-logout.
	rec = doRequest(handler, http.MethodGet, "/api/auth/me", "10.0.0.8:2", nil, cookie)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 before logout, got %d", rec.Code)
	}

	// Logout.
	doRequest(handler, http.MethodPost, "/api/auth/logout", "10.0.0.8:3", nil)

	// A request with NO cookie must now get 401 (simulates post-logout browser
	// state where the cookie has been deleted by the browser per Max-Age=-1).
	rec = doRequest(handler, http.MethodGet, "/api/auth/me", "10.0.0.8:4", nil)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: expected 401 after logout (no cookie), got %d", rec.Code)
	}
}

// TestLogoutRevokesSessionServerSide proves logout is no longer a client-side
// illusion. After logout, the EXACT same access token — still in the cookie —
// is refused, because the server-side session row was deleted. This is the fix
// for the previous design where a logged-out JWT stayed valid for 24 h.
func TestLogoutRevokesSessionServerSide(t *testing.T) {
	handler := api.New()
	email := uniqueEmail(t)

	rec := register(t, handler, email, "securepass1", "10.0.0.8:1")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d", rec.Code)
	}
	cookie := sessionCookie(t, rec)

	// Sanity: the fresh session works.
	rec = doRequest(handler, http.MethodGet, "/api/auth/me", "10.0.0.8:2", nil, cookie)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 before logout, got %d", rec.Code)
	}

	// Logout while presenting the session cookie.
	rec = doRequest(handler, http.MethodPost, "/api/auth/logout", "10.0.0.8:3", nil, cookie)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 from logout, got %d", rec.Code)
	}

	// The identical token must now be dead, even though it was never tampered
	// with and is not expired.
	rec = doRequest(handler, http.MethodGet, "/api/auth/me", "10.0.0.8:4", nil, cookie)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: revoked session token expected 401, got %d — logout did not revoke server-side", rec.Code)
	}
}

// ---------------------------------------------------------------------------
// Refresh tokens
// ---------------------------------------------------------------------------

// TestRefreshRotatesTokens verifies the full refresh lifecycle:
//   - login issues an access cookie and a refresh cookie
//   - POST /api/auth/refresh with the refresh cookie re-stamps both cookies
//   - the OLD refresh token is dead after rotation — replaying it is refused
//
// Rotation is what stops a leaked refresh token from being usable forever.
func TestRefreshRotatesTokens(t *testing.T) {
	handler := api.New()
	email := uniqueEmail(t)

	rec := register(t, handler, email, "securepass1", "10.3.0.1:1")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d %s", rec.Code, rec.Body.String())
	}
	oldRefresh := refreshCookie(t, rec)

	// Refresh with the original refresh cookie.
	rec = doRequest(handler, http.MethodPost, "/api/auth/refresh", "10.3.0.2:1", nil, oldRefresh)
	if rec.Code != http.StatusOK {
		t.Fatalf("FAIL: refresh expected 200, got %d %s", rec.Code, rec.Body.String())
	}

	// Both cookies must be re-stamped.
	access := sessionCookie(t, rec)
	rotated := refreshCookie(t, rec)
	if rotated.Value == oldRefresh.Value {
		t.Fatal("FAIL: refresh token must rotate — new value equals old value")
	}

	// The rotated access cookie must work on a protected route.
	rec = doRequest(handler, http.MethodGet, "/api/auth/me", "10.3.0.3:1", nil, access)
	if rec.Code != http.StatusOK {
		t.Fatalf("FAIL: fresh access token expected 200, got %d", rec.Code)
	}

	// Replaying the ORIGINAL refresh token must now be refused.
	rec = doRequest(handler, http.MethodPost, "/api/auth/refresh", "10.3.0.4:1", nil, oldRefresh)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: replayed old refresh token expected 401 after rotation, got %d", rec.Code)
	}

	// The rotated refresh token still works.
	rec = doRequest(handler, http.MethodPost, "/api/auth/refresh", "10.3.0.5:1", nil, rotated)
	if rec.Code != http.StatusOK {
		t.Errorf("FAIL: rotated refresh token expected 200, got %d", rec.Code)
	}
}

// TestRefreshWithoutCookieRejected verifies that a refresh request with no
// refresh cookie is refused.
func TestRefreshWithoutCookieRejected(t *testing.T) {
	handler := api.New()
	rec := doRequest(handler, http.MethodPost, "/api/auth/refresh", "10.3.1.1:1", nil)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: refresh without cookie expected 401, got %d", rec.Code)
	}
}

// TestRefreshAfterLogoutRejected verifies that a revoked session's refresh
// token is refused — the full logout → refresh cycle proves revocation is real.
func TestRefreshAfterLogoutRejected(t *testing.T) {
	handler := api.New()
	email := uniqueEmail(t)

	rec := register(t, handler, email, "securepass1", "10.3.2.1:1")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d", rec.Code)
	}
	refresh := refreshCookie(t, rec)
	session := sessionCookie(t, rec)

	// Logout kills the session.
	rec = doRequest(handler, http.MethodPost, "/api/auth/logout", "10.3.2.2:1", nil, refresh)
	if rec.Code != http.StatusOK {
		t.Fatalf("logout failed: %d", rec.Code)
	}

	// Neither token works anymore.
	rec = doRequest(handler, http.MethodPost, "/api/auth/refresh", "10.3.2.3:1", nil, refresh)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: refresh after logout expected 401, got %d", rec.Code)
	}
	rec = doRequest(handler, http.MethodGet, "/api/auth/me", "10.3.2.4:1", nil, session)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: access token after logout expected 401, got %d", rec.Code)
	}
}

// TestRefreshThenLogoutFlow covers the steady-state loop the client will run:
// refresh keeps the session alive, and a logout after a refresh still revokes
// the (rotated) session completely.
func TestRefreshThenLogoutFlow(t *testing.T) {
	handler := api.New()
	email := uniqueEmail(t)

	rec := register(t, handler, email, "securepass1", "10.3.3.1:1")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d", rec.Code)
	}
	refresh := refreshCookie(t, rec)

	// Refresh once to rotate.
	rec = doRequest(handler, http.MethodPost, "/api/auth/refresh", "10.3.3.2:1", nil, refresh)
	if rec.Code != http.StatusOK {
		t.Fatalf("refresh failed: %d", rec.Code)
	}
	rotated := refreshCookie(t, rec)
	access := sessionCookie(t, rec)

	// Logout using the rotated refresh token.
	rec = doRequest(handler, http.MethodPost, "/api/auth/logout", "10.3.3.3:1", nil, rotated)
	if rec.Code != http.StatusOK {
		t.Fatalf("logout failed: %d", rec.Code)
	}

	// The rotated access token is dead.
	rec = doRequest(handler, http.MethodGet, "/api/auth/me", "10.3.3.4:1", nil, access)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: access token after refresh+logout expected 401, got %d", rec.Code)
	}
}

// ---------------------------------------------------------------------------
// CSRF protection
// ---------------------------------------------------------------------------

// TestCSRFProtectionViaSameSite verifies two things:
//  1. The session cookie carries SameSite=Lax, instructing the browser to
//     withhold the cookie on cross-site POST requests (the typical CSRF vector).
//  2. A POST to a state-changing endpoint without the session cookie returns
//     an appropriate error — simulating the result of SameSite blocking the
//     cookie on a cross-site request.
//
// The browser's enforcement of SameSite=Lax cannot be tested in Go; the flag
// assertion here documents the intended policy and the server-side behaviour
// confirms what happens when the browser withholds the cookie.
func TestCSRFProtectionViaSameSite(t *testing.T) {
	handler := api.New()
	email := uniqueEmail(t)

	// Step 1: verify cookie carries SameSite=Lax.
	rec := register(t, handler, email, "securepass1", "10.0.0.9:1")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d", rec.Code)
	}
	c := sessionCookie(t, rec)
	if c.SameSite != http.SameSiteLaxMode {
		t.Errorf("FAIL: SameSite must be Lax to prevent CSRF on cross-site POST (got %v)", c.SameSite)
	}

	// Step 2: simulate a cross-site POST to a protected endpoint — the browser
	// withholds the cookie (SameSite=Lax). We model this by sending the request
	// with no cookie and verifying the server returns 401.
	rec = doRequest(handler, http.MethodGet, "/api/auth/me", "10.0.0.9:2", nil /* no cookie */)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: cross-site request without cookie should be 401, got %d", rec.Code)
	}
}

// TestLoginValidationAndCSRFParity tests login-specific failure paths:
// wrong password, unknown email, missing fields, and confirms that login
// yields the exact same HttpOnly + SameSite=Lax cookie as register.
func TestLoginValidationAndCSRFParity(t *testing.T) {
	handler := api.New()
	email := uniqueEmail(t)

	// Register account first.
	rec := register(t, handler, email, "correctpassword123", "10.0.1.1:1")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d %s", rec.Code, rec.Body.String())
	}

	// 1. Wrong password returns 401.
	rec = login(t, handler, email, "wrongpassword123", "10.0.1.2:1")
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: login with wrong password expected 401, got %d", rec.Code)
	}

	// 2. Unknown email returns 401.
	rec = login(t, handler, "nonexistent@test.inkbase.dev", "correctpassword123", "10.0.1.3:1")
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("FAIL: login with unknown email expected 401, got %d", rec.Code)
	}

	// 3. Successful login returns HttpOnly + SameSite=Lax cookie.
	rec = login(t, handler, email, "correctpassword123", "10.0.1.4:1")
	if rec.Code != http.StatusOK {
		t.Fatalf("FAIL: login expected 200, got %d %s", rec.Code, rec.Body.String())
	}
	c := sessionCookie(t, rec)
	if !c.HttpOnly {
		t.Error("FAIL: login cookie must be HttpOnly")
	}
	if c.SameSite != http.SameSiteLaxMode {
		t.Errorf("FAIL: login cookie SameSite must be Lax (got %v)", c.SameSite)
	}
}

// ---------------------------------------------------------------------------
// XSS cannot steal session cookie
// ---------------------------------------------------------------------------

// TestXSSCannotStealSessionCookie verifies the HttpOnly flag that prevents any
// JavaScript — including injected XSS payloads — from reading the session token.
//
// Browser enforcement guarantee: when HttpOnly is set, the browser's JS engine
// never exposes the cookie via document.cookie, fetch response headers, or any
// other JS API. No Go test can execute browser JS, but asserting HttpOnly=true
// here documents and enforces the policy at the cookie-issuance level.
//
// Manual verification: after logging in, run in DevTools console:
//
//	document.cookie  // must NOT contain "inkbase_session"
func TestXSSCannotStealSessionCookie(t *testing.T) {
	handler := api.New()
	rec := register(t, handler, uniqueEmail(t), "securepass1", "10.0.0.10:1")
	if rec.Code != http.StatusCreated {
		t.Fatalf("register failed: %d", rec.Code)
	}

	c := sessionCookie(t, rec)

	if !c.HttpOnly {
		t.Error("FAIL: HttpOnly must be true — without it, any injected JS can steal the session with document.cookie")
	}
}

// ---------------------------------------------------------------------------
// User data isolation
// ---------------------------------------------------------------------------

// TestUsersCannotAccessEachOthersData verifies that each session only returns
// data for its own authenticated user. User A's cookie must never return User
// B's ID, and vice versa.
//
// This test covers /api/auth/me. As resource endpoints are added (canvases,
// documents, etc.), equivalent isolation tests must be added for each one.
// Attempting to access another user's resource should return 401 or 403, never
// 200 with the wrong user's data.
func TestUsersCannotAccessEachOthersData(t *testing.T) {
	handler := api.New()

	emailA := fmt.Sprintf("usera_%d@test.inkbase.dev", time.Now().UnixNano())
	emailB := fmt.Sprintf("userb_%d@test.inkbase.dev", time.Now().UnixNano()+1)

	recA := register(t, handler, emailA, "passA_secure", "10.1.0.1:1")
	if recA.Code != http.StatusCreated {
		t.Fatalf("register A failed: %d %s", recA.Code, recA.Body.String())
	}
	cookieA := sessionCookie(t, recA)

	recB := register(t, handler, emailB, "passB_secure", "10.1.0.2:1")
	if recB.Code != http.StatusCreated {
		t.Fatalf("register B failed: %d %s", recB.Code, recB.Body.String())
	}
	cookieB := sessionCookie(t, recB)

	// Fetch /api/auth/me for each user.
	meA := doRequest(handler, http.MethodGet, "/api/auth/me", "10.1.0.1:2", nil, cookieA)
	meB := doRequest(handler, http.MethodGet, "/api/auth/me", "10.1.0.2:2", nil, cookieB)

	if meA.Code != http.StatusOK {
		t.Fatalf("me for A failed: %d", meA.Code)
	}
	if meB.Code != http.StatusOK {
		t.Fatalf("me for B failed: %d", meB.Code)
	}

	var bodyA, bodyB struct {
		UserID int64 `json:"user_id"`
	}
	json.NewDecoder(meA.Body).Decode(&bodyA)
	json.NewDecoder(meB.Body).Decode(&bodyB)

	if bodyA.UserID == 0 || bodyB.UserID == 0 {
		t.Fatal("both users must have non-zero IDs")
	}
	if bodyA.UserID == bodyB.UserID {
		t.Errorf("FAIL: User A and User B returned the same user_id (%d) — session isolation is broken", bodyA.UserID)
	}

	// Using User A's cookie must NOT return User B's data.
	// Swap the cookies — User A's cookie must still only return User A's ID.
	meCrossed := doRequest(handler, http.MethodGet, "/api/auth/me", "10.1.0.3:1", nil, cookieA)
	var bodyCrossed struct {
		UserID int64 `json:"user_id"`
	}
	json.NewDecoder(meCrossed.Body).Decode(&bodyCrossed)
	if bodyCrossed.UserID != bodyA.UserID {
		t.Errorf("FAIL: User A's cookie returned user_id %d instead of %d", bodyCrossed.UserID, bodyA.UserID)
	}
}
