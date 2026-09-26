package documents

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

type CreateRequest struct {
	Title   string         `json:"title"`
	Content string         `json:"content"`
	Format  DocumentFormat `json:"format"`
}

// Create generates a new document for the user, enforcing the free tier limit.
func (s *Service) Create(ctx context.Context, userID int64, req CreateRequest) (*Document, error) {
	title := strings.TrimSpace(req.Title)
	if title == "" {
		title = "Untitled Manuscript"
	}

	count, err := s.store.Count(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("check document limit: %w", err)
	}
	if count >= FreeTierLimit {
		return nil, ErrStorageLimitReached
	}

	format := req.Format
	if !format.IsValid() {
		format = FormatTXT
	}

	now := time.Now().UTC()
	doc := &Document{
		ID:        uuid.NewString(),
		UserID:    userID,
		Title:     title,
		Content:   req.Content,
		Excerpt:   GenerateExcerpt(req.Content, 280),
		WordCount: CalculateWordCount(req.Content),
		Format:    format,
		Branch: BranchInfo{
			Name:           "main",
			IsEdit:         false,
			PendingChanges: 0,
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.store.Create(ctx, doc); err != nil {
		return nil, fmt.Errorf("create document: %w", err)
	}
	return doc, nil
}

// Import parses an uploaded file stream and stores it as a new document.
// Content and format come from a single bounded ParseDocument call: unknown
// or corrupt input fails here with no document created — never a placeholder.
func (s *Service) Import(ctx context.Context, userID int64, filename string, r io.Reader) (*Document, error) {
	count, err := s.store.Count(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("check document limit: %w", err)
	}
	if count >= FreeTierLimit {
		return nil, ErrStorageLimitReached
	}

	content, format, err := ParseDocument(filename, r)
	if err != nil {
		return nil, err
	}

	// Derive title from filename without extension
	title := strings.TrimSuffix(filepath.Base(filename), filepath.Ext(filename))
	title = strings.TrimSpace(title)
	if title == "" {
		title = "Imported Document"
	}

	now := time.Now().UTC()
	doc := &Document{
		ID:        uuid.NewString(),
		UserID:    userID,
		Title:     title,
		Content:   content,
		Excerpt:   GenerateExcerpt(content, 280),
		WordCount: CalculateWordCount(content),
		Format:    format,
		Branch: BranchInfo{
			Name:           "main",
			IsEdit:         false,
			PendingChanges: 0,
		},
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.store.Create(ctx, doc); err != nil {
		return nil, fmt.Errorf("save imported document: %w", err)
	}
	return doc, nil
}
