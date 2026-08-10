package auth

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	authdb "inkbase/server/services/auth/db"
)

// ErrInvalidRefreshToken is returned when a refresh token is unknown, expired,
// or belongs to a revoked session.
var ErrInvalidRefreshToken = errors.New("invalid or expired refresh token")

// Refresh exchanges a valid refresh token for a fresh access JWT and a rotated
// refresh token. Rotation invalidates the presented refresh token immediately:
// a replayed old token is refused on the next attempt. The session row's
// lifetime is fixed (refreshTokenTTL from login), so refresh does not extend it.
func (s *Service) Refresh(refreshToken string) (accessToken, nextRefreshToken string, err error) {
	sess, err := authdb.SessionByRefreshHash(s.db, hashRefreshToken(refreshToken))
	if errors.Is(err, sql.ErrNoRows) {
		return "", "", ErrInvalidRefreshToken
	}
	if err != nil {
		return "", "", fmt.Errorf("lookup refresh session: %w", err)
	}
	if time.Now().After(sess.ExpiresAt) {
		// Session has outlived its fixed lifetime — revoke it entirely.
		_ = authdb.RevokeSession(s.db, sess.ID)
		return "", "", ErrInvalidRefreshToken
	}

	accessToken, err = SignToken(sess.UserID, sess.ID)
	if err != nil {
		return "", "", err
	}

	nextRefreshToken = newRefreshToken()
	if err := authdb.RotateRefreshHash(s.db, sess.ID, hashRefreshToken(nextRefreshToken)); err != nil {
		return "", "", fmt.Errorf("rotate refresh token: %w", err)
	}
	return accessToken, nextRefreshToken, nil
}

// RevokeSessionByRefresh deletes the session owning the given refresh token.
// A refresh token that matches no session (already rotated or revoked) is
// treated as success — logout stays idempotent. Only real DB failures error.
func (s *Service) RevokeSessionByRefresh(refreshToken string) error {
	sess, err := authdb.SessionByRefreshHash(s.db, hashRefreshToken(refreshToken))
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return fmt.Errorf("lookup refresh session: %w", err)
	}
	if err := authdb.RevokeSession(s.db, sess.ID); err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}
	return nil
}
