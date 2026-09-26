package documents

import docdb "inkbase/server/services/documents/db"

// Domain shape and persistence both live in db/ (one owner, per service
// boundaries Rule 5). The aliases below keep the service's public surface —
// used by handlers and tests — stable: documents.Document and friends keep
// resolving while the implementation lives in db/. Persistence constructors
// (NewMemoryStore, NewPostgresStore, NewStoreFromEnv) are intentionally NOT
// re-exported: callers must import db/ explicitly so store ownership is
// visible at every construction site.

type (
	Document       = docdb.Document
	DocumentMeta   = docdb.DocumentMeta
	BranchInfo     = docdb.BranchInfo
	DocumentFormat = docdb.DocumentFormat
)

const (
	FreeTierLimit = docdb.FreeTierLimit

	FormatDocx = docdb.FormatDocx
	FormatPDF  = docdb.FormatPDF
	FormatTXT  = docdb.FormatTXT
	FormatMD   = docdb.FormatMD
	FormatEPUB = docdb.FormatEPUB
	FormatRTF  = docdb.FormatRTF
	FormatODT  = docdb.FormatODT
)

var (
	ErrDocumentNotFound    = docdb.ErrDocumentNotFound
	ErrStorageLimitReached = docdb.ErrStorageLimitReached
	ErrInvalidFormat       = docdb.ErrInvalidFormat
	ErrInvalidTitle        = docdb.ErrInvalidTitle
	ErrDocumentConflict    = docdb.ErrDocumentConflict
)

var (
	NormalizeFormat    = docdb.NormalizeFormat
	MetaOf             = docdb.MetaOf
	CalculateWordCount = docdb.CalculateWordCount
	GenerateExcerpt    = docdb.GenerateExcerpt
)
