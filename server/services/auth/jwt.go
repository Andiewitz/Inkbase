package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	// accessTokenTTL is the lifetime of a signed access JWT. It is deliberately
	// short — the rotating refresh token is what keeps the user signed in.
	accessTokenTTL = 15 * time.Minute
	// refreshTokenTTL is the lifetime of an opaque refresh token and, by
	// extension, the server-side session row it belongs to.
	refreshTokenTTL = 7 * 24 * time.Hour
	tokenIssuer     = "inkbase"
	tokenAudience   = "inkbase-api"
)

// newTokenID returns a cryptographically random 32-byte hex string used as the
// token ID (jti). It uniquely identifies a session for revocation and refresh.
func newTokenID() string {
	return newRandomToken()
}

// newRefreshToken returns a fresh opaque refresh token. Only its SHA-256 hash
// is stored server-side, so a database leak does not expose usable tokens.
func newRefreshToken() string {
	return newRandomToken()
}

// hashRefreshToken returns the hex SHA-256 of a refresh token, the form in
// which refresh tokens are persisted and looked up.
func hashRefreshToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

// newRandomToken returns a cryptographically random 32-byte hex string.
func newRandomToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		// crypto/rand failing means the process cannot issue secure tokens.
		panic(fmt.Sprintf("auth: generate random token: %v", err))
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
			Issuer:    tokenIssuer,
			Audience:  jwt.ClaimStrings{tokenAudience},
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(accessTokenTTL)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, c)
	signed, err := token.SignedString(secret)
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}
	return signed, nil
}
