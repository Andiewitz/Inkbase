package authdb

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
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

	if env != "production" {
		if err = seedDevUser(db); err != nil {
			log.Printf("db: warning: seed dev user: %v", err)
		}
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

func seedDevUser(db *sql.DB) error {
	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("generate dev bcrypt hash: %w", err)
	}

	var userID int64
	err = db.QueryRow(`SELECT id FROM users WHERE email = 'devwork@mesh.com'`).Scan(&userID)
	if errors.Is(err, sql.ErrNoRows) {
		_, err = db.Exec(`INSERT INTO users (email, password_hash) VALUES ('devwork@mesh.com', ?)`, string(hash))
		return err
	} else if err == nil {
		_, err = db.Exec(`UPDATE users SET password_hash = ? WHERE email = 'devwork@mesh.com'`, string(hash))
		return err
	}
	return err
}


