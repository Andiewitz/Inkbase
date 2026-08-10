package auth

import (
	"database/sql"
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// dummyHash is a valid bcrypt hash used to equalize response timing between
// unknown emails and real logins, so an attacker cannot enumerate registered
// emails by measuring how long the server takes to answer.
var dummyHash []byte

func init() {
	// Best-effort: a failure here only degrades timing parity, never auth.
	dummyHash, _ = bcrypt.GenerateFromPassword([]byte("inkbase-timing-dummy"), bcrypt.DefaultCost)
}

// Login verifies credentials and returns a fresh JWT on success.
func (s *Service) Login(email, password string) (token string, err error) {
	var (
		userID       int64
		passwordHash string
	)
	err = s.db.QueryRow(
		`SELECT id, password_hash FROM users WHERE email = ?`, email,
	).Scan(&userID, &passwordHash)
	if errors.Is(err, sql.ErrNoRows) {
		// Unknown email — burn the same bcrypt cost as a real check so the
		// response time does not reveal whether the email exists.
		_ = bcrypt.CompareHashAndPassword(dummyHash, []byte(password))
		return "", ErrInvalidCredentials
	}
	if err != nil {
		return "", fmt.Errorf("query user: %w", err)
	}

	if err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}

	tokenID, err := s.createSession(userID)
	if err != nil {
		return "", err
	}

	token, err = SignToken(userID, tokenID)
	if err != nil {
		return "", err
	}
	return token, nil
}
