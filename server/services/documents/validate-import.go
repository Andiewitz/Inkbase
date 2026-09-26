package documents

import (
	"archive/zip"
	"bytes"
	"errors"
	"fmt"
	"io"
)

// Bounded import limits. Raw uploads are small (manuscripts), while archives
// can expand dramatically — so both the compressed input and the
// decompressed output are capped, plus a ratio tripwire for hostile zips.
const (
	// maxImportBytes caps the raw uploaded file presented to ParseDocument.
	maxImportBytes = 10 << 20 // 10MB
	// maxImportBodyBytes caps the whole multipart request body at the HTTP
	// layer (file + multipart overhead). Kept in internal/api/documents.go;
	// this constant documents the pairing — both must move together.
	// maxImportBodyBytes = 12 << 20
	maxZipEntries        = 200
	maxDecompressedBytes = 50 << 20 // 50MB total across all archive entries
	maxCompressionRatio  = 100.0
	maxChapterBytes      = 5 << 20 // 5MB per EPUB chapter/file read
)

var (
	ErrImportTooLarge    = errors.New("import exceeds size limits")
	ErrTooManyEntries    = errors.New("import archive has too many entries")
	ErrDecompressionBomb = errors.New("import archive fails decompression safety checks")
	ErrEmptyImport       = errors.New("import file is empty")
	ErrUnparseable       = errors.New("file could not be parsed")
)

// checkZipBounds rejects hostile archives before any entry is decompressed:
// too many entries, excessive total output, or an absurd compression ratio.
// data must be the complete raw upload; it is only inspected, never expanded.
func checkZipBounds(data []byte) error {
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return fmt.Errorf("%w: invalid archive", ErrUnparseable)
	}
	if len(zr.File) > maxZipEntries {
		return ErrTooManyEntries
	}
	var decompressed, compressed uint64
	for _, f := range zr.File {
		decompressed += f.UncompressedSize64
		compressed += f.CompressedSize64
	}
	if decompressed > maxDecompressedBytes {
		return ErrDecompressionBomb
	}
	if compressed > 0 && float64(decompressed)/float64(compressed) > maxCompressionRatio {
		return ErrDecompressionBomb
	}
	return nil
}

// readBounded reads r up to limit bytes and fails closed when the stream is
// longer, so a lying size header can never cause unbounded allocation.
func readBounded(r io.Reader, limit int64) ([]byte, error) {
	data, err := io.ReadAll(io.LimitReader(r, limit+1))
	if err != nil {
		return nil, fmt.Errorf("read bounded stream: %w", err)
	}
	if int64(len(data)) > limit {
		return nil, ErrImportTooLarge
	}
	return data, nil
}
