package documents

import (
	"context"
	"strings"
	"time"
)

type UpdateRequest struct {
	Title         *string         `json:"title,omitempty"`
	Content       *string         `json:"content,omitempty"`
	Branch        *BranchInfo     `json:"branch,omitempty"`
	Format        *DocumentFormat `json:"format,omitempty"`
	BaseUpdatedAt *time.Time      `json:"base_updated_at,omitempty"`
}

// Update mutates an existing document, recalculating word count and excerpts if content is modified.
// When BaseUpdatedAt is set, the write is conditional and atomic: the store
// commits only if no newer revision exists. A stale base returns
// ErrDocumentConflict alongside the canonical server document, which is left
// unmutated. A nil base preserves legacy back-compat overwrite.
func (s *Service) Update(ctx context.Context, userID int64, docID string, req UpdateRequest) (*Document, error) {
	doc, err := s.store.Get(ctx, userID, docID)
	if err != nil {
		return nil, err
	}

	hasBase := req.BaseUpdatedAt != nil && !req.BaseUpdatedAt.IsZero()
	if hasBase && doc.UpdatedAt.UTC().After(req.BaseUpdatedAt.UTC()) {
		return doc, ErrDocumentConflict
	}

	if req.Title != nil {
		t := strings.TrimSpace(*req.Title)
		if t != "" {
			doc.Title = t
		}
	}

	if req.Content != nil {
		doc.Content = *req.Content
		doc.WordCount = CalculateWordCount(doc.Content)
		doc.Excerpt = GenerateExcerpt(doc.Content, 280)
	}

	if req.Branch != nil {
		doc.Branch = *req.Branch
	}

	if req.Format != nil && req.Format.IsValid() {
		doc.Format = *req.Format
	}

	doc.UpdatedAt = time.Now().UTC()

	if hasBase {
		if err := s.store.UpdateConditional(ctx, doc, *req.BaseUpdatedAt); err != nil {
			if err == ErrDocumentConflict {
				current, getErr := s.store.Get(ctx, userID, docID)
				if getErr != nil {
					return nil, getErr
				}
				return current, ErrDocumentConflict
			}
			return nil, err
		}
		return doc, nil
	}

	if err := s.store.Update(ctx, doc); err != nil {
		return nil, err
	}
	return doc, nil
}
