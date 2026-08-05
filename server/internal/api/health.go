package api

import (
	"net/http"

	"inkbase/server/services/health"
	"inkbase/server/shared"
)

func handleHealth(healthSvc *health.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		shared.WriteJSON(w, http.StatusOK, healthSvc.Check())
	}
}
