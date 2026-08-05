package authdb

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
	_ "modernc.org/sqlite"
)

// Open returns a *sql.DB connected to SQLite (development) or PostgreSQL (production).
// Development is detected when APP_ENV != "production".
func Open() (*sql.DB, error) {
	env := os.Getenv("APP_ENV")

	var (
		db  *sql.DB
		err error
	)

	if env == "production" {
		dsn := os.Getenv("DATABASE_URL")
		if dsn == "" {
			return nil, fmt.Errorf("DATABASE_URL must be set in production")
		}
		db, err = sql.Open("postgres", dsn)
	} else {
		// SQLite in dev — pure-Go driver, no CGO required.
		db, err = sql.Open("sqlite", "inkbase_dev.db")
	}

	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}

	if err = migrate(db, env); err != nil {
		return nil, fmt.Errorf("migrate: %w", err)
	}

	log.Printf("db: connected (%s)", dbLabel(env))
	return db, nil
}

func dbLabel(env string) string {
	if env == "production" {
		return "postgres"
	}
	return "sqlite (dev)"
}

// migrate runs the initial schema. Safe to call on every boot.
func migrate(db *sql.DB, env string) error {
	autoInc := "INTEGER PRIMARY KEY AUTOINCREMENT"
	if env == "production" {
		autoInc = "BIGSERIAL PRIMARY KEY"
	}

	_, err := db.Exec(fmt.Sprintf(`
		CREATE TABLE IF NOT EXISTS users (
			id            %s,
			email         TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`, autoInc))
	return err
}
