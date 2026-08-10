package authdb

import (
	"database/sql"
	"time"
)

// Session is one signed-in session, keyed by the JWT's jti. The row exists
// server-side so sessions can be revoked (logout) and checked on every verify.
type Session struct {
	ID          string
	UserID      int64
	CreatedAt   time.Time
	ExpiresAt   time.Time
	RefreshHash string
}

// CreateSession records a new session row.
func CreateSession(db *sql.DB, s Session) error {
	_, err := db.Exec(
		`INSERT INTO sessions (id, user_id, created_at, expires_at, refresh_hash)
		 VALUES (?, ?, ?, ?, ?)`,
		s.ID, s.UserID, s.CreatedAt, s.ExpiresAt, s.RefreshHash,
	)
	return err
}

// SessionByID returns the session with the given id, or sql.ErrNoRows.
func SessionByID(db *sql.DB, id string) (*Session, error) {
	return querySession(db, `WHERE id = ?`, id)
}

// SessionByRefreshHash returns the session whose refresh token hashes to the
// given value, or sql.ErrNoRows.
func SessionByRefreshHash(db *sql.DB, hash string) (*Session, error) {
	return querySession(db, `WHERE refresh_hash = ?`, hash)
}

func querySession(db *sql.DB, where, arg string) (*Session, error) {
	var s Session
	err := db.QueryRow(
		`SELECT id, user_id, created_at, expires_at, refresh_hash
		 FROM sessions `+where, arg,
	).Scan(&s.ID, &s.UserID, &s.CreatedAt, &s.ExpiresAt, &s.RefreshHash)
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

// RotateRefreshHash replaces a session's refresh hash during refresh-token
// rotation. The previous refresh token becomes unusable immediately.
func RotateRefreshHash(db *sql.DB, sessionID, newHash string) error {
	_, err := db.Exec(`UPDATE sessions SET refresh_hash = ? WHERE id = ?`, newHash, sessionID)
	return err
}
