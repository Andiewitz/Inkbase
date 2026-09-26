package documents

import (
	"context"
)

// Restore brings a trashed manuscript back. Ownership is enforced by the
// store lookup: another user's document yields ErrDocumentNotFound.
func (s *Service) Restore(ctx context.Context, userID int64, docID string) (*Document, error) {
	return s.store.Restore(ctx, userID, docID)
}
