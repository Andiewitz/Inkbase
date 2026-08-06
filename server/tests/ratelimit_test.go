package api_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"inkbase/server/internal/api"
)

// ---------------------------------------------------------------------------
// Token-bucket rate limiter tests
//
// Each test creates its own api.New() instance, which carries a fresh
// limiterStore — no state leaks between tests.
// ---------------------------------------------------------------------------

// TestRateLimitBurstAllowed verifies that a client can fire up to the bucket
// capacity (10) in rapid succession and all requests succeed.
func TestRateLimitBurstAllowed(t *testing.T) {
	handler := api.New()
	const ip = "5.5.5.1:9000"
	const capacity = 10

	for i := 0; i < capacity; i++ {
		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
		req.RemoteAddr = ip
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Errorf("FAIL: request %d/%d expected 200, got %d — bucket should allow full burst", i+1, capacity, rec.Code)
		}
	}
}

// TestRateLimitExceededReturns429 verifies that once the bucket is empty,
// the next request returns 429 Too Many Requests.
func TestRateLimitExceededReturns429(t *testing.T) {
	handler := api.New()
	const ip = "5.5.5.2:9000"
	const capacity = 10

	// Drain the bucket.
	for i := 0; i < capacity; i++ {
		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
		req.RemoteAddr = ip
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	// The (capacity+1)th request must be rejected.
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.RemoteAddr = ip
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("FAIL: expected 429 after bucket exhaustion, got %d", rec.Code)
	}
	if rec.Header().Get("Retry-After") == "" {
		t.Error("FAIL: 429 response must include Retry-After header")
	}
}

// TestRateLimitPerIPIndependence verifies that exhausting one IP's bucket
// does not affect a different IP. Two clients must be isolated.
func TestRateLimitPerIPIndependence(t *testing.T) {
	handler := api.New()
	const ipA = "5.5.5.3:9000"
	const ipB = "5.5.5.4:9000"

	// Exhaust IP A.
	for i := 0; i < 11; i++ {
		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
		req.RemoteAddr = ipA
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	// IP A should be blocked.
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.RemoteAddr = ipA
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("FAIL: IP A expected 429, got %d", rec.Code)
	}

	// IP B's bucket must be entirely independent — first request should be 200.
	req = httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.RemoteAddr = ipB
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("FAIL: IP B expected 200 (different client, unrelated bucket), got %d", rec.Code)
	}
}

// TestRateLimitTokenRefill verifies that an exhausted bucket recovers over time.
// After waiting slightly longer than one refill interval (1 s), the client
// should be able to send at least one more request successfully.
//
// Refill rate: 1 token/s — so after 1100 ms, ≥1 token is available.
func TestRateLimitTokenRefill(t *testing.T) {
	if testing.Short() {
		t.Skip("skipping refill test in -short mode (requires ~1 s sleep)")
	}

	handler := api.New()
	const ip = "5.5.5.5:9000"

	// Drain the bucket.
	for i := 0; i < 10; i++ {
		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
		req.RemoteAddr = ip
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	// Confirm it's actually empty.
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.RemoteAddr = ip
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Fatalf("bucket should be empty, got %d", rec.Code)
	}

	// Wait for one token to refill (1 token/s refill rate).
	time.Sleep(1100 * time.Millisecond)

	// The recovered token should allow exactly one more request.
	req = httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.RemoteAddr = ip
	rec = httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("FAIL: expected 200 after token refill (1100 ms wait), got %d — token bucket is not refilling", rec.Code)
	}
}

// TestRateLimitXForwardedFor verifies that the limiter uses the real client IP
// from X-Forwarded-For rather than the proxy's RemoteAddr. Two logically
// different clients must not share a bucket even when proxied through the same
// address.
func TestRateLimitXForwardedFor(t *testing.T) {
	handler := api.New()
	const proxyAddr = "127.0.0.1:80" // same proxy for both clients

	// Exhaust the bucket for client A via X-Forwarded-For.
	for i := 0; i < 11; i++ {
		req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
		req.RemoteAddr = proxyAddr
		req.Header.Set("X-Forwarded-For", "203.0.113.1")
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)
	}

	// Client B (different IP, same proxy) must have its own bucket.
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.RemoteAddr = proxyAddr
	req.Header.Set("X-Forwarded-For", "203.0.113.2")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("FAIL: different client behind same proxy expected 200, got %d — rate limiter is not isolating by real IP", rec.Code)
	}
}
