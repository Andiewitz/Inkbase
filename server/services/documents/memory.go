package documents

import (
	"context"
	"sort"
	"sync"
	"time"
)

// ─── Memory Store (Local Dev & Test) ─────────────────────────────────────────

type MemoryStore struct {
	mu   sync.RWMutex
	docs map[int64]map[string]*Document
}

func NewMemoryStore() *MemoryStore {
	now := time.Now()
	doc1 := &Document{
		ID:        "doc-dev-1",
		UserID:    1,
		Title:     "The Bronze and the Silver",
		Content:   "1\nMs. Gracie's voice was getting drowned out by traffic and tourists. Something about tensile strength. Cassidy sat on a bench near the railing, picking at the crust of her sandwich. Mark Statham leaned against the tower support like he was posing for a photo. He was eating an apple, slicing off neat little wedges with a pocketknife.\n\n\"Look at the span,\" Ms. Gracie said, pointing up with a rolled-up clipboard. \"Twelve hundred and eighty meters of suspended steel.\"",
		Excerpt:   "Ms. Gracie's voice was getting drowned out by traffic and tourists. Something about tensile strength. Cassidy sat on a bench near the railing, picking at the crust of her sandwich.",
		WordCount: 8420,
		Format:    FormatDocx,
		Branch: BranchInfo{
			Name:           "ch-03-rewrite",
			IsEdit:         true,
			PendingChanges: 4,
		},
		CreatedAt: now.Add(-48 * time.Hour),
		UpdatedAt: now.Add(-2 * time.Hour),
	}

	doc2 := &Document{
		ID:        "doc-dev-2",
		UserID:    1,
		Title:     "Dawn of Nothing",
		Content:   "The wind clawed at her coat as she stepped into the courtyard. Guards lined the walls, faces blank as stone. Somewhere beyond, the city waited.\n\nElira paused, steadying her breath. She wasn't sure she was ready for what came next. The letter trembled in her hands. It had changed everything.",
		Excerpt:   "The wind clawed at her coat as she stepped into the courtyard. Guards lined the walls, faces blank as stone. Somewhere beyond, the city waited.",
		WordCount: 42190,
		Format:    FormatPDF,
		Branch: BranchInfo{
			Name:           "main",
			IsEdit:         false,
			PendingChanges: 0,
		},
		CreatedAt: now.Add(-120 * time.Hour),
		UpdatedAt: now.Add(-24 * time.Hour),
	}

	userMap := map[string]*Document{
		doc1.ID: doc1,
		doc2.ID: doc2,
	}

	docs := map[int64]map[string]*Document{
		1: userMap,
	}

	return &MemoryStore{
		docs: docs,
	}
}

func (m *MemoryStore) Create(ctx context.Context, doc *Document) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	userMap, ok := m.docs[doc.UserID]
	if !ok {
		userMap = make(map[string]*Document)
		m.docs[doc.UserID] = userMap
	}
	cp := *doc
	userMap[doc.ID] = &cp
	return nil
}

func (m *MemoryStore) Get(ctx context.Context, userID int64, docID string) (*Document, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	userMap, ok := m.docs[userID]
	if !ok {
		return nil, ErrDocumentNotFound
	}
	doc, ok := userMap[docID]
	if !ok {
		return nil, ErrDocumentNotFound
	}
	cp := *doc
	return &cp, nil
}

func (m *MemoryStore) List(ctx context.Context, userID int64) ([]*Document, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	userMap, ok := m.docs[userID]
	if !ok {
		return []*Document{}, nil
	}
	list := make([]*Document, 0, len(userMap))
	for _, doc := range userMap {
		cp := *doc
		list = append(list, &cp)
	}
	sort.Slice(list, func(i, j int) bool {
		return list[i].UpdatedAt.After(list[j].UpdatedAt)
	})
	return list, nil
}

func (m *MemoryStore) Update(ctx context.Context, doc *Document) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	userMap, ok := m.docs[doc.UserID]
	if !ok {
		return ErrDocumentNotFound
	}
	if _, ok := userMap[doc.ID]; !ok {
		return ErrDocumentNotFound
	}
	cp := *doc
	userMap[doc.ID] = &cp
	return nil
}

// UpdateConditional atomically checks the stored UpdatedAt against the base
// under the write lock, so concurrent writers on one base cannot both win.
func (m *MemoryStore) UpdateConditional(ctx context.Context, doc *Document, baseUpdatedAt time.Time) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	userMap, ok := m.docs[doc.UserID]
	if !ok {
		return ErrDocumentNotFound
	}
	stored, ok := userMap[doc.ID]
	if !ok {
		return ErrDocumentNotFound
	}
	if stored.UpdatedAt.UTC().After(baseUpdatedAt.UTC()) {
		return ErrDocumentConflict
	}
	cp := *doc
	userMap[doc.ID] = &cp
	return nil
}

func (m *MemoryStore) Delete(ctx context.Context, userID int64, docID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	userMap, ok := m.docs[userID]
	if !ok {
		return nil
	}
	delete(userMap, docID)
	return nil
}

func (m *MemoryStore) Count(ctx context.Context, userID int64) (int, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	userMap, ok := m.docs[userID]
	if !ok {
		return 0, nil
	}
	return len(userMap), nil
}
