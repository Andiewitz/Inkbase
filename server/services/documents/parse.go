package documents

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"html"
	"io"
	"path/filepath"
	"strconv"
	"strings"
	"unicode/utf8"

	pdfread "github.com/dslipak/pdf"
)

// ParseDocument inspects filename extension or file content to extract structured text.
func ParseDocument(filename string, r io.Reader) (string, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return "", fmt.Errorf("read file data: %w", err)
	}

	if len(data) == 0 {
		return "", nil
	}

	ext := strings.ToLower(filepath.Ext(filename))
	format, err := NormalizeFormat(ext)
	if err != nil {
		format = sniffFormat(data)
	}

	var content string
	switch format {
	case FormatTXT, FormatMD:
		content = parsePlainText(data)
	case FormatDocx:
		content, err = parseDocx(data)
	case FormatODT:
		content, err = parseODT(data)
	case FormatEPUB:
		content, err = parseEPUB(data)
	case FormatRTF:
		content = parseRTF(data)
	case FormatPDF:
		content, err = parsePDF(data)
	default:
		if utf8.Valid(data) {
			content = parsePlainText(data)
		} else {
			return "", fmt.Errorf("%w: %s", ErrInvalidFormat, ext)
		}
	}

	if err != nil {
		if utf8.Valid(data) {
			clean := parsePlainText(data)
			if len(clean) > 0 {
				return clean, nil
			}
		}
		baseName := filepath.Base(filename)
		return fmt.Sprintf("Imported from %s (%s format)", baseName, strings.ToUpper(string(format))), nil
	}

	cleanContent := strings.TrimSpace(content)
	if cleanContent == "" {
		cleanContent = fmt.Sprintf("Imported document: %s", filepath.Base(filename))
	}
	return cleanContent, nil
}

func sniffFormat(data []byte) DocumentFormat {
	limit := len(data)
	if limit > 1024 {
		limit = 1024
	}
	if bytes.Contains(data[:limit], []byte("%PDF-")) {
		return FormatPDF
	}
	if bytes.HasPrefix(data, []byte("{\\rtf")) {
		return FormatRTF
	}
	if bytes.HasPrefix(data, []byte("PK\x03\x04")) {
		zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
		if err == nil {
			for _, f := range zr.File {
				if strings.Contains(f.Name, "word/document.xml") {
					return FormatDocx
				}
				if f.Name == "content.xml" {
					return FormatODT
				}
				if strings.HasPrefix(f.Name, "META-INF/") || strings.HasSuffix(f.Name, ".opf") {
					return FormatEPUB
				}
			}
		}
	}
	if utf8.Valid(data) {
		return FormatTXT
	}
	return ""
}

func parsePlainText(data []byte) string {
	trimmed := bytes.TrimPrefix(data, []byte("\xef\xbb\xbf"))
	return string(trimmed)
}

// --- DOCX Parser ---

func parseDocx(data []byte) (string, error) {
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("invalid docx archive: %w", err)
	}

	var docFiles []*zip.File
	for _, f := range zr.File {
		if f.Name == "word/document.xml" {
			docFiles = append([]*zip.File{f}, docFiles...)
		}
	}
	if len(docFiles) == 0 {
		for _, f := range zr.File {
			if strings.HasPrefix(f.Name, "word/") && strings.HasSuffix(f.Name, ".xml") {
				docFiles = append(docFiles, f)
			}
		}
	}
	if len(docFiles) == 0 {
		return "", fmt.Errorf("missing word/document.xml in docx archive")
	}

	var sb strings.Builder
	for _, f := range docFiles {
		rc, err := f.Open()
		if err != nil {
			continue
		}
		decoder := xml.NewDecoder(rc)
		decoder.Strict = false

		var inParagraph, inText bool
		var headingLevel int
		var pHasContent bool

		for {
			token, err := decoder.Token()
			if err != nil {
				break
			}
			switch elem := token.(type) {
			case xml.StartElement:
				switch elem.Name.Local {
				case "p":
					inParagraph = true
					headingLevel = 0
					pHasContent = false
				case "pStyle":
					for _, attr := range elem.Attr {
						if attr.Name.Local == "val" {
							val := strings.ToLower(attr.Value)
							if strings.Contains(val, "heading1") || strings.Contains(val, "title") {
								headingLevel = 1
							} else if strings.Contains(val, "heading2") {
								headingLevel = 2
							} else if strings.Contains(val, "heading3") {
								headingLevel = 3
							}
						}
					}
				case "t":
					inText = true
					if inParagraph && !pHasContent {
						if headingLevel == 1 {
							sb.WriteString("# ")
						} else if headingLevel == 2 {
							sb.WriteString("## ")
						} else if headingLevel == 3 {
							sb.WriteString("### ")
						}
					}
				case "tab":
					sb.WriteString("\t")
					pHasContent = true
				case "br", "cr":
					sb.WriteString("\n")
				}
			case xml.EndElement:
				switch elem.Name.Local {
				case "p":
					if inParagraph {
						sb.WriteString("\n\n")
						inParagraph = false
						headingLevel = 0
					}
				case "t":
					inText = false
				}
			case xml.CharData:
				if inText || inParagraph {
					sb.Write(elem)
					if len(bytes.TrimSpace(elem)) > 0 {
						pHasContent = true
					}
				}
			}
		}
		rc.Close()
	}
	return strings.TrimSpace(sb.String()), nil
}

