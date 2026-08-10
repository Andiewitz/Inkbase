package auth

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"

	authdb "inkbase/server/services/auth/db"
)

// RevokeSession deletes the server-side session identified by the given JWT.
// The token may already be expired — revocation only needs the session ID
// (jti), which is extracted without time validation. Revoking is idempotent.
func (s *Service) RevokeSession(tokenStr string) error {
	secret, err := jwtSecret()
	if err != nil {
		return err
	}
	c, err := parseTokenWithoutValidation(tokenStr, secret)
	if err != nil {
		return fmt.Errorf("parse token for revocation: %w", err)
	}
	if err := authdb.RevokeSession(s.db, c.ID); err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}
	return nil
}

// parseTokenWithoutValidation verifies the signature and extracts the claims
// but skips time and issuer validation, so an expired token can still have its
// session revoked.
func parseTokenWithoutValidation(tokenStr string, secret []byte) (*claims, error) {
	t, err := jwt.ParseWithClaims(tokenStr, &claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return secret, nil
	}, jwt.WithoutClaimsValidation())
	if err != nil {
		return nil, err
	}
	c, ok := t.Claims.(*claims)
	if !ok || !t.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}
	return c, nil
}
