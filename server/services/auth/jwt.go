package auth

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const tokenTTL = 24 * time.Hour

// newTokenID returns a cryptographically random 32-byte hex string used as the
// token ID (jti). It uniquely identifies a session for revocation and refresh.
func newTokenID() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		// crypto/rand failing means the process cannot issue secure tokens.
		panic(fmt.Sprintf("auth: generate token id: %v", err))
	}
	return hex.EncodeToString(b)
}

type claims struct {
	UserID int64 `json:"uid"`
	jwt.RegisteredClaims
}

// jwtSecret returns the HMAC signing secret, or an error when a production
// server would run without one. The hardcoded fallback is dev-only — a
// production deployment that omits JWT_SECRET must fail fast rather than
// silently sign tokens with a public, forgeable secret.
func jwtSecret() ([]byte, error) {
	s := os.Getenv("JWT_SECRET")
	if s != "" {
		return []byte(s), nil
	}
	if os.Getenv("APP_ENV") == "production" {
		return nil, fmt.Errorf("JWT_SECRET must be set when APP_ENV=production")
	}
	// Fallback for local dev only — never ship without a real secret.
	return []byte("dev-secret-change-me"), nil
}

// SignToken creates a signed JWT for the given user ID and session ID (jti).
func SignToken(userID int64, tokenID string) (string, error) {
	secret, err := jwtSecret()
	if err != nil {
		return "", err
	}
	now := time.Now()
	c := claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        tokenID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(tokenTTL)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	signed, err := token.SignedString(secret)
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}
	return signed, nil
}

// VerifyToken parses and validates a JWT, returning the embedded user ID.
func VerifyToken(tokenStr string) (int64, error) {
	userID, _, err := verify(tokenStr)
	return userID, err
}

// verify parses and validates a JWT, returning the embedded user ID and the
// token ID (jti). Signature, expiry, and signing method are enforced here.
func verify(tokenStr string) (int64, string, error) {
	secret, err := jwtSecret()
	if err != nil {
		return 0, "", err
	}
	t, err := jwt.ParseWithClaims(tokenStr, &claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return secret, nil
	})
	if err != nil {
		return 0, "", fmt.Errorf("parse token: %w", err)
	}
	c, ok := t.Claims.(*claims)
	if !ok || !t.Valid {
		return 0, "", fmt.Errorf("invalid token claims")
	}
	return c.UserID, c.ID, nil
}
