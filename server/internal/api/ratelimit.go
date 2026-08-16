package api

import (
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"inkbase/server/shared"
)

// Default Token-bucket constants.
const (
	defaultBucketTTL = 5 * time.Minute // evict idle buckets after this long

	// Auth tier: Strict limits to prevent brute-force attacks against credentials.
	AuthBucketCapacity = 10.0 // 10 burst tokens
	AuthBucketRate     = 1.0  // 1 token/sec (60 req/min sustained)

	// General tier: Generous limits for active document editing, real-time typing & auto-saves.
	GeneralBucketCapacity = 60.0 // 60 burst tokens
	GeneralBucketRate     = 10.0 // 10 tokens/sec (600 req/min sustained)
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
func (b *bucket) allow(capacity, rate float64) bool {
	b.mu.Lock()
	defer b.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(b.lastSeen).Seconds()
	b.lastSeen = now

	b.tokens += elapsed * rate
	if b.tokens > capacity {
		b.tokens = capacity
	}
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

// limiterStore holds per-IP buckets and cleans up stale ones in the background.
type limiterStore struct {
	mu       sync.Mutex
	capacity float64
	rate     float64
	ttl      time.Duration
	buckets  map[string]*bucket
}

func newLimiterStore(capacity, rate float64) *limiterStore {
	s := &limiterStore{
		capacity: capacity,
		rate:     rate,
		ttl:      defaultBucketTTL,
		buckets:  make(map[string]*bucket),
	}
	go s.cleanup()
	return s
}

// NewAuthLimiter creates a strict rate limiter for authentication routes.
func NewAuthLimiter() *limiterStore {
	return newLimiterStore(AuthBucketCapacity, AuthBucketRate)
}

// NewGeneralLimiter creates a generous rate limiter for document and user data routes.
func NewGeneralLimiter() *limiterStore {
	return newLimiterStore(GeneralBucketCapacity, GeneralBucketRate)
}

// get returns the existing bucket for ip or creates a new full one.
func (s *limiterStore) get(ip string) *bucket {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, ok := s.buckets[ip]
	if !ok {
		b = &bucket{tokens: s.capacity, lastSeen: time.Now()}
		s.buckets[ip] = b
	}
	return b
}

// cleanup runs forever, evicting buckets that haven't been seen in ttl.
func (s *limiterStore) cleanup() {
	ticker := time.NewTicker(s.ttl)
	defer ticker.Stop()
	for range ticker.C {
		s.mu.Lock()
		for ip, b := range s.buckets {
			b.mu.Lock()
			idle := time.Since(b.lastSeen) > s.ttl
			b.mu.Unlock()
			if idle {
				delete(s.buckets, ip)
			}
		}
		s.mu.Unlock()
	}
}

// RateLimit returns middleware that enforces the token-bucket limit per client IP.
func RateLimit(store *limiterStore) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := clientIP(r)
			if !store.get(ip).allow(store.capacity, store.rate) {
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
