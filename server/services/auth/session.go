package auth

import (
	"fmt"
	"time"

	authdb "inkbase/server/services/auth/db"
)

// createSession records a new server-side session for the user and returns its
// token ID. The token ID becomes the JWT's jti; its expiry is the server-side
// lifetime of the login, so a revoked or aged-out session dies even if a
// signed token is still cryptographically valid.
func (s *Service) createSession(userID int64) (string, error) {
	tokenID := newTokenID()
	err := authdb.CreateSession(s.db, authdb.Session{
		ID:        tokenID,
		UserID:    userID,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(tokenTTL),
	})
	if err != nil {
		return "", fmt.Errorf("create session: %w", err)
	}
	return tokenID, nil
}
