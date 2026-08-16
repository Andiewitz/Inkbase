package api_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"inkbase/server/internal/api"
)

// ---------------------------------------------------------------------------
// Tiered Token-bucket Rate Limiter Tests
// ---------------------------------------------------------------------------

func makeLoginRequest(ip string) *http.Request {
	body, _ := json.Marshal(map[string]string{
		"email":    "user@example.com",
		"password": "wrongpassword",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = ip
	return req
}

// TestRateLimitAuthBurstAllowed verifies that a client can fire up to the auth
// bucket capacity (10) in rapid succession and all requests pass rate limiting.
func TestRateLimitAuthBurstAllowed(t *testing.T) {
	handler := api.New()
	const ip = "5.5.5.1:9000"
	const capacity = 10

	for i := 0; i < capacity; i++ {
		req := makeLoginRequest(ip)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		// May be 401 (invalid creds) but must not be 429 (rate limited)
		if rec.Code == http.StatusTooManyRequests {
			t.Errorf("FAIL: request %d/%d got 429 — auth bucket should allow full burst of %d", i+1, capacity, capacity)
		}
	}
}

// TestRateLimitAuthExceededReturns429 verifies that once the auth bucket is empty,
// the next auth request returns 429 Too Many Requests with Retry-After.
func TestRateLimitAuthExceededReturns429(t *testing.T) {
	handler := api.New()
	const ip = "5.5.5.2:9000"
	const capacity = 10

	// Drain the auth bucket.
	for i := 0; i < capacity; i++ {
		req := makeLoginRequest(ip)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	// The (capacity+1)th request must be rejected.
	req := makeLoginRequest(ip)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("FAIL: expected 429 after auth bucket exhaustion, got %d", rec.Code)
	}
	if rec.Header().Get("Retry-After") == "" {
		t.Error("FAIL: 429 response must include Retry-After header")
	}
}

// TestRateLimitGeneralBucketAllowsGenerousBurst verifies that general application
// routes (like documents / active editing) support generous burst volumes (50+).
func TestRateLimitGeneralBucketAllowsGenerousBurst(t *testing.T) {
	handler := api.New()
	const ip = "5.5.5.3:9000"

	// Register user to obtain valid cookie with unique email
	email := fmt.Sprintf("generalauthor_%d@inkbase.com", time.Now().UnixNano())
	regBody, _ := json.Marshal(map[string]string{
		"email":    email,
		"password": "Password123!",
	})
	regReq := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(regBody))
	regReq.Header.Set("Content-Type", "application/json")
	regReq.RemoteAddr = "9.9.9.9:9000" // separate IP for registration
	regRec := httptest.NewRecorder()
	handler.ServeHTTP(regRec, regReq)

	if regRec.Code != http.StatusCreated {
		t.Fatalf("Register user failed: %d %s", regRec.Code, regRec.Body.String())
	}

	cookies := regRec.Result().Cookies()

	// Fire 30 rapid document list requests from client IP (higher than auth's 10 limit)
	for i := 0; i < 30; i++ {
		req := httptest.NewRequest(http.MethodGet, "/api/documents", nil)
		req.RemoteAddr = ip
		for _, c := range cookies {
			req.AddCookie(c)
		}
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("FAIL: document request %d got %d — general tier should allow high burst for active writing", i+1, rec.Code)
		}
	}
}

// TestRateLimitHealthRouteUnthrottled verifies that health checks are never throttled.
func TestRateLimitHealthRouteUnthrottled(t *testing.T) {
	handler := api.New()
	const ip = "5.5.5.4:9000"

	for i := 0; i < 100; i++ {
		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
		req.RemoteAddr = ip
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("FAIL: health check %d returned %d — health must remain unthrottled", i+1, rec.Code)
		}
	}
}

// TestRateLimitPerIPIndependence verifies that exhausting one IP's bucket
// does not affect a different IP. Two clients must be isolated.
func TestRateLimitPerIPIndependence(t *testing.T) {
	handler := api.New()
	const ipA = "5.5.5.5:9000"
	const ipB = "5.5.5.6:9000"

	// Exhaust IP A.
	for i := 0; i < 11; i++ {
		req := makeLoginRequest(ipA)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	// IP A should be blocked.
	req := makeLoginRequest(ipA)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("FAIL: IP A expected 429, got %d", rec.Code)
	}

	// IP B's bucket must be entirely independent — first request should not be 429.
	req = makeLoginRequest(ipB)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code == http.StatusTooManyRequests {
		t.Errorf("FAIL: IP B got 429 (different client, unrelated bucket)")
	}
}

// TestRateLimitTokenRefill verifies that an exhausted bucket recovers over time.
func TestRateLimitTokenRefill(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping refill test in -short mode (requires ~1 s sleep)")
	}

	handler := api.New()
	const ip = "5.5.5.7:9000"

	// Drain the auth bucket.
	for i := 0; i < 10; i++ {
		req := makeLoginRequest(ip)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	// Confirm it's actually empty.
	req := makeLoginRequest(ip)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("bucket should be empty, got %d", rec.Code)
	}

	// Wait for one token to refill (1 token/s refill rate).
	time.Sleep(1100 * time.Millisecond)

	// The recovered token should allow exactly one more request.
	req = makeLoginRequest(ip)
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code == http.StatusTooManyRequests {
		t.Errorf("FAIL: expected not 429 after token refill (1100 ms wait) — token bucket is not refilling")
	}
}

// TestRateLimitXForwardedFor verifies that the limiter uses the real client IP
// from X-Forwarded-For rather than the proxy's RemoteAddr.
func TestRateLimitXForwardedFor(t *testing.T) {
	restoreEnv(t, "TRUST_PROXY")
	t.Setenv("TRUST_PROXY", "true")

	handler := api.New()
	const proxyAddr = "127.0.0.1:80"

	// Exhaust the bucket for client A via X-Forwarded-For.
	for i := 0; i < 11; i++ {
		req := makeLoginRequest(proxyAddr)
		req.Header.Set("X-Forwarded-For", "203.0.113.1")
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	// Client B (different IP, same proxy) must have its own bucket.
	req := makeLoginRequest(proxyAddr)
	req.Header.Set("X-Forwarded-For", "203.0.113.2")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code == http.StatusTooManyRequests {
		t.Errorf("FAIL: different client behind same proxy got 429 — rate limiter is not isolating by real IP")
	}
}

// TestRateLimitSpoofedXForwardedForIgnored verifies the security fix: when the
// server is NOT configured to trust proxies, a spoofed X-Forwarded-For header
// must not let an attacker rotate buckets and bypass the rate limit.
func TestRateLimitSpoofedXForwardedForIgnored(t *testing.T) {
	restoreEnv(t, "TRUST_PROXY")
	t.Setenv("TRUST_PROXY", "")

	handler := api.New()
	const ip = "5.5.5.8:9000"

	// Exhaust the bucket while claiming a fresh X-Forwarded-For on every hit.
	for i := 0; i < 11; i++ {
		req := makeLoginRequest(ip)
		req.Header.Set("X-Forwarded-For", fmt.Sprintf("203.0.113.%d", i))
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	// The spoofed headers must NOT have created fresh buckets.
	req := makeLoginRequest(ip)
	req.Header.Set("X-Forwarded-For", "203.0.113.99")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("FAIL: spoofed X-Forwarded-For must not bypass rate limit — expected 429, got %d", rec.Code)
	}
}
