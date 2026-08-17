package documents

import (
	"context"
	"fmt"
	"os"
)

// DocumentStore defines the persistence contract for manuscripts.
type DocumentStore interface {
	Create(ctx context.Context, doc *Document) error
	Get(ctx context.Context, userID int64, docID string) (*Document, error)
	List(ctx context.Context, userID int64) ([]*Document, error)
	Update(ctx context.Context, doc *Document) error
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
