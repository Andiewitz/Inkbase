package api

import (
	"context"
	"log"
	"net/http"

	"inkbase/server/services/auth"
	"inkbase/server/services/documents"
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
	mux.HandleFunc("POST /api/auth/logout", handleLogout(authSvc))
	mux.HandleFunc("POST /api/auth/refresh", handleRefresh(authSvc))

	// Auth — protected (RequireAuth reads the session cookie)
	requireAuth := RequireAuth(authSvc)
	mux.Handle("GET /api/auth/me", requireAuth(handleMe()))

	// Documents — protected
	docSvc, err := documents.NewService(context.Background())
	if err != nil {
		log.Fatalf("documents service: %v", err)
	}
	mux.Handle("GET /api/documents", requireAuth(handleListDocuments(docSvc)))
	mux.Handle("POST /api/documents", requireAuth(handleCreateDocument(docSvc)))
	mux.Handle("POST /api/documents/import", requireAuth(handleImportDocument(docSvc)))
	mux.Handle("GET /api/documents/{id}", requireAuth(handleGetDocument(docSvc)))
	mux.Handle("PATCH /api/documents/{id}", requireAuth(handleUpdateDocument(docSvc)))
	mux.Handle("DELETE /api/documents/{id}", requireAuth(handleDeleteDocument(docSvc)))
	mux.Handle("GET /api/documents/{id}/export", requireAuth(handleExportDocument(docSvc)))

	// Rate limiter wraps the entire mux — every route is covered.
	return RateLimit(store)(mux)
}

