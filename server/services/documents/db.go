package documents

import (
	"context"
	"fmt"
	"os"
	"sort"
	"strconv"
	"sync"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
)

// DocumentStore defines the persistence contract for manuscripts.
type DocumentStore interface {
	Create(ctx context.Context, doc *Document) error
	Get(ctx context.Context, userID int64, docID string) (*Document, error)
	List(ctx context.Context, userID int64) ([]*Document, error)
	Update(ctx context.Context, doc *Document) error
	Delete(ctx context.Context, userID int64, docID string) error
	Count(ctx context.Context, userID int64) (int, error)
}

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

// ─── DynamoDB Store (Production & AWS) ────────────────────────────────────────

type DynamoDBStore struct {
	client    *dynamodb.Client
	tableName string
}

func NewDynamoDBStore(client *dynamodb.Client, tableName string) *DynamoDBStore {
	if tableName == "" {
		tableName = "inkbase_documents"
	}
	return &DynamoDBStore{
		client:    client,
		tableName: tableName,
	}
}

func (d *DynamoDBStore) Create(ctx context.Context, doc *Document) error {
	item, err := attributevalue.MarshalMap(doc)
	if err != nil {
		return fmt.Errorf("marshal document item: %w", err)
	}

	_, err = d.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName: aws.String(d.tableName),
		Item:      item,
	})
	if err != nil {
		return fmt.Errorf("dynamodb put item: %w", err)
	}
	return nil
}

func (d *DynamoDBStore) Get(ctx context.Context, userID int64, docID string) (*Document, error) {
	out, err := d.client.GetItem(ctx, &dynamodb.GetItemInput{
		TableName: aws.String(d.tableName),
		Key: map[string]types.AttributeValue{
			"user_id": &types.AttributeValueMemberN{Value: strconv.FormatInt(userID, 10)},
			"id":      &types.AttributeValueMemberS{Value: docID},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("dynamodb get item: %w", err)
	}
	if len(out.Item) == 0 {
		return nil, ErrDocumentNotFound
	}

	var doc Document
	if err := attributevalue.UnmarshalMap(out.Item, &doc); err != nil {
		return nil, fmt.Errorf("unmarshal document item: %w", err)
	}
	return &doc, nil
}

func (d *DynamoDBStore) List(ctx context.Context, userID int64) ([]*Document, error) {
	out, err := d.client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(d.tableName),
		KeyConditionExpression: aws.String("user_id = :uid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":uid": &types.AttributeValueMemberN{Value: strconv.FormatInt(userID, 10)},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("dynamodb query: %w", err)
	}

	var docs []*Document
	if err := attributevalue.UnmarshalListOfMaps(out.Items, &docs); err != nil {
		return nil, fmt.Errorf("unmarshal documents: %w", err)
	}
	sort.Slice(docs, func(i, j int) bool {
		return docs[i].UpdatedAt.After(docs[j].UpdatedAt)
	})
	return docs, nil
}

func (d *DynamoDBStore) Update(ctx context.Context, doc *Document) error {
	item, err := attributevalue.MarshalMap(doc)
	if err != nil {
		return fmt.Errorf("marshal document: %w", err)
	}

	_, err = d.client.PutItem(ctx, &dynamodb.PutItemInput{
		TableName:           aws.String(d.tableName),
		Item:                item,
		ConditionExpression: aws.String("attribute_exists(id) AND attribute_exists(user_id)"),
	})
	if err != nil {
		var ccfe *types.ConditionalCheckFailedException
		if isConditionalCheckFailed(err, &ccfe) {
			return ErrDocumentNotFound
		}
		return fmt.Errorf("dynamodb update item: %w", err)
	}
	return nil
}

func (d *DynamoDBStore) Delete(ctx context.Context, userID int64, docID string) error {
	_, err := d.client.DeleteItem(ctx, &dynamodb.DeleteItemInput{
		TableName: aws.String(d.tableName),
		Key: map[string]types.AttributeValue{
			"user_id": &types.AttributeValueMemberN{Value: strconv.FormatInt(userID, 10)},
			"id":      &types.AttributeValueMemberS{Value: docID},
		},
	})
	if err != nil {
		return fmt.Errorf("dynamodb delete item: %w", err)
	}
	return nil
}

func (d *DynamoDBStore) Count(ctx context.Context, userID int64) (int, error) {
	out, err := d.client.Query(ctx, &dynamodb.QueryInput{
		TableName:              aws.String(d.tableName),
		KeyConditionExpression: aws.String("user_id = :uid"),
		ExpressionAttributeValues: map[string]types.AttributeValue{
			":uid": &types.AttributeValueMemberN{Value: strconv.FormatInt(userID, 10)},
		},
		Select: types.SelectCount,
	})
	if err != nil {
		return 0, fmt.Errorf("dynamodb count: %w", err)
	}
	return int(out.Count), nil
}

func isConditionalCheckFailed(err error, target **types.ConditionalCheckFailedException) bool {
	if err == nil {
		return false
	}
	var ccfe *types.ConditionalCheckFailedException
	if ok := isType(err, &ccfe); ok {
		*target = ccfe
		return true
	}
	return false
}

func isType[T any](err error, target *T) bool {
	if t, ok := err.(T); ok {
		*target = t
		return true
	}
	return false
}

// ─── Factory ─────────────────────────────────────────────────────────────────

// NewStoreFromEnv initializes DynamoDBStore or MemoryStore based on configuration.
func NewStoreFromEnv(ctx context.Context) (DocumentStore, error) {
	tableName := os.Getenv("DYNAMODB_TABLE_NAME")
	endpoint := os.Getenv("DYNAMODB_ENDPOINT")
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}

	useLocal := os.Getenv("DYNAMODB_LOCAL") == "true" || (tableName == "" && os.Getenv("APP_ENV") != "production")
	if useLocal && endpoint == "" {
		// Use in-memory store for seamless local dev and tests
		return NewMemoryStore(), nil
	}

	var optFns []func(*config.LoadOptions) error
	optFns = append(optFns, config.WithRegion(region))

	cfg, err := config.LoadDefaultConfig(ctx, optFns...)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}

	var clientOpts []func(*dynamodb.Options)
	if endpoint != "" {
		clientOpts = append(clientOpts, func(o *dynamodb.Options) {
			o.BaseEndpoint = aws.String(endpoint)
		})
	}

	client := dynamodb.NewFromConfig(cfg, clientOpts...)
	if tableName == "" {
		tableName = "inkbase_documents"
	}
	return NewDynamoDBStore(client, tableName), nil
}
