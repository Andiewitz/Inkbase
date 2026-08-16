package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"inkbase/server/internal/api"
	"inkbase/server/services/documents"
)

// ---------------------------------------------------------------------------
// Document Sync, Optimistic Concurrency & Zero Data Loss Tests
// ---------------------------------------------------------------------------

func strPtr(s string) *string {
	return &s
}

// TestSyncServerSourceOfTruthRejectsStaleWrite verifies that when a client
// sends an update based on a stale timestamp (server is ahead), the server
// returns 409 Conflict with the canonical document to prevent silent data loss.
func TestSyncServerSourceOfTruthRejectsStaleWrite(t *testing.T) {
	ctx := context.Background()
	store := documents.NewMemoryStore()
	svc := documents.NewServiceWithStore(store)

	const userID int64 = 1

	// Initial document
	doc, err := svc.Create(ctx, userID, documents.CreateRequest{
		Title:   "Chapter 1 - The Beginning",
		Content: "Initial draft written at T0.",
	})
	if err != nil {
		t.Fatalf("Failed to create document: %v", err)
	}

	t0 := doc.UpdatedAt

	// Client A makes a valid update at T1
	time.Sleep(10 * time.Millisecond)
	docA, err := svc.Update(ctx, userID, doc.ID, documents.UpdateRequest{
		Content:       strPtr("Client A canonical edits."),
		BaseUpdatedAt: &t0,
	})
	if err != nil {
		t.Fatalf("Client A update failed: %v", err)
	}

	t1 := docA.UpdatedAt
	if !t1.After(t0) {
		t.Fatalf("Expected T1 (%v) to be after T0 (%v)", t1, t0)
	}

	// Client B (who was offline or holding stale T0 state) attempts to save
	_, errStale := svc.Update(ctx, userID, doc.ID, documents.UpdateRequest{
		Content:       strPtr("Client B stale overwrite attempt."),
		BaseUpdatedAt: &t0, // sending stale T0
	})

	if errStale != documents.ErrDocumentConflict {
		t.Fatalf("Expected ErrDocumentConflict for stale write, got: %v", errStale)
	}

	// Verify server content remains Client A's version (Zero Data Loss)
	currentDoc, err := svc.Get(ctx, userID, doc.ID)
	if err != nil {
		t.Fatalf("Failed to get document: %v", err)
	}

	if currentDoc.Content != "Client A canonical edits." {
		t.Errorf("DATA LOSS DETECTED: Server document was corrupted. Expected 'Client A canonical edits.', got '%s'", currentDoc.Content)
	}
}

// TestSyncResyncWorkflow verifies that when Client B encounters a 409 Conflict,
// Client B receives the canonical server state, resyncs, and can then cleanly submit new changes.
func TestSyncResyncWorkflow(t *testing.T) {
	ctx := context.Background()
	store := documents.NewMemoryStore()
	svc := documents.NewServiceWithStore(store)

	const userID int64 = 1

	doc, err := svc.Create(ctx, userID, documents.CreateRequest{
		Title:   "Co-authored Manuscript",
		Content: "Base content.",
	})
	if err != nil {
		t.Fatalf("Failed to create document: %v", err)
	}

	baseTime := doc.UpdatedAt

	// Server version moves ahead (e.g. edited from mobile/cloud)
	time.Sleep(10 * time.Millisecond)
	cloudDoc, err := svc.Update(ctx, userID, doc.ID, documents.UpdateRequest{
		Content:       strPtr("Base content + Cloud additions."),
		BaseUpdatedAt: &baseTime,
	})
	if err != nil {
		t.Fatalf("Cloud update failed: %v", err)
	}

	cloudTime := cloudDoc.UpdatedAt

	// Local client attempts update with baseTime -> Conflict
	conflictDoc, err := svc.Update(ctx, userID, doc.ID, documents.UpdateRequest{
		Content:       strPtr("Base content + Local additions."),
		BaseUpdatedAt: &baseTime,
	})

	if err != documents.ErrDocumentConflict {
		t.Fatalf("Expected conflict, got %v", err)
	}
	if conflictDoc == nil || conflictDoc.Content != "Base content + Cloud additions." {
		t.Fatalf("Expected canonical cloud doc in conflict return, got %v", conflictDoc)
	}

	// Client resyncs: sets base timestamp to cloudTime and applies merged edits
	mergedDoc, err := svc.Update(ctx, userID, doc.ID, documents.UpdateRequest{
		Content:       strPtr("Base content + Cloud additions + Local merged additions."),
		BaseUpdatedAt: &cloudTime,
	})

	if err != nil {
		t.Fatalf("Failed to save after resync: %v", err)
	}

	if mergedDoc.Content != "Base content + Cloud additions + Local merged additions." {
		t.Errorf("Merged content mismatch. Got: %s", mergedDoc.Content)
	}
}

