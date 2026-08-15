package documents

import (
	"context"
)

// Get fetches a single manuscript for the authenticated user.
func (s *Service) Get(ctx context.Context, userID int64, docID string) (*Document, error) {
	return s.store.Get(ctx, userID, docID)
}
