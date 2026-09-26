package api_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"inkbase/server/internal/api"
)

// ---------------------------------------------------------------------------
// Export filename tests: hostile titles must not escape into the
// Content-Disposition header.
// ---------------------------------------------------------------------------

func TestHTTPExportFilenameSanitized(t *testing.T) {
	handler := api.New()
	srv := httptest.NewServer(handler)
	defer srv.Close()

	client := &http.Client{}
	newUser := func() string {
		t.Helper()
		email := fmt.Sprintf("export_name_%d@inkbase.com", time.Now().UnixNano())
		regBody := fmt.Sprintf(`{"email":%q,"password":"Password123!"}`, email)
		regResp, err := client.Post(srv.URL+"/api/auth/register", "application/json", strings.NewReader(regBody))
		if err != nil {
			t.Fatalf("register: %v", err)
		}
		defer regResp.Body.Close()
		if regResp.StatusCode != http.StatusCreated {
			t.Fatalf("register status: %d", regResp.StatusCode)
		}
		for _, c := range regResp.Cookies() {
			if c.Name == "inkbase_session" {
				return c.Value
			}
		}
		t.Fatal("missing session cookie")
		return ""
	}

	create := func(sessionCookie, title string) string {
		body, _ := json.Marshal(map[string]any{"title": title, "content": "x"})
		req, _ := http.NewRequest(http.MethodPost, srv.URL+"/api/documents", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.AddCookie(&http.Cookie{Name: "inkbase_session", Value: sessionCookie})
		res, err := client.Do(req)
		if err != nil {
			t.Fatalf("create %q: %v", title, err)
		}
		defer res.Body.Close()
		if res.StatusCode != http.StatusCreated {
			t.Fatalf("create %q status: %d", title, res.StatusCode)
		}
		var created struct {
			Document struct {
				ID string `json:"id"`
			} `json:"document"`
		}
		_ = json.NewDecoder(res.Body).Decode(&created)
		return created.Document.ID
	}

	exportHeader := func(sessionCookie, docID string) string {
		req, _ := http.NewRequest(http.MethodGet, srv.URL+"/api/documents/"+docID+"/export?format=txt", nil)
		req.AddCookie(&http.Cookie{Name: "inkbase_session", Value: sessionCookie})
		res, err := client.Do(req)
		if err != nil {
			t.Fatalf("export %s: %v", docID, err)
		}
		defer res.Body.Close()
		if res.StatusCode != http.StatusOK {
			t.Fatalf("export status: %d", res.StatusCode)
		}
		return res.Header.Get("Content-Disposition")
	}

	assertSafe := func(header string) {
		t.Helper()
		// Exactly the two delimiter quotes, no header breaks, no paths.
		if strings.Count(header, `"`) != 2 {
			t.Fatalf("header %q must carry exactly two delimiter quotes", header)
		}
		for _, bad := range []string{"/", "\\", "\r", "\n", ".."} {
			if strings.Contains(header, bad) {
				t.Fatalf("header %q contains %q", header, bad)
			}
		}
		if !strings.HasPrefix(header, `attachment; filename="`) || !strings.HasSuffix(header, `"`) {
			t.Fatalf("unexpected disposition shape: %q", header)
		}
		stem := strings.TrimSuffix(strings.TrimPrefix(header, `attachment; filename="`), `"`)
		for _, r := range stem {
			if r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z' || r >= '0' && r <= '9' || r == '-' || r == '_' || r == '.' {
				continue
			}
			t.Fatalf("stem %q carries unsafe rune %q", stem, r)
		}
	}

	cases := []struct {
		title string
		want  string // exact expected disposition, or "" for fallback-to-id
	}{
		{"../../etc/passwd", `attachment; filename="etc_passwd.txt"`},
		{`a"` + "\r\nX-Injected: 1", `attachment; filename="a_X-Injected_1.txt"`},
		{"My Chapter One", `attachment; filename="My_Chapter_One.txt"`},
		{"!!!", ""}, // falls back to doc id
		{strings.Repeat("a", 200), `attachment; filename="` + strings.Repeat("a", 80) + `.txt"`},
	}

	for _, tc := range cases {
		sessionCookie := newUser()
		id := create(sessionCookie, tc.title)
		header := exportHeader(sessionCookie, id)
		assertSafe(header)
		if tc.want != "" && header != tc.want {
			t.Errorf("title %q: got %q, want %q", tc.title, header, tc.want)
		}
		if tc.want == "" && !strings.HasSuffix(header, ".txt\"") {
			t.Errorf("fallback header should end with .txt\": %q", header)
		}
		if tc.want == "" && strings.Contains(header, "!") {
			t.Errorf("fallback header leaks title chars: %q", header)
		}
	}
}
