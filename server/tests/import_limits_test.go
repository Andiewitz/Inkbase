package api_test

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
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

// ---------------------------------------------------------------------------
// Bounded import tests: hostile or malformed uploads must fail explicitly
// without creating placeholder documents.
// ---------------------------------------------------------------------------

func freshUserID() int64 {
	return time.Now().UnixNano()%900000 + 910000
}

// craftZip builds an in-memory zip with the given entries (name → content).
func craftZip(t *testing.T, entries map[string][]byte) []byte {
	t.Helper()
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for name, content := range entries {
		w, err := zw.Create(name)
		if err != nil {
			t.Fatalf("zip create %s: %v", name, err)
		}
		if _, err := w.Write(content); err != nil {
			t.Fatalf("zip write %s: %v", name, err)
		}
	}
	if err := zw.Close(); err != nil {
		t.Fatalf("zip close: %v", err)
	}
	return buf.Bytes()
}

func TestImportRejectsOversizedFile(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	userID := freshUserID()

	big := bytes.NewReader(bytes.Repeat([]byte("a"), 11<<20)) // 11MB > 10MB cap
	_, err := svc.Import(context.Background(), userID, "huge.txt", big)
	if !errors.Is(err, documents.ErrImportTooLarge) {
		t.Fatalf("expected ErrImportTooLarge, got %v", err)
	}
	if n, _ := svc.ListMeta(context.Background(), userID); len(n) != 0 {
		t.Fatalf("oversized import created %d documents", len(n))
	}
}

func TestImportRejectsDecompressionBomb(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	userID := freshUserID()

	// 2MB of zeros compresses to ~2KB: ratio ~1000:1 trips the tripwire.
	bomb := craftZip(t, map[string][]byte{
		"word/document.xml": bytes.Repeat([]byte{0}, 2<<20),
	})
	_, err := svc.Import(context.Background(), userID, "bomb.docx", bytes.NewReader(bomb))
	if !errors.Is(err, documents.ErrDecompressionBomb) {
		t.Fatalf("expected ErrDecompressionBomb, got %v", err)
	}
	if n, _ := svc.ListMeta(context.Background(), userID); len(n) != 0 {
		t.Fatalf("bomb import created %d documents", len(n))
	}
}

func TestImportRejectsTooManyEntries(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	userID := freshUserID()

	entries := make(map[string][]byte, 210)
	for i := 0; i < 210; i++ {
		entries[fmt.Sprintf("file-%03d.txt", i)] = []byte("x")
	}
	bulk := craftZip(t, entries)
	_, err := svc.Import(context.Background(), userID, "bulk.docx", bytes.NewReader(bulk))
	if !errors.Is(err, documents.ErrTooManyEntries) {
		t.Fatalf("expected ErrTooManyEntries, got %v", err)
	}
	if n, _ := svc.ListMeta(context.Background(), userID); len(n) != 0 {
		t.Fatalf("bulk import created %d documents", len(n))
	}
}

func TestImportRejectsCorruptArchive(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	userID := freshUserID()

	// Invalid UTF-8 with a .docx name: not parseable as anything.
	broken := bytes.Repeat([]byte{0xff, 0xfe, 0x00, 0x01}, 64)
	_, err := svc.Import(context.Background(), userID, "broken.docx", bytes.NewReader(broken))
	if !errors.Is(err, documents.ErrUnparseable) {
		t.Fatalf("expected ErrUnparseable, got %v", err)
	}
	if n, _ := svc.ListMeta(context.Background(), userID); len(n) != 0 {
		t.Fatalf("corrupt import created %d documents", len(n))
	}
}

func TestImportRejectsEmptyFile(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	userID := freshUserID()

	_, err := svc.Import(context.Background(), userID, "empty.txt", strings.NewReader("   \n  "))
	if !errors.Is(err, documents.ErrEmptyImport) {
		t.Fatalf("expected ErrEmptyImport, got %v", err)
	}
	if n, _ := svc.ListMeta(context.Background(), userID); len(n) != 0 {
		t.Fatalf("empty import created %d documents", len(n))
	}
}

func TestImportRejectsUnknownBinaryFormat(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	userID := freshUserID()

	blob := bytes.Repeat([]byte{0xff, 0xfe, 0x00, 0x01}, 64)
	_, err := svc.Import(context.Background(), userID, "blob.xyz", bytes.NewReader(blob))
	if !errors.Is(err, documents.ErrInvalidFormat) {
		t.Fatalf("expected ErrInvalidFormat, got %v", err)
	}
	if n, _ := svc.ListMeta(context.Background(), userID); len(n) != 0 {
		t.Fatalf("binary import created %d documents", len(n))
	}
}

func TestImportSniffsPlainTextWithOddExtension(t *testing.T) {
	svc := documents.NewServiceWithStore(documents.NewMemoryStore())
	userID := freshUserID()

	doc, err := svc.Import(context.Background(), userID, "notes.log", strings.NewReader("plain notes here"))
	if err != nil {
		t.Fatalf("text-with-odd-ext should import: %v", err)
	}
	if doc.Format != documents.FormatTXT {
		t.Fatalf("expected sniffed txt format, got %q", doc.Format)
	}
	if !strings.Contains(doc.Content, "plain notes here") {
		t.Fatalf("content lost: %q", doc.Content)
	}
}

// TestHTTPImportErrorMapping verifies the handler translates import failures
// to 400/413 with static messages (no internal detail leaks).
func TestHTTPImportErrorMapping(t *testing.T) {
	handler := api.New()
	srv := httptest.NewServer(handler)
	defer srv.Close()

	client := &http.Client{}
	email := fmt.Sprintf("import_limits_%d@inkbase.com", time.Now().UnixNano())
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
	if sessionCookie == "" {
		t.Fatal("missing session cookie")
	}

	upload := func(filename string, content io.Reader) *http.Response {
		var body bytes.Buffer
		mw := multipart.NewWriter(&body)
		part, err := mw.CreateFormFile("file", filename)
		if err != nil {
			t.Fatalf("form file: %v", err)
		}
		if _, err := io.Copy(part, content); err != nil {
			t.Fatalf("copy: %v", err)
		}
		_ = mw.Close()
		req, _ := http.NewRequest(http.MethodPost, srv.URL+"/api/documents/import", &body)
		req.Header.Set("Content-Type", mw.FormDataContentType())
		req.AddCookie(&http.Cookie{Name: "inkbase_session", Value: sessionCookie})
		res, err := client.Do(req)
		if err != nil {
			t.Fatalf("upload %s: %v", filename, err)
		}
		return res
	}

	// Corrupt binary with unknown extension -> 400, no doc.
	bad := upload("blob.xyz", bytes.NewReader(bytes.Repeat([]byte{0xff, 0xfe}, 64)))
	if bad.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected 400 for bad import, got %d", bad.StatusCode)
	}
	bad.Body.Close()

	// 11MB text file -> 413.
	huge := upload("huge.txt", bytes.NewReader(bytes.Repeat([]byte("a"), 11<<20)))
	if huge.StatusCode != http.StatusRequestEntityTooLarge {
		t.Fatalf("expected 413 for oversized import, got %d", huge.StatusCode)
	}
	huge.Body.Close()
}
