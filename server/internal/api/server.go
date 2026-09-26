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

	authLimiter := RateLimit(NewAuthLimiter())
	generalLimiter := RateLimit(NewGeneralLimiter())

	// Health — unthrottled
	healthSvc := health.NewService()
	mux.HandleFunc("GET /api/health", handleHealth(healthSvc))

	// Auth — public (Strict rate limiter to prevent credential brute-forcing)
	authSvc, err := auth.NewService()
	if err != nil {
		log.Fatalf("auth service: %v", err)
	}
	mux.Handle("POST /api/auth/register", authLimiter(handleRegister(authSvc)))
	mux.Handle("POST /api/auth/login", authLimiter(handleLogin(authSvc)))
	mux.Handle("POST /api/auth/logout", authLimiter(handleLogout(authSvc)))
	mux.Handle("POST /api/auth/refresh", authLimiter(handleRefresh(authSvc)))

	// Auth — protected (RequireAuth reads the session cookie)
	requireAuth := RequireAuth(authSvc)
	mux.Handle("GET /api/auth/me", generalLimiter(requireAuth(handleMe())))

	// Documents — protected (Generous rate limiter for active editing, auto-saves & reads)
	docSvc, err := documents.NewService(context.Background())
	if err != nil {
		log.Fatalf("documents service: %v", err)
	}
	mux.Handle("GET /api/documents", generalLimiter(requireAuth(handleListDocuments(docSvc))))
	mux.Handle("POST /api/documents", generalLimiter(requireAuth(handleCreateDocument(docSvc))))
	mux.Handle("POST /api/documents/import", generalLimiter(requireAuth(handleImportDocument(docSvc))))
	mux.Handle("GET /api/documents/{id}", generalLimiter(requireAuth(handleGetDocument(docSvc))))
	mux.Handle("PUT /api/documents/{id}", generalLimiter(requireAuth(handleUpdateDocument(docSvc))))
	mux.Handle("PATCH /api/documents/{id}", generalLimiter(requireAuth(handleUpdateDocument(docSvc))))
	mux.Handle("DELETE /api/documents/{id}", generalLimiter(requireAuth(handleDeleteDocument(docSvc))))
	mux.Handle("POST /api/documents/{id}/restore", generalLimiter(requireAuth(handleRestoreDocument(docSvc))))
	mux.Handle("GET /api/documents/{id}/export", generalLimiter(requireAuth(handleExportDocument(docSvc))))

	return mux
}
