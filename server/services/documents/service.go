package documents

import (
	"context"
)

// Service encapsulates manuscript operations and coordinates storage & format engines.
type Service struct {
	store DocumentStore
}

// NewService instantiates a Service configured via environment variables.
func NewService(ctx context.Context) (*Service, error) {
	store, err := NewStoreFromEnv(ctx)
	if err != nil {
		return nil, err
	}
	return &Service{store: store}, nil
}

// NewServiceWithStore instantiates a Service with a provided DocumentStore (e.g. for testing).
func NewServiceWithStore(store DocumentStore) *Service {
	return &Service{store: store}
}
