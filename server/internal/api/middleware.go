package api

import (
	"context"
	"net/http"

	"inkbase/server/services/auth"
	"inkbase/server/shared"
)

// sessionCookieName is the name of the HttpOnly session cookie set on every
// successful login or registration.
const sessionCookieName = "inkbase_session"

type contextKey string

const userIDKey contextKey = "userID"

// RequireAuth reads the session cookie, verifies the JWT against the session
// store, and injects the authenticated user's ID into the request context.
// Returns 401 if the cookie is missing, the token is expired/invalid, or the
// session has been revoked (logged out) server-side.
func RequireAuth(svc *auth.Service) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(sessionCookieName)
			if err != nil {
				shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
				return
			}

			userID, _, err := svc.VerifyToken(cookie.Value)
			if err != nil {
				shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "session expired, please sign in again"})
				return
			}

			ctx := context.WithValue(r.Context(), userIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// UserIDFromContext retrieves the authenticated user ID injected by RequireAuth.
// Returns false if the context carries no user (i.e. the route is not protected).
func UserIDFromContext(ctx context.Context) (int64, bool) {
	id, ok := ctx.Value(userIDKey).(int64)
	return id, ok
}
