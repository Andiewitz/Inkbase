package api

import (
	"net/http"

	"inkbase/server/services/health"
)

func New() http.Handler {
	mux := http.NewServeMux()

	health := health.NewService()
	mux.HandleFunc("GET /api/health", handleHealth(health))

	return mux
}
