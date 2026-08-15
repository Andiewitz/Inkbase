package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"

	"inkbase/server/services/auth"
	"inkbase/server/shared"
)

// sessionMaxAge matches the access JWT TTL (15 min) defined in
// services/auth/jwt.go. The refresh cookie carries the long-lived session.
const sessionMaxAge = 15 * 60

// refreshMaxAge matches refreshTokenTTL (7 days).
const refreshMaxAge = 7 * 24 * 60 * 60

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// setSessionCookie writes the access JWT as an HttpOnly cookie so the browser
// carries it on every subsequent request automatically — no localStorage, no
// manual Authorization header. Short-lived; refreshed via the refresh cookie.
func setSessionCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   os.Getenv("APP_ENV") == "production",
		SameSite: http.SameSiteLaxMode,
		MaxAge:   sessionMaxAge,
	})
}

// setRefreshCookie writes the opaque rotating refresh token. Its path is
// restricted to /api/auth so the browser only sends it to auth endpoints,
// shrinking its exposure surface.
func setRefreshCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     refreshCookieName,
		Value:    token,
		Path:     "/api/auth",
		HttpOnly: true,
		Secure:   os.Getenv("APP_ENV") == "production",
		SameSite: http.SameSiteLaxMode,
		MaxAge:   refreshMaxAge,
	})
}

func handleRegister(svc *auth.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req registerRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
			return
		}
		if err := shared.ValidateEmail(req.Email); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if err := shared.ValidatePassword(req.Password); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}

		res, err := svc.Register(req.Email, req.Password)
		if errors.Is(err, auth.ErrEmailTaken) {
			shared.WriteJSON(w, http.StatusConflict, map[string]string{"error": "email already registered"})
			return
		}
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not create account"})
			return
		}

		setSessionCookie(w, res.AccessToken)
		setRefreshCookie(w, res.RefreshToken)
		shared.WriteJSON(w, http.StatusCreated, map[string]any{
			"ok":              true,
			"show_onboarding": res.ShowOnboarding,
		})
	}
}

func handleLogin(svc *auth.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req loginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
			return
		}
		// On login, validate email format but don't enforce password complexity —
		// the stored hash is the source of truth, not these rules.
		if err := shared.ValidateEmail(req.Email); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if err := shared.ValidateNonEmpty("password", req.Password); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}

		result, err := svc.Login(req.Email, req.Password)
		if errors.Is(err, auth.ErrInvalidCredentials) {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid email or password"})
			return
		}
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not sign in"})
			return
		}

		setSessionCookie(w, result.AccessToken)
		setRefreshCookie(w, result.RefreshToken)

		shared.WriteJSON(w, http.StatusOK, map[string]any{
			"ok": true,
		})
	}
}

// handleLogout revokes the server-side session and clears the session cookies.
// Unlike a pure client-side cookie drop, the revoked session dies immediately:
// the same access token presented after logout is refused by RequireAuth.
func handleLogout(svc *auth.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Prefer the refresh cookie — it survives access-token expiry, so a
		// logout after 15 min idle still kills the session. Fall back to the
		// access JWT's jti. Both are best-effort: a malformed token must not
		// block logout.
		if cookie, err := r.Cookie(refreshCookieName); err == nil {
			_ = svc.RevokeSessionByRefresh(cookie.Value)
		} else if cookie, err := r.Cookie(sessionCookieName); err == nil {
			_ = svc.RevokeSession(cookie.Value)
		}
		clearSessionCookies(w)
		shared.WriteJSON(w, http.StatusOK, map[string]bool{"ok": true})
	}
}

// handleRefresh exchanges a valid refresh token for a fresh access JWT and a
// rotated refresh token. It is the silent-reauth endpoint the client calls
// when the access token expires. Both cookies are re-stamped on success; on
// failure the stale cookies are cleared.
func handleRefresh(svc *auth.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(refreshCookieName)
		if err != nil {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
			return
		}

		accessToken, refreshToken, err := svc.Refresh(cookie.Value)
		if err != nil {
			clearSessionCookies(w)
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "session expired, please sign in again"})
			return
		}

		setSessionCookie(w, accessToken)
		setRefreshCookie(w, refreshToken)
		shared.WriteJSON(w, http.StatusOK, map[string]bool{"ok": true})
	}
}

// clearSessionCookies overwrites the session and refresh cookies so the
// browser discards them.
func clearSessionCookies(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:     refreshCookieName,
		Value:    "",
		Path:     "/api/auth",
		HttpOnly: true,
		MaxAge:   -1,
	})
}

// handleMe returns the authenticated user's ID. Protected by RequireAuth.
func handleMe() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
			return
		}
		shared.WriteJSON(w, http.StatusOK, map[string]int64{"user_id": userID})
	}
}
