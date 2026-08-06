package api

import (
	"log"
	"net/http"

	"inkbase/server/services/auth"
	"inkbase/server/services/health"
)

func New() http.Handler {
	mux := http.NewServeMux()
	store := newLimiterStore()

	// Health
	healthSvc := health.NewService()
	mux.HandleFunc("GET /api/health", handleHealth(healthSvc))

	// Auth — public
	authSvc, err := auth.NewService()
	if err != nil {
		log.Fatalf("auth service: %v", err)
	}
	mux.HandleFunc("POST /api/auth/register", handleRegister(authSvc))
	mux.HandleFunc("POST /api/auth/login", handleLogin(authSvc))
	mux.HandleFunc("POST /api/auth/logout", handleLogout())

	// Auth — protected (RequireAuth reads the session cookie)
	mux.Handle("GET /api/auth/me", RequireAuth(handleMe()))

	// Rate limiter wraps the entire mux — every route is covered.
	return RateLimit(store)(mux)
}
