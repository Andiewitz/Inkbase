package docdb

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	_ "github.com/lib/pq"
)

// ─── Postgres Store (Production) ──────────────────────────────────────────────

type PostgresStore struct {
	db *sql.DB
}

// NewPostgresStore returns a store backed by PostgreSQL. It runs idempotent
// schema migrations so the caller never needs a separate migration step.
func NewPostgresStore(dsn string) (*PostgresStore, error) {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open documents db: %w", err)
	}
	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("ping documents db: %w", err)
	}
	if err = migrateDocuments(db); err != nil {
		return nil, fmt.Errorf("migrate documents: %w", err)
	}
	return &PostgresStore{db: db}, nil
}

func migrateDocuments(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS documents (
			user_id    BIGINT  NOT NULL,
			id         TEXT    NOT NULL,
			title      TEXT    NOT NULL DEFAULT '',
			content    TEXT    NOT NULL DEFAULT '',
			excerpt    TEXT    NOT NULL DEFAULT '',
			word_count INT     NOT NULL DEFAULT 0,
			format     TEXT    NOT NULL DEFAULT 'txt',
			branch     JSONB   NOT NULL DEFAULT '{"name":"main","is_edit":false,"pending_changes":0}',
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			PRIMARY KEY (user_id, id)
		)
	`)
	if err != nil {
		return err
	}
	// Recoverable trash: NULL = active. Separate statement for idempotency
	// on databases created before this column existed.
	_, err = db.Exec(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL`)
	return err
}

