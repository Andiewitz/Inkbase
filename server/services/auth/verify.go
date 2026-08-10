package auth

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"

	authdb "inkbase/server/services/auth/db"
)

// ErrSessionRevoked is returned when a token is well-formed but its server-side
// session is gone (logged out) or has expired.
var ErrSessionRevoked = errors.New("session revoked or expired")

// VerifyToken parses and validates a JWT and checks that its server-side
// session still exists and has not expired. Returns the authenticated user ID
// and the token's session ID (jti).
func (s *Service) VerifyToken(tokenStr string) (userID int64, tokenID string, err error) {
	secret, err := jwtSecret()
	if err != nil {
		return 0, "", err
	}
	c, err := parseToken(tokenStr, secret)
	if err != nil {
		return 0, "", err
	}

	sess, err := authdb.SessionByID(s.db, c.ID)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, "", ErrSessionRevoked
	}
	if err != nil {
		return 0, "", fmt.Errorf("lookup session: %w", err)
	}
	if time.Now().After(sess.ExpiresAt) {
		return 0, "", ErrSessionRevoked
	}
	return c.UserID, c.ID, nil
}

// parseToken validates the signature, expiry, issuer, and audience of a token
// and returns its claims. It does not consult the session store.
func parseToken(tokenStr string, secret []byte) (*claims, error) {
	t, err := jwt.ParseWithClaims(tokenStr, &claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return secret, nil
	}, jwt.WithIssuer(tokenIssuer), jwt.WithAudience(tokenAudience))
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}
	c, ok := t.Claims.(*claims)
	if !ok || !t.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}
	return c, nil
}
