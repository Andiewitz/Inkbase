package documents

import (
	"context"
)

// List retrieves all manuscripts owned by the authenticated user.
func (s *Service) List(ctx context.Context, userID int64) ([]*Document, error) {
	return s.store.List(ctx, userID)
}
