package auth

import (
	"fmt"
	"time"

	authdb "inkbase/server/services/auth/db"
)

// createSession records a new server-side session for the user and returns the
// session's token ID (the access JWT's jti) and the opaque refresh token. The
// session expires refreshTokenTTL after creation — a fixed lifetime, not
// sliding — so a session always dies within 7 days of the original login.
func (s *Service) createSession(userID int64) (tokenID, refreshToken string, err error) {
	tokenID = newTokenID()
	refreshToken = newRefreshToken()
	err = authdb.CreateSession(s.db, authdb.Session{
		ID:          tokenID,
		UserID:      userID,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().Add(refreshTokenTTL),
		RefreshHash: hashRefreshToken(refreshToken),
	})
	if err != nil {
		return "", "", fmt.Errorf("create session: %w", err)
	}
	return tokenID, refreshToken, nil
}
