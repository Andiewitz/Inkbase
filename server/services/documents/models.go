package documents

import (
	"errors"
	"strings"
	"time"
	"unicode"
)

var (
	ErrDocumentNotFound    = errors.New("document not found")
	ErrStorageLimitReached = errors.New("free tier limit reached (maximum 3 documents)")
	ErrInvalidFormat       = errors.New("unsupported file format")
	ErrInvalidTitle        = errors.New("document title cannot be empty")
	ErrDocumentConflict    = errors.New("document has been updated on server; server is the source of truth")
)

const (
	FreeTierLimit = 3
)

type DocumentFormat string

const (
	FormatDocx DocumentFormat = "docx"
	FormatPDF  DocumentFormat = "pdf"
	FormatTXT  DocumentFormat = "txt"
	FormatMD   DocumentFormat = "md"
	FormatEPUB DocumentFormat = "epub"
	FormatRTF  DocumentFormat = "rtf"
	FormatODT  DocumentFormat = "odt"
)

// IsValid reports whether the format is supported.
func (f DocumentFormat) IsValid() bool {
	switch strings.ToLower(string(f)) {
	case string(FormatDocx), string(FormatPDF), string(FormatTXT),
		string(FormatMD), string(FormatEPUB), string(FormatRTF), string(FormatODT):
		return true
	default:
		return false
	}
}

// NormalizeFormat normalizes string to valid DocumentFormat or returns ErrInvalidFormat.
func NormalizeFormat(extOrMime string) (DocumentFormat, error) {
	ext := strings.ToLower(strings.TrimPrefix(extOrMime, "."))
	switch ext {
	case "docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		return FormatDocx, nil
	case "pdf", "application/pdf":
		return FormatPDF, nil
	case "txt", "text/plain":
		return FormatTXT, nil
	case "md", "markdown", "text/markdown":
		return FormatMD, nil
	case "epub", "application/epub+zip":
		return FormatEPUB, nil
	case "rtf", "application/rtf", "text/rtf":
		return FormatRTF, nil
	case "odt", "application/vnd.oasis.opendocument.text":
		return FormatODT, nil
	default:
		return "", ErrInvalidFormat
	}
}

type BranchInfo struct {
	Name           string `json:"name"`
	IsEdit         bool   `json:"is_edit"`
	PendingChanges int    `json:"pending_changes"`
}

type Document struct {
	ID        string         `json:"id"`
	UserID    int64          `json:"user_id"`
	Title     string         `json:"title"`
	Content   string         `json:"content"`
	Excerpt   string         `json:"excerpt"`
	WordCount int            `json:"word_count"`
	Format    DocumentFormat `json:"format"`
	Branch    BranchInfo     `json:"branch"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

// CalculateWordCount counts the words in a text body.
func CalculateWordCount(text string) int {
	fields := strings.Fields(text)
	return len(fields)
}

// GenerateExcerpt produces a clean preview snippet (up to maxLen chars).
func GenerateExcerpt(text string, maxLen int) string {
	clean := strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) {
			return ' '
		}
		return r
	}, text)
	clean = strings.Join(strings.Fields(clean), " ")
	if maxLen <= 0 {
		maxLen = 280
	}
	if len(clean) <= maxLen {
		return clean
	}
	// Slices at word boundary if possible
	snippet := clean[:maxLen]
	lastSpace := strings.LastIndex(snippet, " ")
	if lastSpace > maxLen/2 {
		snippet = snippet[:lastSpace]
	}
	return snippet + "..."
}
