package api_test

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"sync/atomic"
	"testing"

	"inkbase/server/services/documents"
	docdb "inkbase/server/services/documents/db"
)

// ---------------------------------------------------------------------------
// Quota atomicity + seed gating tests.
// ---------------------------------------------------------------------------

// TestQuotaEnforcedUnderConcurrency proves the free-tier check-then-act race
// is closed: 8 racers produce exactly FreeTierLimit winners, the rest get
// ErrStorageLimitReached, and the store holds exactly the limit.
func TestQuotaEnforcedUnderConcurrency(t *testing.T) {
	svc := documents.NewServiceWithStore(docdb.NewMemoryStore())
	ctx := context.Background()
	userID := freshUserID()

	const racers = 8
	start := make(chan struct{})
	var wins, limited atomic.Int64
	var wg sync.WaitGroup
	for i := 0; i < racers; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			<-start
			_, err := svc.Create(ctx, userID, documents.CreateRequest{
				Title:   fmt.Sprintf("Racer %d", i),
				Content: "content",
			})
			if err == nil {
				wins.Add(1)
			} else if errors.Is(err, documents.ErrStorageLimitReached) {
				limited.Add(1)
			} else {
				t.Errorf("racer %d unexpected err: %v", i, err)
			}
		}(i)
	}
	close(start)
	wg.Wait()

	if wins.Load() != int64(documents.FreeTierLimit) {
		t.Fatalf("expected %d winners, got %d", documents.FreeTierLimit, wins.Load())
	}
	if limited.Load() != racers-int64(documents.FreeTierLimit) {
		t.Fatalf("expected %d limited, got %d", racers-documents.FreeTierLimit, limited.Load())
	}
	metas, err := svc.ListMeta(ctx, userID)
	if err != nil || len(metas) != documents.FreeTierLimit {
		t.Fatalf("store holds %d docs, want %d (err %v)", len(metas), documents.FreeTierLimit, err)
	}
}

func TestMemoryStoreStartsEmptyWithoutSeed(t *testing.T) {
	t.Setenv("SEED_DEMO", "")
	store := docdb.NewMemoryStore()
	ctx := context.Background()

	if n, err := store.Count(ctx, 1); err != nil || n != 0 {
		t.Fatalf("default store should be empty for user 1: n=%d err=%v", n, err)
	}
	if metas, err := store.ListMeta(ctx, 1); err != nil || len(metas) != 0 {
		t.Fatalf("default store list should be empty: %d %v", len(metas), err)
	}
}

func TestMemoryStoreSeedsDemoManuscriptsWithFlag(t *testing.T) {
	t.Setenv("SEED_DEMO", "1")
	store := docdb.NewMemoryStore()
	ctx := context.Background()

	metas, err := store.ListMeta(ctx, 1)
	if err != nil {
		t.Fatalf("ListMeta: %v", err)
	}
	if len(metas) != 2 {
		t.Fatalf("seeded store should hold 2 demo docs, got %d", len(metas))
	}
}
