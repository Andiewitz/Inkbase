package documents

import (
	"context"
)

// ListMeta retrieves metadata (no bodies) for all manuscripts owned by the
// authenticated user. Card grids use this; bodies come from Get.
func (s *Service) ListMeta(ctx context.Context, userID int64) ([]*DocumentMeta, error) {
	return s.store.ListMeta(ctx, userID)
}
