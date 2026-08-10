package api

import (
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"inkbase/server/shared"
)

// Token-bucket constants.
// Each client IP starts with a full bucket (burst), then earns tokens back at
// a steady rate. This is intentionally more lenient than a sliding window:
// a user who sends 10 quick requests then goes quiet for 10 s is back to full.
const (
	bucketCapacity = 10.0            // max tokens (burst ceiling)
	bucketRate     = 1.0             // tokens earned per second (60 req/min sustained)
	bucketTTL      = 5 * time.Minute // evict idle buckets after this long
)

// bucket is a single client's token bucket. The mutex is per-bucket so
// multiple IPs never contend on the same lock.
type bucket struct {
	mu       sync.Mutex
	tokens   float64
	lastSeen time.Time
}

// allow consumes one token and returns true, or returns false if the bucket is
// empty. Tokens are lazily refilled based on elapsed time since last request.
func (b *bucket) allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(b.lastSeen).Seconds()
	b.lastSeen = now

	b.tokens += elapsed * bucketRate
	if b.tokens > bucketCapacity {
		b.tokens = bucketCapacity
	}
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// limiterStore holds per-IP buckets and cleans up stale ones in the background.
type limiterStore struct {
	mu      sync.Mutex
	buckets map[string]*bucket
}

func newLimiterStore() *limiterStore {
	s := &limiterStore{buckets: make(map[string]*bucket)}
	go s.cleanup()
	return s
}

// get returns the existing bucket for ip or creates a new full one.
func (s *limiterStore) get(ip string) *bucket {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, ok := s.buckets[ip]
	if !ok {
		b = &bucket{tokens: bucketCapacity, lastSeen: time.Now()}
		s.buckets[ip] = b
	}
	return b
}

// cleanup runs forever, evicting buckets that haven't been seen in bucketTTL.
func (s *limiterStore) cleanup() {
	ticker := time.NewTicker(bucketTTL)
	defer ticker.Stop()
	for range ticker.C {
		s.mu.Lock()
		for ip, b := range s.buckets {
			b.mu.Lock()
			idle := time.Since(b.lastSeen) > bucketTTL
			b.mu.Unlock()
			if idle {
				delete(s.buckets, ip)
			}
		}
		s.mu.Unlock()
	}
}

// RateLimit returns middleware that enforces the token-bucket limit per client IP.
// Wrap the outermost handler with this so every route is protected.
func RateLimit(store *limiterStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := clientIP(r)
			if !store.get(ip).allow() {
				w.Header().Set("Retry-After", "1")
				shared.WriteJSON(w, http.StatusTooManyRequests, map[string]string{
					"error": "too many requests — please slow down",
				})
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// clientIP extracts the real client IP. Forwarded headers (X-Forwarded-For,
// X-Real-Ip) are only trusted when TRUST_PROXY is set — i.e. the server is
// explicitly behind a proxy that overwrites those headers. Without the flag
// they are ignored, so a spoofed header cannot rotate the rate-limit bucket.
func clientIP(r *http.Request) string {
	if trustProxyHeaders() {
		// X-Forwarded-For may be a comma-separated list; the leftmost entry is
		// the original client.
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			if i := strings.Index(xff, ","); i != -1 {
				return strings.TrimSpace(xff[:i])
			}
			return strings.TrimSpace(xff)
		}
		if xri := r.Header.Get("X-Real-Ip"); xri != "" {
			return strings.TrimSpace(xri)
		}
	}
	// RemoteAddr is "host:port" — strip the port.
	addr := r.RemoteAddr
	if i := strings.LastIndex(addr, ":"); i != -1 {
		return addr[:i]
	}
	return addr
}

// trustProxyHeaders reports whether forwarded headers may be trusted. Only a
// proxy you control can overwrite them; an internet-facing server that trusts
// them lets any client spoof its IP and bypass rate limiting.
func trustProxyHeaders() bool {
	switch strings.ToLower(os.Getenv("TRUST_PROXY")) {
	case "1", "true", "yes", "on":
		return true
	}
	return false
}
