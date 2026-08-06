package auth

import (
	"errors"
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// ErrEmailTaken is returned when a registration email already exists.
var ErrEmailTaken = errors.New("email already registered")

// ErrInvalidCredentials is returned when login email/password don't match.
var ErrInvalidCredentials = errors.New("invalid email or password")

// SetupResult contains the JWT token and onboarding flags for newly created accounts.
type SetupResult struct {
	Token          string
	ShowOnboarding bool
}

// Register creates a new user, hashes their password, and immediately returns
// a signed JWT and onboarding signal so the client triggers account setup.
func (s *Service) Register(email, password string) (*SetupResult, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	var userID int64
	err = s.db.QueryRow(
		`INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id`,
		email, string(hash),
	).Scan(&userID)
	if err != nil {
		// Unique constraint violation → email taken.
		if isUniqueViolation(err) {
			return nil, ErrEmailTaken
		}
		return nil, fmt.Errorf("insert user: %w", err)
	}

	token, err := SignToken(userID)
	if err != nil {
		return nil, err
	}
	return &SetupResult{
		Token:          token,
		ShowOnboarding: true,
	}, nil
}


// isUniqueViolation returns true for duplicate-key errors from SQLite and Postgres.
func isUniqueViolation(err error) bool {
	msg := err.Error()
	// SQLite: "UNIQUE constraint failed"
	// Postgres: "duplicate key value violates unique constraint"
	return contains(msg, "UNIQUE constraint failed") ||
		contains(msg, "duplicate key value")
}

func contains(s, sub string) bool {
	return len(s) >= len(sub) && (s == sub || len(s) > 0 && searchStr(s, sub))
}

func searchStr(s, sub string) bool {
	for i := range s {
		if i+len(sub) <= len(s) && s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
