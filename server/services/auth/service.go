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
// a ready-to-use auth service.
func NewService() (*Service, error) {
	db, err := authdb.Open()
	if err != nil {
		return nil, err
	}
	return &Service{db: db}, nil
}
