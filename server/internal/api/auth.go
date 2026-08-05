package api

import (
	"encoding/json"
	"errors"
	"net/http"

	"inkbase/server/services/auth"
	"inkbase/server/shared"
)

type registerRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type tokenResponse struct {
	Token string `json:"token"`
}

func handleRegister(svc *auth.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req registerRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
			return
		}
		if req.Email == "" || req.Password == "" {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "email and password are required"})
			return
		}
		if len(req.Password) < 8 {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "password must be at least 8 characters"})
			return
		}

		token, err := svc.Register(req.Email, req.Password)
		if errors.Is(err, auth.ErrEmailTaken) {
			shared.WriteJSON(w, http.StatusConflict, map[string]string{"error": "email already registered"})
			return
		}
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not create account"})
			return
		}

		shared.WriteJSON(w, http.StatusCreated, tokenResponse{Token: token})
	}
}

func handleLogin(svc *auth.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req loginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
			return
		}
		if req.Email == "" || req.Password == "" {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "email and password are required"})
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

		shared.WriteJSON(w, http.StatusOK, tokenResponse{Token: token})
	}
}
