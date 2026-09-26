package docdb

import (
	"database/sql"
)

// isNotFound reports whether err is the driver's no-rows signal, so query
// call sites map it to ErrDocumentNotFound in one place instead of
// interpreting driver details ad hoc.
func isNotFound(err error) bool {
	return err == sql.ErrNoRows
}
