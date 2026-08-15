package documents

import (
	"context"
	"strings"
	"time"
)

type UpdateRequest struct {
	Title          *string     `json:"title,omitempty"`
	Content        *string     `json:"content,omitempty"`
	Branch         *BranchInfo `json:"branch,omitempty"`
	Format         *DocumentFormat `json:"format,omitempty"`
}

// Update mutates an existing document, recalculating word count and excerpts if content is modified.
func (s *Service) Update(ctx context.Context, userID int64, docID string, req UpdateRequest) (*Document, error) {
	doc, err := s.store.Get(ctx, userID, docID)
	if err != nil {
		return nil, err
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

	if err := s.store.Update(ctx, doc); err != nil {
		return nil, err
	}
	return doc, nil
}
