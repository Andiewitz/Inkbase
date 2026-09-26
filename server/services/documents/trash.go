package documents

import (
	"context"
)

// ListTrash returns metadata (no bodies) of the user's trashed manuscripts,
// newest trash first. Recovery UI reads this; bodies come from Restore.
func (s *Service) ListTrash(ctx context.Context, userID int64) ([]*DocumentMeta, error) {
	return s.store.ListTrash(ctx, userID)
}
