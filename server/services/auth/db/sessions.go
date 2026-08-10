package authdb

import (
	"database/sql"
	"time"
)

// Session is one signed-in session, keyed by the JWT's jti. The row exists
// server-side so sessions can be revoked (logout) and checked on every verify.
type Session struct {
	ID        string
	UserID    int64
	CreatedAt time.Time
	ExpiresAt time.Time
}

// CreateSession records a new session row.
func CreateSession(db *sql.DB, s Session) error {
	_, err := db.Exec(
		`INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
		s.ID, s.UserID, s.CreatedAt, s.ExpiresAt,
	)
	return err
}

// SessionByID returns the session with the given id, or sql.ErrNoRows.
func SessionByID(db *sql.DB, id string) (*Session, error) {
	var s Session
	err := db.QueryRow(
		`SELECT id, user_id, created_at, expires_at FROM sessions WHERE id = ?`, id,
	).Scan(&s.ID, &s.UserID, &s.CreatedAt, &s.ExpiresAt)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// RevokeSession deletes a session row. Deleting is idempotent — revoking a
// session that does not exist (already revoked) is not an error.
func RevokeSession(db *sql.DB, id string) error {
	_, err := db.Exec(`DELETE FROM sessions WHERE id = ?`, id)
	return err
}
