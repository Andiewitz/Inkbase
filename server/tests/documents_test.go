package api_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"inkbase/server/internal/api"
	"inkbase/server/services/documents"
)

func TestDocumentFormats_Roundtrip(t *testing.T) {
	doc := &documents.Document{
		ID:        "doc-test-1",
		UserID:    100,
		Title:     "The Midnight Raven",
		Content:   "Once upon a midnight dreary, while I pondered, weak and weary.\nOver many a quaint and curious volume of forgotten lore.",
		Excerpt:   "Once upon a midnight dreary...",
		WordCount: 19,
		Format:    documents.FormatDocx,
	}

	formats := []documents.DocumentFormat{
		documents.FormatDocx,
		documents.FormatODT,
		documents.FormatEPUB,
		documents.FormatRTF,
		documents.FormatPDF,
		documents.FormatMD,
		documents.FormatTXT,
	}

	for _, fmtType := range formats {
		t.Run(string(fmtType), func(t *testing.T) {
			data, mimeType, err := documents.ExportDocument(doc, fmtType)
			if err != nil {
				t.Fatalf("ExportDocument failed for %s: %v", fmtType, err)
			}
			if len(data) == 0 {
				t.Fatalf("Exported data is empty for %s", fmtType)
			}
			if mimeType == "" {
				t.Fatalf("Mime type is empty for %s", fmtType)
			}

			// Parse it back
			filename := "test." + string(fmtType)
			extracted, _, err := documents.ParseDocument(filename, bytes.NewReader(data))
			if err != nil {
				t.Fatalf("ParseDocument failed for %s: %v", fmtType, err)
			}
			if !strings.Contains(extracted, "Once upon a midnight dreary") {
				t.Fatalf("Extracted text missing expected content for %s: %q", fmtType, extracted)
			}
		})
	}
}

func TestDocumentService_CRUD_And_TierLimits(t *testing.T) {
	ctx := context.Background()
	store := documents.NewMemoryStore()
	svc := documents.NewServiceWithStore(store)

	userID := int64(42)

	// 1. Create 3 docs (up to limit)
	doc1, err := svc.Create(ctx, userID, documents.CreateRequest{
		Title:   "Doc 1",
		Content: "Hello world this is test one",
		Format:  documents.FormatDocx,
	})
	if err != nil {
		t.Fatalf("Create doc 1: %v", err)
	}
	if doc1.WordCount != 6 {
		t.Errorf("expected 6 words, got %d", doc1.WordCount)
	}

	doc2, err := svc.Create(ctx, userID, documents.CreateRequest{
		Title:   "Doc 2",
		Content: "Second document content here",
		Format:  documents.FormatPDF,
	})
	if err != nil {
		t.Fatalf("Create doc 2: %v", err)
	}

	doc3, err := svc.Create(ctx, userID, documents.CreateRequest{
		Title:   "Doc 3",
		Content: "Third manuscript in the workspace",
		Format:  documents.FormatMD,
	})
	if err != nil {
		t.Fatalf("Create doc 3: %v", err)
	}
	if doc3 == nil {
		t.Fatal("expected doc3, got nil")
	}

	// 2. Fourth doc must exceed free tier limit (max 3)
	_, err = svc.Create(ctx, userID, documents.CreateRequest{
		Title:   "Doc 4",
		Content: "Should fail",
		Format:  documents.FormatTXT,
	})
	if err != documents.ErrStorageLimitReached {
		t.Fatalf("expected ErrStorageLimitReached, got %v", err)
	}

	// 3. List docs
	list, err := svc.List(ctx, userID)
	if err != nil {
		t.Fatalf("List: %v", err)
	}
	if len(list) != 3 {
		t.Fatalf("expected 3 documents, got %d", len(list))
	}

	// 4. Update doc 1
	newContent := "Updated content with more words now"
	updated, err := svc.Update(ctx, userID, doc1.ID, documents.UpdateRequest{
		Content: &newContent,
	})
	if err != nil {
		t.Fatalf("Update: %v", err)
	}
	if updated.WordCount != 6 {
		t.Errorf("expected 6 words, got %d", updated.WordCount)
	}
	if updated.Content != newContent {
		t.Errorf("content not updated")
	}

	// 5. Delete doc 2
	if err := svc.Delete(ctx, userID, doc2.ID); err != nil {
		t.Fatalf("Delete doc 2: %v", err)
	}

	// 6. Now doc 4 creation should succeed
	doc4, err := svc.Create(ctx, userID, documents.CreateRequest{
		Title:   "Doc 4",
		Content: "Now it fits",
		Format:  documents.FormatTXT,
	})
	if err != nil {
		t.Fatalf("Create doc 4 after deletion: %v", err)
	}
	if doc4 == nil {
		t.Fatalf("expected doc4, got nil")
	}
}

