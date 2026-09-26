package docdb

import (
	"context"
	"os"
	"testing"
)

// TestPostgresStoreCRUD exercises the full DocumentStore contract against a real
// PostgreSQL instance. It is gated on the INKBASE_TEST_POSTGRES environment
// variable: when unset the test is skipped so the suite stays green in local
// dev and CI without a database.
func TestPostgresStoreCRUD(t *testing.T) {
	dsn := os.Getenv("INKBASE_TEST_POSTGRES")
	if dsn == "" {
		t.Skip("INKBASE_TEST_POSTGRES not set — skipping Postgres integration test")
	}

	store, err := NewPostgresStore(dsn)
	if err != nil {
		t.Fatalf("NewPostgresStore: %v", err)
	}

	ctx := context.Background()
	const userID int64 = 90001

	// Start clean — delete any leftover rows for this test user.
	for _, id := range []string{"pg-crud-1", "pg-crud-2"} {
		_ = store.Delete(ctx, userID, id)
	}

	t.Run("Create", func(t *testing.T) {
		doc := &Document{
			ID:        "pg-crud-1",
			UserID:    userID,
			Title:     "Postgres Novel",
			Content:   "The story begins here.",
			Excerpt:   "The story begins",
			WordCount: 4,
			Format:    FormatTXT,
			Branch: BranchInfo{
				Name:           "main",
				IsEdit:         false,
				PendingChanges: 0,
			},
		}
		if err := store.Create(ctx, doc); err != nil {
			t.Fatalf("Create: %v", err)
		}
	})

	t.Run("Get", func(t *testing.T) {
		doc, err := store.Get(ctx, userID, "pg-crud-1")
		if err != nil {
			t.Fatalf("Get: %v", err)
		}
		if doc.Title != "Postgres Novel" {
			t.Errorf("Title = %q, want %q", doc.Title, "Postgres Novel")
		}
		if doc.Branch.Name != "main" {
			t.Errorf("Branch.Name = %q, want %q", doc.Branch.Name, "main")
		}
		if doc.Branch.PendingChanges != 0 {
			t.Errorf("Branch.PendingChanges = %d, want 0", doc.Branch.PendingChanges)
		}
	})

	t.Run("Get_NotFound", func(t *testing.T) {
		_, err := store.Get(ctx, userID, "nonexistent")
		if err != ErrDocumentNotFound {
			t.Errorf("expected ErrDocumentNotFound, got %v", err)
		}
	})

	t.Run("List", func(t *testing.T) {
		// Create a second doc so List returns > 1.
		doc2 := &Document{
			ID:        "pg-crud-2",
			UserID:    userID,
			Title:     "Second Scroll",
			Content:   "Chapter two.",
			Excerpt:   "Chapter",
			WordCount: 2,
			Format:    FormatTXT,
			Branch: BranchInfo{
				Name:           "feature-branch",
				IsEdit:         true,
				PendingChanges: 5,
			},
		}
		if err := store.Create(ctx, doc2); err != nil {
			t.Fatalf("Create doc2: %v", err)
		}

		docs, err := store.ListMeta(ctx, userID)
		if err != nil {
			t.Fatalf("List: %v", err)
		}
		if len(docs) != 2 {
			t.Fatalf("List returned %d docs, want 2", len(docs))
		}
	})

	t.Run("Count", func(t *testing.T) {
		n, err := store.Count(ctx, userID)
		if err != nil {
			t.Fatalf("Count: %v", err)
		}
		if n != 2 {
			t.Errorf("Count = %d, want 2", n)
		}
	})

	t.Run("Update", func(t *testing.T) {
		doc, err := store.Get(ctx, userID, "pg-crud-1")
		if err != nil {
			t.Fatalf("Get for update: %v", err)
		}
		doc.Title = "Postgres Novel — Revised"
		doc.Branch.Name = "revise-ch1"
		doc.Branch.IsEdit = true
		doc.Branch.PendingChanges = 2
		if err := store.Update(ctx, doc); err != nil {
			t.Fatalf("Update: %v", err)
		}

		got, err := store.Get(ctx, userID, "pg-crud-1")
		if err != nil {
			t.Fatalf("Get after update: %v", err)
		}
		if got.Title != "Postgres Novel — Revised" {
			t.Errorf("Title after update = %q, want %q", got.Title, "Postgres Novel — Revised")
		}
		if got.Branch.PendingChanges != 2 {
			t.Errorf("Branch.PendingChanges after update = %d, want 2", got.Branch.PendingChanges)
		}
	})

	t.Run("Update_NotFound", func(t *testing.T) {
		fake := &Document{
			ID:     "nonexistent",
			UserID: userID,
			Title:  "ghost",
		}
		if err := store.Update(ctx, fake); err != ErrDocumentNotFound {
			t.Errorf("expected ErrDocumentNotFound, got %v", err)
		}
	})

	t.Run("Delete", func(t *testing.T) {
		if err := store.Delete(ctx, userID, "pg-crud-1"); err != nil {
			t.Fatalf("Delete: %v", err)
		}
		_, err := store.Get(ctx, userID, "pg-crud-1")
		if err != ErrDocumentNotFound {
			t.Errorf("expected ErrDocumentNotFound after delete, got %v", err)
		}
	})

	t.Run("Delete_NotFound", func(t *testing.T) {
		// Deleting a nonexistent doc should not error.
		if err := store.Delete(ctx, userID, "already-gone"); err != nil {
			t.Errorf("unexpected error deleting nonexistent doc: %v", err)
		}
	})

	t.Run("Migration_Idempotent", func(t *testing.T) {
		// Boot a second store pointing at the same DB — should not error.
		store2, err := NewPostgresStore(dsn)
		if err != nil {
			t.Fatalf("second NewPostgresStore: %v", err)
		}
		n, err := store2.Count(ctx, userID)
		if err != nil {
			t.Fatalf("Count from second store: %v", err)
		}
		if n != 1 {
			t.Errorf("Count from second store = %d, want 1", n)
		}
	})

	t.Run("DifferentUser_Isolation", func(t *testing.T) {
		const otherUser int64 = 90002
		_ = store.Delete(ctx, otherUser, "pg-crud-2")

		doc := &Document{
			ID:     "pg-crud-2",
			UserID: otherUser,
			Title:  "Other user doc",
			Branch: BranchInfo{Name: "main"},
		}
		if err := store.Create(ctx, doc); err != nil {
			t.Fatalf("Create for other user: %v", err)
		}

		// Other user can see their own doc.
		got, err := store.Get(ctx, otherUser, "pg-crud-2")
		if err != nil {
			t.Fatalf("Get for other user: %v", err)
		}
		if got.Title != "Other user doc" {
			t.Errorf("other user doc Title = %q", got.Title)
		}

		// Original user cannot see other user's doc.
		_, err = store.Get(ctx, userID, "pg-crud-2")
		if err != ErrDocumentNotFound {
			t.Errorf("expected ErrDocumentNotFound across users, got %v", err)
		}

		// Cleanup.
		_ = store.Delete(ctx, otherUser, "pg-crud-2")
	})
}
