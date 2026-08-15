package documents

import (
	"context"
)

// Delete removes a manuscript belonging to the authenticated user.
func (s *Service) Delete(ctx context.Context, userID int64, docID string) error {
	// Verify ownership/existence first
	if _, err := s.store.Get(ctx, userID, docID); err != nil {
		return err
	}
	return s.store.Delete(ctx, userID, docID)
}
