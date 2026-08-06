package auth

import (
	"database/sql"
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

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
		return "", ErrInvalidCredentials
	}
	if err != nil {
		return "", fmt.Errorf("query user: %w", err)
	}

	if err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}

	token, err = SignToken(userID)
	if err != nil {
		return "", err
	}
	return token, nil
}
