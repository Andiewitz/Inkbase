package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"os"

	"inkbase/server/services/auth"
	"inkbase/server/shared"
)

// sessionMaxAge matches the JWT TTL defined in services/auth/jwt.go (24 h).
const sessionMaxAge = 24 * 60 * 60

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// setSessionCookie writes the JWT as an HttpOnly cookie so the browser carries
// it on every subsequent request automatically — no localStorage, no manual
// Authorization header.
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

		setSessionCookie(w, res.Token)
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

		token, err := svc.Login(req.Email, req.Password)
		if errors.Is(err, auth.ErrInvalidCredentials) {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid email or password"})
			return
		}
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not sign in"})
			return
		}

		setSessionCookie(w, token)

		// Dev-only: devwork@mesh.com always triggers the onboarding flow so
		// the onboarding UI can be iterated on without re-registering each time.
		showOnboarding := false
		if os.Getenv("APP_ENV") != "production" && req.Email == "devwork@mesh.com" {
			showOnboarding = true
		}

		shared.WriteJSON(w, http.StatusOK, map[string]any{
			"ok":              true,
			"show_onboarding": showOnboarding,
		})
	}
}

// handleLogout revokes the server-side session and clears the session cookies.
// Unlike a pure client-side cookie drop, the revoked session dies immediately:
// the same access token presented after logout is refused by RequireAuth.
func handleLogout(svc *auth.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if cookie, err := r.Cookie(sessionCookieName); err == nil {
			// Best-effort: a malformed/expired token must not block logout.
			_ = svc.RevokeSession(cookie.Value)
		}
		clearSessionCookies(w)
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
