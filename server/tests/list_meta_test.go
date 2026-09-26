package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"inkbase/server/internal/api"
	"inkbase/server/services/documents"
)

// ---------------------------------------------------------------------------
// Metadata-only list tests: card grids must never pay for document bodies.
// ---------------------------------------------------------------------------

func TestListMetaExcludesBody(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	ctx := context.Background()
	userID := freshUserID()

	body := strings.Repeat("body-word ", 200000) // ~2MB body
	doc, err := svc.Create(ctx, userID, documents.CreateRequest{
		Title:   "Heavy Doc",
		Content: body,
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}

	metas, err := svc.ListMeta(ctx, userID)
	if err != nil {
		t.Fatalf("ListMeta: %v", err)
	}
	if len(metas) != 1 {
		t.Fatalf("expected 1 meta, got %d", len(metas))
	}
	if metas[0].ID != doc.ID || metas[0].Title != "Heavy Doc" {
		t.Fatalf("meta identity mismatch: %+v", metas[0])
	}
	if metas[0].Excerpt == "" || metas[0].WordCount <= 0 {
		t.Fatalf("meta missing derived fields: %+v", metas[0])
	}

	// The body is still retrievable in full via Get.
	full, err := svc.Get(ctx, userID, doc.ID)
	if err != nil {
		t.Fatalf("get: %v", err)
	}
	if full.Content != body {
		t.Fatalf("Get body mismatch: %d vs %d bytes", len(full.Content), len(body))
	}
}

// TestHTTPListPayloadHasNoContentKey asserts the wire format carries no
// "content" key per item and stays small even with a megabyte body.
func TestHTTPListPayloadHasNoContentKey(t *testing.T) {
	handler := api.New()
	srv := httptest.NewServer(handler)
	defer srv.Close()

	client := &http.Client{}
	email := fmt.Sprintf("list_meta_%d@inkbase.com", time.Now().UnixNano())
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
		req, _ := http.NewRequest(method, srv.URL+path, bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{Name: "inkbase_session", Value: sessionCookie})
		res, err := client.Do(req)
		if err != nil {
			t.Fatalf("%s %s: %v", method, path, err)
		}
		return res
	}

	bigBody, _ := json.Marshal(map[string]any{
		"title":   "Heavy",
		"content": strings.Repeat("w ", 500000), // ~1MB
	})
	createResp := doAuth(http.MethodPost, "/api/documents", bigBody)
	if createResp.StatusCode != http.StatusCreated {
		t.Fatalf("create status: %d", createResp.StatusCode)
	}
	createResp.Body.Close()

	listReq, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/documents", nil)
	listReq.AddCookie(&http.Cookie{Name: "inkbase_session", Value: sessionCookie})
	listResp, err := client.Do(listReq)
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	defer listResp.Body.Close()
	if listResp.StatusCode != http.StatusOK {
		t.Fatalf("list status: %d", listResp.StatusCode)
	}
	raw, _ := io.ReadAll(listResp.Body)
	if len(raw) > 100<<10 {
		t.Fatalf("list payload %d bytes for 1MB body — body leaked into list", len(raw))
	}
	var envelope struct {
		Documents []map[string]any `json:"documents"`
	}
	if err := json.Unmarshal(raw, &envelope); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(envelope.Documents) != 1 {
		t.Fatalf("expected 1 doc, got %d", len(envelope.Documents))
	}
	if _, ok := envelope.Documents[0]["content"]; ok {
		t.Fatal("list item carries content key")
	}
	if envelope.Documents[0]["excerpt"] == "" {
		t.Fatal("list item missing excerpt")
	}
}