// TestHTTPUpdateConflictEndpoint verifies the HTTP API returns 409 Conflict with the document JSON.
func TestHTTPUpdateConflictEndpoint(t *testing.T) {
	handler := api.New()
	srv := httptest.NewServer(handler)
	defer srv.Close()

	client := &http.Client{}

	// Register a test user with unique email
	email := fmt.Sprintf("sync_author_%d@inkbase.com", time.Now().UnixNano())
	regBody := fmt.Sprintf(`{"email":%q,"password":"Password123!"}`, email)
	regResp, err := client.Post(srv.URL+"/api/auth/register", "application/json", strings.NewReader(regBody))
	if err != nil {
		t.Fatalf("Register error: %v", err)
	}
	if regResp.StatusCode != http.StatusCreated {
		t.Fatalf("Register failed: %d", regResp.StatusCode)
	}

	sessionCookie := ""
	for _, c := range regResp.Cookies() {
		if c.Name == "inkbase_session" {
			sessionCookie = c.Value
		}
	}
	if sessionCookie == "" {
		t.Fatal("Missing inkbase_session cookie")
	}

	// Helper to send authenticated request
	doAuth := func(method, path string, body []byte) *http.Response {
		req, _ := http.NewRequest(method, srv.URL+path, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{Name: "inkbase_session", Value: sessionCookie})
		res, err := client.Do(req)
		if err != nil {
			t.Fatalf("Request %s %s failed: %v", method, path, err)
		}
		return res
	}

	// Create document
	createResp := doAuth(http.MethodPost, "/api/documents", []byte(`{"title":"Sync Test Doc","content":"Original text."}`))
	if createResp.StatusCode != http.StatusCreated {
		t.Fatalf("Create doc failed: %d", createResp.StatusCode)
	}

	var created struct {
		Document struct {
			ID        string    `json:"id"`
			Content   string    `json:"content"`
			UpdatedAt time.Time `json:"updated_at"`
		} `json:"document"`
	}
	_ = json.NewDecoder(createResp.Body).Decode(&created)
	docID := created.Document.ID
	t0 := created.Document.UpdatedAt

	// First update -> 200 OK
	time.Sleep(10 * time.Millisecond)
	up1Body, _ := json.Marshal(map[string]any{
		"content":         "Update 1 text.",
		"base_updated_at": t0,
	})
	up1Resp := doAuth(http.MethodPut, "/api/documents/"+docID, up1Body)
	if up1Resp.StatusCode != http.StatusOK {
		t.Fatalf("Update 1 failed: %d", up1Resp.StatusCode)
	}

	// Stale update sending t0 -> 409 Conflict
	up2Body, _ := json.Marshal(map[string]any{
		"content":         "Stale update attempt.",
		"base_updated_at": t0,
	})
	up2Resp := doAuth(http.MethodPut, "/api/documents/"+docID, up2Body)
	if up2Resp.StatusCode != http.StatusConflict {
		t.Fatalf("Expected 409 Conflict for stale update, got: %d", up2Resp.StatusCode)
	}

	var conflictResp struct {
		Conflict bool `json:"conflict"`
		Document struct {
			Content string `json:"content"`
		} `json:"document"`
	}
	_ = json.NewDecoder(up2Resp.Body).Decode(&conflictResp)
	if !conflictResp.Conflict {
		t.Error("Expected conflict: true in response body")
	}
	if conflictResp.Document.Content != "Update 1 text." {
		t.Errorf("Expected canonical content 'Update 1 text.', got '%s'", conflictResp.Document.Content)
	}
}