func TestDocuments_API_Integration(t *testing.T) {
	handler := api.New()
	srv := httptest.NewServer(handler)
	defer srv.Close()

	// Register user & get session cookie with unique email
	email := fmt.Sprintf("docs_tester_%d@inkbase.com", time.Now().UnixNano())
	regBody := fmt.Sprintf(`{"email":%q,"password":"password123!"}`, email)
	resp, err := http.Post(srv.URL+"/api/auth/register", "application/json", strings.NewReader(regBody))
	if err != nil {
		t.Fatalf("register request: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("register failed: status %d", resp.StatusCode)
	}

	var sessionCookie *http.Cookie
	for _, c := range resp.Cookies() {
		if c.Name == "inkbase_session" {
			sessionCookie = c
			break
		}
	}
	if sessionCookie == nil {
		t.Fatal("missing inkbase_session cookie")
	}

	client := &http.Client{}

	// 1. Unauthenticated request to /api/documents returns 401
	unauthReq, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/documents", nil)
	unauthResp, err := client.Do(unauthReq)
	if err != nil {
		t.Fatalf("unauth get: %v", err)
	}
	if unauthResp.StatusCode != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", unauthResp.StatusCode)
	}

	// 2. Create document via API
	createBody := `{"title":"My Novel Chapter 1","content":"It was a dark and stormy night.","format":"md"}`
	createReq, _ := http.NewRequest(http.MethodPost, srv.URL+"/api/documents", strings.NewReader(createBody))
	createReq.Header.Set("Content-Type", "application/json")
	createReq.AddCookie(sessionCookie)

	createResp, err := client.Do(createReq)
	if err != nil {
		t.Fatalf("create document: %v", err)
	}
	if createResp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d", createResp.StatusCode)
	}

	var created struct {
		Document documents.Document `json:"document"`
	}
	json.NewDecoder(createResp.Body).Decode(&created)
	createResp.Body.Close()

	docID := created.Document.ID
	if docID == "" {
		t.Fatal("expected non-empty docID")
	}

	// 3. Import file via multipart form
	var b bytes.Buffer
	w := multipart.NewWriter(&b)
	part, err := w.CreateFormFile("file", "imported_essay.txt")
	if err != nil {
		t.Fatalf("create form file: %v", err)
	}
	part.Write([]byte("Inkbase is PR reviews for writers."))
	w.Close()

	importReq, _ := http.NewRequest(http.MethodPost, srv.URL+"/api/documents/import", &b)
	importReq.Header.Set("Content-Type", w.FormDataContentType())
	importReq.AddCookie(sessionCookie)

	importResp, err := client.Do(importReq)
	if err != nil {
		t.Fatalf("import request: %v", err)
	}
	if importResp.StatusCode != http.StatusCreated {
		t.Fatalf("import failed: status %d", importResp.StatusCode)
	}
	importResp.Body.Close()

	// 4. List documents
	listReq, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/documents", nil)
	listReq.AddCookie(sessionCookie)
	listResp, err := client.Do(listReq)
	if err != nil {
		t.Fatalf("list docs: %v", err)
	}
	if listResp.StatusCode != http.StatusOK {
		t.Fatalf("list failed: %d", listResp.StatusCode)
	}

	var listData struct {
		Documents []documents.Document `json:"documents"`
		Limit     int                  `json:"limit"`
	}
	json.NewDecoder(listResp.Body).Decode(&listData)
	listResp.Body.Close()

	if len(listData.Documents) != 2 {
		t.Fatalf("expected 2 documents, got %d", len(listData.Documents))
	}

	// 5. Export document
	exportReq, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/documents/"+docID+"/export?format=docx", nil)
	exportReq.AddCookie(sessionCookie)
	exportResp, err := client.Do(exportReq)
	if err != nil {
		t.Fatalf("export doc: %v", err)
	}
	if exportResp.StatusCode != http.StatusOK {
		t.Fatalf("export status: %d", exportResp.StatusCode)
	}
	exportBody, _ := io.ReadAll(exportResp.Body)
	exportResp.Body.Close()
	if len(exportBody) == 0 {
		t.Fatal("expected non-empty export body")
	}

	// 6. Delete document
	delReq, _ := http.NewRequest(http.MethodDelete, srv.URL+"/api/documents/"+docID, nil)
	delReq.AddCookie(sessionCookie)
	delResp, err := client.Do(delReq)
	if err != nil {
		t.Fatalf("delete doc: %v", err)
	}
	if delResp.StatusCode != http.StatusOK {
		t.Fatalf("delete status: %d", delResp.StatusCode)
	}
	delResp.Body.Close()
}

func TestDocumentImport_FormattingAndIndentationPreserved(t *testing.T) {
	// Test Plaintext / Markdown with indentation and headings
	rawMD := "# Chapter 1: The Awakening\n\n\tIt was a dark and stormy night.\n\n    Four spaces of indentation on the second paragraph.\n\n## Section 1.1\n\nDialogue:\n\t\"Look at that,\" she whispered."
	extractedMD, _, err := documents.ParseDocument("chapter1.md", strings.NewReader(rawMD))
	if err != nil {
		t.Fatalf("Parse MD failed: %v", err)
	}

	if !strings.Contains(extractedMD, "# Chapter 1: The Awakening") {
		t.Errorf("Expected heading 1 preserved in MD import")
	}
	if !strings.Contains(extractedMD, "\tIt was a dark and stormy night.") {
		t.Errorf("Expected tab indentation preserved in MD import")
	}
	if !strings.Contains(extractedMD, "    Four spaces of indentation") {
		t.Errorf("Expected 4-space indentation preserved in MD import")
	}

	// Test RTF with tabs and paragraph breaks
	rawRTF := `{\rtf1\ansi\deff0 {\fonttbl{\f0 Times New Roman;}}\f0\fs24 # Heading Title\par\tab First paragraph with tab.\par\tab Second paragraph with tab.}`
	extractedRTF, _, err := documents.ParseDocument("test.rtf", strings.NewReader(rawRTF))
	if err != nil {
		t.Fatalf("Parse RTF failed: %v", err)
	}

	if !strings.Contains(extractedRTF, "\tFirst paragraph with tab.") {
		t.Errorf("Expected tab preserved in RTF import. Got: %q", extractedRTF)
	}
	if !strings.Contains(extractedRTF, "\n\n") {
		t.Errorf("Expected double newline paragraph break in RTF import. Got: %q", extractedRTF)
	}
}