// --- ODT Parser ---

func parseODT(data []byte) (string, error) {
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("invalid odt archive: %w", err)
	}
	var contentFile *zip.File
	for _, f := range zr.File {
		if f.Name == "content.xml" {
			contentFile = f
			break
		}
	}
	if contentFile == nil {
		return "", fmt.Errorf("missing content.xml in odt archive")
	}
	rc, err := contentFile.Open()
	if err != nil {
		return "", fmt.Errorf("open content.xml: %w", err)
	}
	defer rc.Close()

	decoder := xml.NewDecoder(rc)
	decoder.Strict = false
	var sb strings.Builder
	var inParagraph bool
	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}
		switch elem := token.(type) {
		case xml.StartElement:
			if elem.Name.Local == "p" || elem.Name.Local == "h" {
				inParagraph = true
				if elem.Name.Local == "h" {
					for _, attr := range elem.Attr {
						if attr.Name.Local == "outline-level" {
							lvl, _ := strconv.Atoi(attr.Value)
							if lvl == 1 {
								sb.WriteString("# ")
							} else if lvl == 2 {
								sb.WriteString("## ")
							} else if lvl >= 3 {
								sb.WriteString("### ")
							}
						}
					}
				}
			} else if elem.Name.Local == "tab" {
				sb.WriteString("\t")
			} else if elem.Name.Local == "line-break" {
				sb.WriteString("\n")
			} else if elem.Name.Local == "s" {
				count := 1
				for _, attr := range elem.Attr {
					if attr.Name.Local == "c" {
						if n, err := strconv.Atoi(attr.Value); err == nil && n > 0 {
							count = n
						}
					}
				}
				sb.WriteString(strings.Repeat(" ", count))
			}
		case xml.EndElement:
			if elem.Name.Local == "p" || elem.Name.Local == "h" {
				if inParagraph {
					sb.WriteString("\n\n")
					inParagraph = false
				}
			}
		case xml.CharData:
			if inParagraph {
				sb.Write(elem)
			}
		}
	}
	return strings.TrimSpace(sb.String()), nil
}

// --- EPUB Parser ---

func parseEPUB(data []byte) (string, error) {
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("invalid epub archive: %w", err)
	}
	var sb strings.Builder
	for _, f := range zr.File {
		ext := strings.ToLower(filepath.Ext(f.Name))
		if ext == ".xhtml" || ext == ".html" || ext == ".htm" {
			rc, err := f.Open()
			if err != nil {
				continue
			}
			htmlData, err := io.ReadAll(rc)
			rc.Close()
			if err == nil {
				text := extractHTMLText(htmlData)
				if len(text) > 0 {
					sb.WriteString(text)
					sb.WriteString("\n\n")
				}
			}
		}
	}
	return strings.TrimSpace(sb.String()), nil
}

