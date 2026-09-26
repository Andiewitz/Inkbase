package documents

import (
	"context"
	"fmt"
	"os"
	"time"
)

// DocumentStore defines the persistence contract for manuscripts.
type DocumentStore interface {
	Create(ctx context.Context, doc *Document) error
	Get(ctx context.Context, userID int64, docID string) (*Document, error)
	List(ctx context.Context, userID int64) ([]*Document, error)
	Update(ctx context.Context, doc *Document) error
	// UpdateConditional atomically writes doc only if the stored revision
	// is not newer than baseUpdatedAt. It returns ErrDocumentConflict when
	// a newer revision exists and leaves storage unmutated.
	UpdateConditional(ctx context.Context, doc *Document, baseUpdatedAt time.Time) error
	Delete(ctx context.Context, userID int64, docID string) error
	Count(ctx context.Context, userID int64) (int, error)
}

// NewStoreFromEnv returns PostgresStore in production or MemoryStore in dev/test.
func NewStoreFromEnv(_ context.Context) (DocumentStore, error) {
	if os.Getenv("APP_ENV") == "production" {
		dsn := os.Getenv("DATABASE_URL")
		if dsn == "" {
			return nil, fmt.Errorf("DATABASE_URL must be set when APP_ENV=production")
		}
		return NewPostgresStore(dsn)
	}
	return NewMemoryStore(), nil
}