func (s *PostgresStore) Create(ctx context.Context, doc *Document) error {
	branchJSON, err := json.Marshal(doc.Branch)
	if err != nil {
		return fmt.Errorf("marshal branch: %w", err)
	}

	_, err = s.db.ExecContext(ctx,
		`INSERT INTO documents (user_id, id, title, content, excerpt, word_count, format, branch, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		doc.UserID, doc.ID, doc.Title, doc.Content, doc.Excerpt,
		doc.WordCount, string(doc.Format), branchJSON,
		doc.CreatedAt, doc.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("insert document: %w", err)
	}
	return nil
}

// CreateCapped counts and inserts inside one transaction serialized per user
// with an advisory lock. COUNT alone cannot lock phantom rows, so without
// the lock two concurrent creators could both observe room and overshoot.
func (s *PostgresStore) CreateCapped(ctx context.Context, doc *Document, limit int) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin capped create tx: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock($1)`, doc.UserID); err != nil {
		return fmt.Errorf("acquire quota lock: %w", err)
	}
	var n int
	if err := tx.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM documents WHERE user_id = $1 AND deleted_at IS NULL`,
		doc.UserID,
	).Scan(&n); err != nil {
		return fmt.Errorf("count documents: %w", err)
	}
	if n >= limit {
		return ErrStorageLimitReached
	}

	branchJSON, err := json.Marshal(doc.Branch)
	if err != nil {
		return fmt.Errorf("marshal branch: %w", err)
	}
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO documents (user_id, id, title, content, excerpt, word_count, format, branch, created_at, updated_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		doc.UserID, doc.ID, doc.Title, doc.Content, doc.Excerpt,
		doc.WordCount, string(doc.Format), branchJSON,
		doc.CreatedAt, doc.UpdatedAt,
	); err != nil {
		return fmt.Errorf("insert document: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit capped create: %w", err)
	}
	committed = true
	return nil
}

func (s *PostgresStore) Get(ctx context.Context, userID int64, docID string) (*Document, error) {
	var doc Document
	var branchJSON []byte

	err := s.db.QueryRowContext(ctx,
		`SELECT user_id, id, title, content, excerpt, word_count, format, branch, created_at, updated_at
		 FROM documents WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL`,
		userID, docID,
	).Scan(
		&doc.UserID, &doc.ID, &doc.Title, &doc.Content, &doc.Excerpt,
		&doc.WordCount, &doc.Format, &branchJSON,
		&doc.CreatedAt, &doc.UpdatedAt,
	)
	if isNotFound(err) {
		return nil, ErrDocumentNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get document: %w", err)
	}
	if err := json.Unmarshal(branchJSON, &doc.Branch); err != nil {
		return nil, fmt.Errorf("unmarshal branch: %w", err)
	}
	return &doc, nil
}

func (s *PostgresStore) ListMeta(ctx context.Context, userID int64) ([]*DocumentMeta, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT user_id, id, title, excerpt, word_count, format, branch, created_at, updated_at
		 FROM documents WHERE user_id = $1 AND deleted_at IS NULL ORDER BY updated_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("list documents: %w", err)
	}
	defer rows.Close()

	var docs []*DocumentMeta
	for rows.Next() {
		var meta DocumentMeta
		var branchJSON []byte
		if err := rows.Scan(
			&meta.UserID, &meta.ID, &meta.Title, &meta.Excerpt,
			&meta.WordCount, &meta.Format, &branchJSON,
			&meta.CreatedAt, &meta.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan document: %w", err)
		}
		if err := json.Unmarshal(branchJSON, &meta.Branch); err != nil {
			return nil, fmt.Errorf("unmarshal branch: %w", err)
		}
		docs = append(docs, &meta)
	}
	return docs, rows.Err()
}

func (s *PostgresStore) Update(ctx context.Context, doc *Document) error {
	branchJSON, err := json.Marshal(doc.Branch)
	if err != nil {
		return fmt.Errorf("marshal branch: %w", err)
	}

	result, err := s.db.ExecContext(ctx,
		`UPDATE documents
		 SET title = $3, content = $4, excerpt = $5, word_count = $6,
		     format = $7, branch = $8, updated_at = $9
		 WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL`,
		doc.UserID, doc.ID, doc.Title, doc.Content, doc.Excerpt,
		doc.WordCount, string(doc.Format), branchJSON,
		doc.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("update document: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected: %w", err)
	}
	if n == 0 {
		return ErrDocumentNotFound
	}
	return nil
}

// UpdateConditional atomically compares the stored updated_at against the
// base under a row lock (SELECT ... FOR UPDATE) and writes only when the
// stored revision is not newer. Timestamp equality pitfalls are avoided by
// comparing in Go with After instead of in SQL.
func (s *PostgresStore) UpdateConditional(ctx context.Context, doc *Document, baseUpdatedAt time.Time) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin update tx: %w", err)
	}
	committed := false
	defer func() {
		if !committed {
			_ = tx.Rollback()
		}
	}()

	var storedUpdatedAt time.Time
	err = tx.QueryRowContext(ctx,
		`SELECT updated_at FROM documents WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL FOR UPDATE`,
		doc.UserID, doc.ID,
	).Scan(&storedUpdatedAt)
	if isNotFound(err) {
		return ErrDocumentNotFound
	}
	if err != nil {
		return fmt.Errorf("lock document: %w", err)
	}
	if storedUpdatedAt.UTC().After(baseUpdatedAt.UTC()) {
		return ErrDocumentConflict
	}

	branchJSON, err := json.Marshal(doc.Branch)
	if err != nil {
		return fmt.Errorf("marshal branch: %w", err)
	}
	result, err := tx.ExecContext(ctx,
		`UPDATE documents
		 SET title = $3, content = $4, excerpt = $5, word_count = $6,
		     format = $7, branch = $8, updated_at = $9
		 WHERE user_id = $1 AND id = $2`,
		doc.UserID, doc.ID, doc.Title, doc.Content, doc.Excerpt,
		doc.WordCount, string(doc.Format), branchJSON,
		doc.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("update document: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("rows affected: %w", err)
	}
	if n == 0 {
		return ErrDocumentNotFound
	}
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit update: %w", err)
	}
	committed = true
	return nil
}

func (s *PostgresStore) Delete(ctx context.Context, userID int64, docID string) error {
	_, err := s.db.ExecContext(ctx,
		`UPDATE documents SET deleted_at = now() WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL`,
		userID, docID,
	)
	if err != nil {
		return fmt.Errorf("trash document: %w", err)
	}
	return nil
}

// Restore clears the trash mark and returns the document. Missing documents
// yield ErrDocumentNotFound; active documents are returned unchanged.
func (s *PostgresStore) Restore(ctx context.Context, userID int64, docID string) (*Document, error) {
	result, err := s.db.ExecContext(ctx,
		`UPDATE documents SET deleted_at = NULL WHERE user_id = $1 AND id = $2 AND deleted_at IS NOT NULL`,
		userID, docID,
	)
	if err != nil {
		return nil, fmt.Errorf("restore document: %w", err)
	}
	n, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("rows affected: %w", err)
	}
	if n == 0 {
		// Either already active (idempotent success) or missing.
		return s.Get(ctx, userID, docID)
	}
	return s.Get(ctx, userID, docID)
}

// ListTrash returns metadata of trashed documents, newest trash first.
func (s *PostgresStore) ListTrash(ctx context.Context, userID int64) ([]*DocumentMeta, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT user_id, id, title, excerpt, word_count, format, branch, created_at, updated_at
		 FROM documents WHERE user_id = $1 AND deleted_at IS NOT NULL ORDER BY deleted_at DESC`,
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("list trash: %w", err)
	}
	defer rows.Close()

	var docs []*DocumentMeta
	for rows.Next() {
		var meta DocumentMeta
		var branchJSON []byte
		if err := rows.Scan(
			&meta.UserID, &meta.ID, &meta.Title, &meta.Excerpt,
			&meta.WordCount, &meta.Format, &branchJSON,
			&meta.CreatedAt, &meta.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan document: %w", err)
		}
		if err := json.Unmarshal(branchJSON, &meta.Branch); err != nil {
			return nil, fmt.Errorf("unmarshal branch: %w", err)
		}
		docs = append(docs, &meta)
	}
	return docs, rows.Err()
}

func (s *PostgresStore) Count(ctx context.Context, userID int64) (int, error) {
	var n int
	err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM documents WHERE user_id = $1 AND deleted_at IS NULL`,
		userID,
	).Scan(&n)
	if err != nil {
		return 0, fmt.Errorf("count documents: %w", err)
	}
	return n, nil
}

// Compile-time interface check.
var _ DocumentStore = (*PostgresStore)(nil)
var _ DocumentStore = (*MemoryStore)(nil)
