package documents

import (
	"context"
)

// Delete moves a manuscript belonging to the authenticated user to
// recoverable trash. The document disappears from Get/List/Count but can be
// brought back with Restore. Trashed documents do not count toward the free
// tier limit.
func (s *Service) Delete(ctx context.Context, userID int64, docID string) error {
	// Verify ownership/existence first
	if _, err := s.store.Get(ctx, userID, docID); err != nil {
		return err
	}
	return s.store.Delete(ctx, userID, docID)
}
