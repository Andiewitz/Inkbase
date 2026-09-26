package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strings"

	"inkbase/server/services/documents"
	"inkbase/server/shared"
)

// maxImportBodyBytes caps the whole multipart upload body (file + overhead).
// It sits above documents.maxImportBytes (10MB file cap) so legitimate
// uploads never trip the transport limit first.
const maxImportBodyBytes = 12 << 20

func handleListDocuments(svc *documents.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
			return
		}

		docs, err := svc.ListMeta(r.Context(), userID)
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not list documents"})
			return
		}
		shared.WriteJSON(w, http.StatusOK, map[string]any{
			"documents": docs,
			"limit":     documents.FreeTierLimit,
		})
	}
}

func handleCreateDocument(svc *documents.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
			return
		}

		var req documents.CreateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
			return
		}

		doc, err := svc.Create(r.Context(), userID, req)
		if errors.Is(err, documents.ErrStorageLimitReached) {
			shared.WriteJSON(w, http.StatusForbidden, map[string]string{"error": err.Error()})
			return
		}
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not create document"})
			return
		}

		shared.WriteJSON(w, http.StatusCreated, map[string]any{
			"document": doc,
		})
	}
}

func handleImportDocument(svc *documents.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
			return
		}

		// Bound the multipart body before parsing so a hostile upload cannot
		// exhaust server memory at the transport layer.
		r.Body = http.MaxBytesReader(w, r.Body, maxImportBodyBytes)
		if err := r.ParseMultipartForm(maxImportBodyBytes); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "could not parse file upload"})
			return
		}

		file, header, err := r.FormFile("file")
		if err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "missing 'file' in upload form"})
			return
		}
		defer file.Close()

		doc, err := svc.Import(r.Context(), userID, header.Filename, file)
		if errors.Is(err, documents.ErrStorageLimitReached) {
			shared.WriteJSON(w, http.StatusForbidden, map[string]string{"error": err.Error()})
			return
		}
		if errors.Is(err, documents.ErrImportTooLarge) {
			shared.WriteJSON(w, http.StatusRequestEntityTooLarge, map[string]string{"error": err.Error()})
			return
		}
		if errors.Is(err, documents.ErrInvalidFormat) ||
			errors.Is(err, documents.ErrEmptyImport) ||
			errors.Is(err, documents.ErrUnparseable) ||
			errors.Is(err, documents.ErrTooManyEntries) ||
			errors.Is(err, documents.ErrDecompressionBomb) {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
			return
		}
		if err != nil {
			log.Printf("import file: %v", err)
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not import file"})
			return
		}

		shared.WriteJSON(w, http.StatusCreated, map[string]any{
			"document": doc,
		})
	}
}

func handleGetDocument(svc *documents.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
			return
		}

		docID := r.PathValue("id")
		if docID == "" {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "missing document id"})
			return
		}

		doc, err := svc.Get(r.Context(), userID, docID)
		if errors.Is(err, documents.ErrDocumentNotFound) {
			shared.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "document not found"})
			return
		}
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not retrieve document"})
			return
		}

		shared.WriteJSON(w, http.StatusOK, map[string]any{
			"document": doc,
		})
	}
}

func handleUpdateDocument(svc *documents.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
			return
		}

		docID := r.PathValue("id")
		if docID == "" {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "missing document id"})
			return
		}

		var req documents.UpdateRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
			return
		}

		doc, err := svc.Update(r.Context(), userID, docID, req)
		if errors.Is(err, documents.ErrDocumentNotFound) {
			shared.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "document not found"})
			return
		}
		if errors.Is(err, documents.ErrDocumentConflict) {
			shared.WriteJSON(w, http.StatusConflict, map[string]any{
				"error":    err.Error(),
				"conflict": true,
				"document": doc,
			})
			return
		}
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not update document"})
			return
		}

		shared.WriteJSON(w, http.StatusOK, map[string]any{
			"document": doc,
		})
	}
}

func handleDeleteDocument(svc *documents.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
			return
		}

		docID := r.PathValue("id")
		if docID == "" {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "missing document id"})
			return
		}

		err := svc.Delete(r.Context(), userID, docID)
		if errors.Is(err, documents.ErrDocumentNotFound) {
			shared.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "document not found"})
			return
		}
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not delete document"})
			return
		}

		shared.WriteJSON(w, http.StatusOK, map[string]bool{"ok": true})
	}
}

func handleExportDocument(svc *documents.Service) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := UserIDFromContext(r.Context())
		if !ok {
			shared.WriteJSON(w, http.StatusUnauthorized, map[string]string{"error": "not authenticated"})
			return
		}

		docID := r.PathValue("id")
		if docID == "" {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "missing document id"})
			return
		}

		doc, err := svc.Get(r.Context(), userID, docID)
		if errors.Is(err, documents.ErrDocumentNotFound) {
			shared.WriteJSON(w, http.StatusNotFound, map[string]string{"error": "document not found"})
			return
		}
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not retrieve document"})
			return
		}

		formatParam := r.URL.Query().Get("format")
		if formatParam == "" {
			formatParam = string(doc.Format)
		}
		format, err := documents.NormalizeFormat(formatParam)
		if err != nil {
			shared.WriteJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid format parameter"})
			return
		}

		data, contentType, err := documents.ExportDocument(doc, format)
		if err != nil {
			shared.WriteJSON(w, http.StatusInternalServerError, map[string]string{"error": fmt.Sprintf("export error: %v", err)})
			return
		}

		safeTitle := strings.ReplaceAll(doc.Title, " ", "_")
		safeTitle = filepath.Clean(safeTitle)
		filename := fmt.Sprintf("%s.%s", safeTitle, format)

		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(data)
	}
}
