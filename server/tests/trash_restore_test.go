package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
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
// Recoverable trash tests: deletion hides, restore brings back identically.
// ---------------------------------------------------------------------------

func TestTrashRestoreRoundtrip(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	ctx := context.Background()
	userID := freshUserID()

	doc, err := svc.Create(ctx, userID, documents.CreateRequest{
		Title:   "Doomed Draft",
		Content: "precious words here",
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	if err := svc.Delete(ctx, userID, doc.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}

	// Hidden everywhere.
	if _, err := svc.Get(ctx, userID, doc.ID); !errors.Is(err, documents.ErrDocumentNotFound) {
		t.Fatalf("Get trashed should 404, got %v", err)
	}
	if metas, _ := svc.ListMeta(ctx, userID); len(metas) != 0 {
		t.Fatalf("ListMeta should hide trashed, got %d", len(metas))
	}
	if err := svc.Delete(ctx, userID, doc.ID); !errors.Is(err, documents.ErrDocumentNotFound) {
		t.Fatalf("re-delete of trashed should 404, got %v", err)
	}

	// Visible in trash listing.
	trash, err := svc.ListTrash(ctx, userID)
	if err != nil {
		t.Fatalf("ListTrash: %v", err)
	}
	if len(trash) != 1 || trash[0].ID != doc.ID {
		t.Fatalf("trash listing mismatch: %+v", trash)
	}

	// Restore brings it back identically.
	restored, err := svc.Restore(ctx, userID, doc.ID)
	if err != nil {
		t.Fatalf("restore: %v", err)
	}
	if restored.ID != doc.ID || restored.Content != "precious words here" {
		t.Fatalf("restored doc mismatch: %+v", restored)
	}
	got, err := svc.Get(ctx, userID, doc.ID)
	if err != nil || got.Content != "precious words here" {
		t.Fatalf("Get after restore: %v %+v", err, got)
	}
}

func TestRestoreActiveIsIdempotent(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	ctx := context.Background()
	userID := freshUserID()

	doc, err := svc.Create(ctx, userID, documents.CreateRequest{Title: "T", Content: "c"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	got, err := svc.Restore(ctx, userID, doc.ID)
	if err != nil || got.ID != doc.ID {
		t.Fatalf("restore active should succeed idempotently: %v", err)
	}
}

func TestRestoreMissingIsNotFound(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	ctx := context.Background()

	if _, err := svc.Restore(ctx, freshUserID(), "nope"); !errors.Is(err, documents.ErrDocumentNotFound) {
		t.Fatalf("expected NotFound, got %v", err)
	}
}

func TestTrashIsOwnerScoped(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	ctx := context.Background()
	owner, other := freshUserID(), freshUserID()

	doc, err := svc.Create(ctx, owner, documents.CreateRequest{Title: "T", Content: "c"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := svc.Delete(ctx, owner, doc.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}

	if _, err := svc.Restore(ctx, other, doc.ID); !errors.Is(err, documents.ErrDocumentNotFound) {
		t.Fatalf("cross-user restore should 404, got %v", err)
	}
	if trash, _ := svc.ListTrash(ctx, other); len(trash) != 0 {
		t.Fatalf("cross-user trash should be empty, got %d", len(trash))
	}
	// Owner can still recover.
	if _, err := svc.Restore(ctx, owner, doc.ID); err != nil {
		t.Fatalf("owner restore: %v", err)
	}
}

func TestUpdateTrashedIsNotFound(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	ctx := context.Background()
	userID := freshUserID()

	doc, err := svc.Create(ctx, userID, documents.CreateRequest{Title: "T", Content: "c"})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if err := svc.Delete(ctx, userID, doc.ID); err != nil {
		t.Fatalf("delete: %v", err)
	}
	content := "resurrection"
	if _, err := svc.Update(ctx, userID, doc.ID, documents.UpdateRequest{Content: &content}); !errors.Is(err, documents.ErrDocumentNotFound) {
		t.Fatalf("update trashed should 404, got %v", err)
	}
}

func TestDeleteFreesQuota(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	ctx := context.Background()
	userID := freshUserID()

	var first string
	for i := 0; i < documents.FreeTierLimit; i++ {
		d, err := svc.Create(ctx, userID, documents.CreateRequest{Title: fmt.Sprintf("D%d", i), Content: "c"})
		if err != nil {
			t.Fatalf("fill %d: %v", i, err)
		}
		if i == 0 {
			first = d.ID
		}
	}
	if err := svc.Delete(ctx, userID, first); err != nil {
		t.Fatalf("delete: %v", err)
	}
	if _, err := svc.Create(ctx, userID, documents.CreateRequest{Title: "Again", Content: "c"}); err != nil {
		t.Fatalf("create after delete should fit in quota: %v", err)
	}
}

// TestHTTPRestoreEndpoint exercises DELETE → 404 → restore → 200 plus the
// ?trash=1 recovery listing through the real mux.
func TestHTTPRestoreEndpoint(t *testing.T) {
	handler := api.New()
	srv := httptest.NewServer(handler)
	defer srv.Close()

	client := &http.Client{}
	email := fmt.Sprintf("trash_%d@inkbase.com", time.Now().UnixNano())
	regBody := fmt.Sprintf(`{"email":%q,"password":"Password123!"}`, email)
	regResp, err := client.Post(srv.URL+"/api/auth/register", "application/json", strings.NewReader(regBody))
	if err != nil {
		t.Fatalf("register: %v", err)
	}
	if regResp.StatusCode != http.StatusCreated {
		t.Fatalf("register status: %d", regResp.StatusCode)
	}
	var sessionCookie string
	for _, c := range regResp.Cookies() {
		if c.Name == "inkbase_session" {
			sessionCookie = c.Value
		}
	}
	regResp.Body.Close()

	doAuth := func(method, path string, body []byte) *http.Response {
		var rdr *bytes.Reader
		if body != nil {
			rdr = bytes.NewReader(body)
		} else {
			rdr = bytes.NewReader(nil)
		}
		req, _ := http.NewRequest(method, srv.URL+path, rdr)
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{Name: "inkbase_session", Value: sessionCookie})
		res, err := client.Do(req)
		if err != nil {
			t.Fatalf("%s %s: %v", method, path, err)
		}
		return res
	}

	createBody, _ := json.Marshal(map[string]any{"title": "Trash Me", "content": "salvageable"})
	createResp := doAuth(http.MethodPost, "/api/documents", createBody)
	if createResp.StatusCode != http.StatusCreated {
		t.Fatalf("create status: %d", createResp.StatusCode)
	}
	var created struct {
		Document struct {
			ID      string `json:"id"`
			Content string `json:"content"`
		} `json:"document"`
	}
	_ = json.NewDecoder(createResp.Body).Decode(&created)
	createResp.Body.Close()

	delResp := doAuth(http.MethodDelete, "/api/documents/"+created.Document.ID, nil)
	delResp.Body.Close()
	if delResp.StatusCode != http.StatusOK {
		t.Fatalf("delete status: %d", delResp.StatusCode)
	}

	getGone := doAuth(http.MethodGet, "/api/documents/"+created.Document.ID, nil)
	getGone.Body.Close()
	if getGone.StatusCode != http.StatusNotFound {
		t.Fatalf("get trashed should 404, got %d", getGone.StatusCode)
	}

	trashResp := doAuth(http.MethodGet, "/api/documents?trash=1", nil)
	var trashData struct {
		Documents []map[string]any `json:"documents"`
	}
	_ = json.NewDecoder(trashResp.Body).Decode(&trashData)
	trashResp.Body.Close()
	if len(trashData.Documents) != 1 {
		t.Fatalf("expected 1 trashed doc, got %d", len(trashData.Documents))
	}
	if _, ok := trashData.Documents[0]["content"]; ok {
		t.Fatal("trash item carries content key")
	}

	restoreResp := doAuth(http.MethodPost, "/api/documents/"+created.Document.ID+"/restore", nil)
	var restored struct {
		Document struct {
			Content string `json:"content"`
		} `json:"document"`
	}
	_ = json.NewDecoder(restoreResp.Body).Decode(&restored)
	restoreResp.Body.Close()
	if restoreResp.StatusCode != http.StatusOK {
		t.Fatalf("restore status: %d", restoreResp.StatusCode)
	}
	if restored.Document.Content != "salvageable" {
		t.Fatalf("restored content mismatch: %q", restored.Document.Content)
	}

	getBack := doAuth(http.MethodGet, "/api/documents/"+created.Document.ID, nil)
	getBack.Body.Close()
	if getBack.StatusCode != http.StatusOK {
		t.Fatalf("get restored should 200, got %d", getBack.StatusCode)
	}
}