func extractHTMLText(data []byte) string {
	decoder := xml.NewDecoder(bytes.NewReader(data))
	decoder.Strict = false
	decoder.Entity = xml.HTMLEntity
	var sb strings.Builder
	var skip bool
	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}
		switch elem := token.(type) {
		case xml.StartElement:
			tag := strings.ToLower(elem.Name.Local)
			if tag == "script" || tag == "style" || tag == "head" {
				skip = true
			} else if tag == "br" {
				sb.WriteString("\n")
			} else if tag == "h1" {
				sb.WriteString("\n\n# ")
			} else if tag == "h2" {
				sb.WriteString("\n\n## ")
			} else if tag == "h3" {
				sb.WriteString("\n\n### ")
			} else if tag == "p" || tag == "div" || tag == "li" {
				sb.WriteString("\n\n")
			}
		case xml.EndElement:
			tag := strings.ToLower(elem.Name.Local)
			if tag == "script" || tag == "style" || tag == "head" {
				skip = false
			}
		case xml.CharData:
			if !skip {
				sb.WriteString(html.UnescapeString(string(elem)))
			}
		}
	}
	return strings.TrimSpace(sb.String())
}

// --- RTF Parser ---

func parseRTF(data []byte) string {
	raw := string(data)
	var sb strings.Builder
	var controlWord strings.Builder
	var groupDepth int
	var inIgnorableGroup bool
	var ignorableDepth int

	i := 0
	n := len(raw)
	for i < n {
		ch := raw[i]
		if ch == '{' {
			groupDepth++
			i++
			if i+1 < n && raw[i] == '\\' && raw[i+1] == '*' {
				inIgnorableGroup = true
				ignorableDepth = groupDepth
			}
			continue
		}
		if ch == '}' {
			if inIgnorableGroup && groupDepth == ignorableDepth {
				inIgnorableGroup = false
			}
			groupDepth--
			i++
			continue
		}
		if inIgnorableGroup {
			i++
			continue
		}
		if ch == '\\' {
			i++
			if i >= n {
				break
			}
			next := raw[i]
			if next == '\\' || next == '{' || next == '}' {
				sb.WriteByte(next)
				i++
				continue
			}
			if next == '\'' && i+2 < n {
				hexStr := raw[i+1 : i+3]
				val, err := strconv.ParseUint(hexStr, 16, 8)
				if err == nil {
					sb.WriteByte(byte(val))
				}
				i += 3
				continue
			}
			if next == 'u' && i+1 < n && (raw[i+1] == '-' || (raw[i+1] >= '0' && raw[i+1] <= '9')) {
				i++
				numStr := ""
				if raw[i] == '-' {
					numStr += "-"
					i++
				}
				for i < n && raw[i] >= '0' && raw[i] <= '9' {
					numStr += string(raw[i])
					i++
				}
				if i < n && raw[i] == '?' {
					i++
				}
				if rNum, err := strconv.Atoi(numStr); err == nil {
					if rNum < 0 {
						rNum += 65536
					}
					sb.WriteRune(rune(rNum))
				}
				continue
			}
			controlWord.Reset()
			for i < n && ((raw[i] >= 'a' && raw[i] <= 'z') || (raw[i] >= 'A' && raw[i] <= 'Z')) {
				controlWord.WriteByte(raw[i])
				i++
			}
			if i < n && (raw[i] == '-' || (raw[i] >= '0' && raw[i] <= '9')) {
				if raw[i] == '-' {
					i++
				}
				for i < n && raw[i] >= '0' && raw[i] <= '9' {
					i++
				}
			}
			if i < n && raw[i] == ' ' {
				i++
			}
			word := strings.ToLower(controlWord.String())
			switch word {
			case "par", "line", "sect":
				sb.WriteString("\n\n")
			case "tab":
				sb.WriteString("\t")
			case "fonttbl", "colortbl", "stylesheet", "info", "themedata", "xmlopen":
				inIgnorableGroup = true
				ignorableDepth = groupDepth
			}
			continue
		}
		if ch == '\r' || ch == '\n' {
			i++
			continue
		}
		sb.WriteByte(ch)
		i++
	}
	return strings.TrimSpace(sb.String())
}

// --- PDF Parser ---

func parsePDF(data []byte) (string, error) {
	limit := len(data)
	if limit > 1024 {
		limit = 1024
	}
	if !bytes.Contains(data[:limit], []byte("%PDF-")) {
		return "", fmt.Errorf("invalid pdf header")
	}

	r, err := pdfread.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("open pdf: %w", err)
	}

	textReader, err := r.GetPlainText()
	if err != nil {
		return "", fmt.Errorf("extract pdf text: %w", err)
	}

	extracted, err := io.ReadAll(textReader)
	if err != nil {
		return "", fmt.Errorf("read extracted pdf text: %w", err)
	}

	return strings.TrimSpace(string(extracted)), nil
}
