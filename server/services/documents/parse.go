package documents

import (
	"archive/zip"
	"bytes"
	"compress/zlib"
	"encoding/xml"
	"fmt"
	"io"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"
)

// ParseDocument inspects filename extension or file content to extract plain text.
func ParseDocument(filename string, r io.Reader) (string, error) {
	data, err := io.ReadAll(r)
	if err != nil {
		return "", fmt.Errorf("read file data: %w", err)
	}

	ext := strings.ToLower(filepath.Ext(filename))
	format, err := NormalizeFormat(ext)
	if err != nil {
		// Fallback: Try sniffing magic bytes if extension is unknown
		format = sniffFormat(data)
	}

	switch format {
	case FormatTXT, FormatMD:
		return parsePlainText(data), nil
	case FormatDocx:
		return parseDocx(data)
	case FormatODT:
		return parseODT(data)
	case FormatEPUB:
		return parseEPUB(data)
	case FormatRTF:
		return parseRTF(data), nil
	case FormatPDF:
		return parsePDF(data)
	default:
		return "", fmt.Errorf("%w: %s", ErrInvalidFormat, ext)
	}
}

func sniffFormat(data []byte) DocumentFormat {
	if bytes.HasPrefix(data, []byte("%PDF-")) {
		return FormatPDF
	}
	if bytes.HasPrefix(data, []byte("{\\rtf")) {
		return FormatRTF
	}
	if bytes.HasPrefix(data, []byte("PK\x03\x04")) {
		// Zip-based format (docx, odt, epub)
		zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
		if err == nil {
			for _, f := range zr.File {
				if f.Name == "word/document.xml" {
					return FormatDocx
				}
				if f.Name == "content.xml" {
					return FormatODT
				}
				if strings.HasPrefix(f.Name, "META-INF/") {
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
	return strings.TrimSpace(string(data))
}

// ─── DOCX Parser ─────────────────────────────────────────────────────────────

func parseDocx(data []byte) (string, error) {
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("invalid docx archive: %w", err)
	}

	var docFile *zip.File
	for _, f := range zr.File {
		if f.Name == "word/document.xml" {
			docFile = f
			break
		}
	}
	if docFile == nil {
		return "", fmt.Errorf("missing word/document.xml in docx archive")
	}

	rc, err := docFile.Open()
	if err != nil {
		return "", fmt.Errorf("open word/document.xml: %w", err)
	}
	defer rc.Close()

	decoder := xml.NewDecoder(rc)
	var sb strings.Builder
	var inParagraph bool
	var inText bool

	for {
		token, err := decoder.Token()
		if err != nil {
			if err == io.EOF {
				break
			}
			return "", fmt.Errorf("decode docx xml: %w", err)
		}

		switch elem := token.(type) {
		case xml.StartElement:
			switch elem.Name.Local {
			case "p":
				inParagraph = true
			case "t":
				inText = true
			case "tab":
				sb.WriteString("\t")
			case "br", "cr":
				sb.WriteString("\n")
			}
		case xml.EndElement:
			switch elem.Name.Local {
			case "p":
				if inParagraph {
					sb.WriteString("\n")
					inParagraph = false
				}
			case "t":
				inText = false
			}
		case xml.CharData:
			if inText {
				sb.Write(elem)
			}
		}
	}

	return strings.TrimSpace(sb.String()), nil
}

// ─── ODT Parser ──────────────────────────────────────────────────────────────

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
	var sb strings.Builder
	var inParagraph bool

	for {
		token, err := decoder.Token()
		if err != nil {
			if err == io.EOF {
				break
			}
			return "", fmt.Errorf("decode odt xml: %w", err)
		}

		switch elem := token.(type) {
		case xml.StartElement:
			if elem.Name.Local == "p" || elem.Name.Local == "h" {
				inParagraph = true
			} else if elem.Name.Local == "tab" {
				sb.WriteString("\t")
			} else if elem.Name.Local == "line-break" {
				sb.WriteString("\n")
			}
		case xml.EndElement:
			if elem.Name.Local == "p" || elem.Name.Local == "h" {
				if inParagraph {
					sb.WriteString("\n")
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

// ─── EPUB Parser ─────────────────────────────────────────────────────────────

func parseEPUB(data []byte) (string, error) {
	zr, err := zip.NewReader(bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("invalid epub archive: %w", err)
	}

	var sb strings.Builder
	for _, f := range zr.File {
		name := strings.ToLower(f.Name)
		if strings.HasSuffix(name, ".xhtml") || strings.HasSuffix(name, ".html") || strings.HasSuffix(name, ".htm") {
			rc, err := f.Open()
			if err != nil {
				continue
			}
			content, _ := io.ReadAll(rc)
			rc.Close()

			text := stripHTMLTags(string(content))
			if text != "" {
				sb.WriteString(text)
				sb.WriteString("\n\n")
			}
		}
	}

	res := strings.TrimSpace(sb.String())
	if res == "" {
		return "", fmt.Errorf("no readable text content found in epub")
	}
	return res, nil
}

func stripHTMLTags(htmlContent string) string {
	var sb strings.Builder
	decoder := xml.NewDecoder(strings.NewReader(htmlContent))
	decoder.Strict = false
	decoder.AutoClose = xml.HTMLAutoClose
	decoder.Entity = xml.HTMLEntity

	for {
		token, err := decoder.Token()
		if err != nil {
			break
		}
		switch elem := token.(type) {
		case xml.StartElement:
			if elem.Name.Local == "p" || elem.Name.Local == "div" || elem.Name.Local == "h1" || elem.Name.Local == "h2" || elem.Name.Local == "h3" || elem.Name.Local == "li" {
				sb.WriteString("\n")
			} else if elem.Name.Local == "br" {
				sb.WriteString("\n")
			}
		case xml.EndElement:
			if elem.Name.Local == "p" || elem.Name.Local == "div" || elem.Name.Local == "h1" || elem.Name.Local == "h2" || elem.Name.Local == "h3" || elem.Name.Local == "li" {
				sb.WriteString("\n")
			}
		case xml.CharData:
			sb.Write(elem)
		}
	}
	return strings.TrimSpace(sb.String())
}

// ─── RTF Parser ──────────────────────────────────────────────────────────────

func parseRTF(data []byte) string {
	raw := string(data)
	var sb strings.Builder
	var inControl bool
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
			// Check if next is \* (ignorable destination like \*\themedata, \fonttbl, etc.)
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
			// Escaped characters
			if next == '\\' || next == '{' || next == '}' {
				sb.WriteByte(next)
				i++
				continue
			}

			// Hex escape \'xx
			if next == '\'' && i+2 < n {
				hexStr := raw[i+1 : i+3]
				val, err := strconv.ParseUint(hexStr, 16, 8)
				if err == nil {
					sb.WriteByte(byte(val))
				}
				i += 3
				continue
			}

			// Read control word
			controlWord.Reset()
			for i < n && ((raw[i] >= 'a' && raw[i] <= 'z') || (raw[i] >= 'A' && raw[i] <= 'Z')) {
				controlWord.WriteByte(raw[i])
				i++
			}
			// Read optional signed integer parameter
			if i < n && (raw[i] == '-' || (raw[i] >= '0' && raw[i] <= '9')) {
				if raw[i] == '-' {
					i++
				}
				for i < n && (raw[i] >= '0' && raw[i] <= '9') {
					i++
				}
			}
			// Optional trailing space is consumed as part of control word
			if i < n && raw[i] == ' ' {
				i++
			}

			word := controlWord.String()
			switch word {
			case "par", "line", "sect":
				sb.WriteString("\n")
			case "tab":
				sb.WriteString("\t")
			case "fonttbl", "colortbl", "stylesheet", "info":
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

	_ = inControl
	return strings.TrimSpace(sb.String())
}

// ─── PDF Parser ──────────────────────────────────────────────────────────────

func parsePDF(data []byte) (string, error) {
	if !bytes.HasPrefix(data, []byte("%PDF-")) {
		return "", fmt.Errorf("invalid pdf header")
	}

	var sb strings.Builder
	// Find all streams: stream ... endstream
	streamStartTag := []byte("stream")
	streamEndTag := []byte("endstream")

	offset := 0
	for {
		startIdx := bytes.Index(data[offset:], streamStartTag)
		if startIdx == -1 {
			break
		}
		startIdx += offset + len(streamStartTag)
		// Skip \r\n or \n after "stream"
		if startIdx < len(data) && data[startIdx] == '\r' {
			startIdx++
		}
		if startIdx < len(data) && data[startIdx] == '\n' {
			startIdx++
		}

		endIdx := bytes.Index(data[startIdx:], streamEndTag)
		if endIdx == -1 {
			break
		}
		endIdx += startIdx

		streamContent := data[startIdx:endIdx]
		offset = endIdx + len(streamEndTag)

		// Try decompressing via Flate / zlib
		zr, err := zlib.NewReader(bytes.NewReader(streamContent))
		var streamData []byte
		if err == nil {
			decompressed, err := io.ReadAll(zr)
			zr.Close()
			if err == nil {
				streamData = decompressed
			} else {
				streamData = streamContent
			}
		} else {
			streamData = streamContent
		}

		// Extract text from PDF stream data
		extracted := extractPDFStreamText(streamData)
		if extracted != "" {
			sb.WriteString(extracted)
			sb.WriteString("\n")
		}
	}

	res := strings.TrimSpace(sb.String())
	if res == "" {
		// Fallback: extract any literal text sequences in the raw PDF
		res = extractPDFLiteralStrings(data)
	}

	if res == "" {
		return "", fmt.Errorf("could not extract readable text from PDF")
	}
	return res, nil
}

func extractPDFStreamText(stream []byte) string {
	var sb strings.Builder
	s := string(stream)

	// Match TJ arrays: [(Hello) 10 (World)] TJ
	tjRegex := regexp.MustCompile(`\[(.*?)\]\s*TJ`)
	matches := tjRegex.FindAllStringSubmatch(s, -1)
	for _, m := range matches {
		if len(m) > 1 {
			items := extractStringLiterals(m[1])
			if len(items) > 0 {
				sb.WriteString(strings.Join(items, ""))
				sb.WriteString(" ")
			}
		}
	}

	// Match Tj strings: (Hello World) Tj
	tjSingleRegex := regexp.MustCompile(`\((.*?)\)\s*Tj`)
	singleMatches := tjSingleRegex.FindAllStringSubmatch(s, -1)
	for _, m := range singleMatches {
		if len(m) > 1 {
			sb.WriteString(unescapePDFString(m[1]))
			sb.WriteString("\n")
		}
	}

	// Match ' and " text operators
	quoteRegex := regexp.MustCompile(`\((.*?)\)\s*['"]`)
	quoteMatches := quoteRegex.FindAllStringSubmatch(s, -1)
	for _, m := range quoteMatches {
		if len(m) > 1 {
			sb.WriteString(unescapePDFString(m[1]))
			sb.WriteString("\n")
		}
	}

	return strings.TrimSpace(sb.String())
}

func extractStringLiterals(raw string) []string {
	var res []string
	var cur strings.Builder
	inParen := false
	escaped := false

	for i := 0; i < len(raw); i++ {
		ch := raw[i]
		if escaped {
			cur.WriteByte(ch)
			escaped = false
			continue
		}
		if ch == '\\' {
			escaped = true
			continue
		}
		if ch == '(' {
			inParen = true
			cur.Reset()
			continue
		}
		if ch == ')' {
			if inParen {
				res = append(res, unescapePDFString(cur.String()))
				inParen = false
			}
			continue
		}
		if inParen {
			cur.WriteByte(ch)
		}
	}
	return res
}

func unescapePDFString(s string) string {
	var sb strings.Builder
	for i := 0; i < len(s); i++ {
		if s[i] == '\\' && i+1 < len(s) {
			i++
			switch s[i] {
			case 'n':
				sb.WriteByte('\n')
			case 'r':
				sb.WriteByte('\r')
			case 't':
				sb.WriteByte('\t')
			case 'b':
				sb.WriteByte('\b')
			case 'f':
				sb.WriteByte('\f')
			case '(', ')', '\\':
				sb.WriteByte(s[i])
			default:
				sb.WriteByte(s[i])
			}
		} else {
			sb.WriteByte(s[i])
		}
	}
	return sb.String()
}

func extractPDFLiteralStrings(data []byte) string {
	var sb strings.Builder
	tjRegex := regexp.MustCompile(`\(([a-zA-Z0-9\s.,!?'"-]{4,})\)`)
	matches := tjRegex.FindAllSubmatch(data, -1)
	for _, m := range matches {
		if len(m) > 1 {
			sb.WriteString(string(m[1]))
			sb.WriteString("\n")
		}
	}
	return strings.TrimSpace(sb.String())
}
