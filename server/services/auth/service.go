package auth

import (
	"database/sql"

	authdb "inkbase/server/services/auth/db"
)

// Service holds the auth domain logic and its own database handle.
type Service struct {
	db *sql.DB
}

// NewService opens the database (SQLite in dev, Postgres in prod) and returns
// a ready-to-use auth service. It fails fast on a production server that is
// missing its signing secret rather than booting into a forgeable state.
func NewService() (*Service, error) {
	if _, err := jwtSecret(); err != nil {
		return nil, err
	}
	db, err := authdb.Open()
	if err != nil {
		return nil, err
	}
	return &Service{db: db}, nil
}
