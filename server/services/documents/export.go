package documents

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"strings"
	"time"
)

// ExportDocument converts the document to the specified format and returns the binary content, mime type, and error.
func ExportDocument(doc *Document, format DocumentFormat) ([]byte, string, error) {
	switch format {
	case FormatTXT:
		return []byte(doc.Title + "\n\n" + doc.Content), "text/plain; charset=utf-8", nil
	case FormatMD:
		return []byte("# " + doc.Title + "\n\n" + doc.Content), "text/markdown; charset=utf-8", nil
	case FormatRTF:
		data := exportRTF(doc)
		return data, "application/rtf", nil
	case FormatDocx:
		data, err := exportDocx(doc)
		if err != nil {
			return nil, "", err
		}
		return data, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", nil
	case FormatODT:
		data, err := exportODT(doc)
		if err != nil {
			return nil, "", err
		}
		return data, "application/vnd.oasis.opendocument.text", nil
	case FormatEPUB:
		data, err := exportEPUB(doc)
		if err != nil {
			return nil, "", err
		}
		return data, "application/epub+zip", nil
	case FormatPDF:
		data := exportPDF(doc)
		return data, "application/pdf", nil
	default:
		return nil, "", fmt.Errorf("%w: %s", ErrInvalidFormat, format)
	}
}

// ─── DOCX Exporter ───────────────────────────────────────────────────────────

func exportDocx(doc *Document) ([]byte, error) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	// [Content_Types].xml
	ct, err := zw.Create("[Content_Types].xml")
	if err != nil {
		return nil, err
	}
	ct.Write([]byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`))

	// _rels/.rels
	rels, err := zw.Create("_rels/.rels")
	if err != nil {
		return nil, err
	}
	rels.Write([]byte(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`))

	// word/document.xml
	docXml, err := zw.Create("word/document.xml")
	if err != nil {
		return nil, err
	}

	var bodyXml strings.Builder
	bodyXml.WriteString(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>`)

	// Title Paragraph
	var escapedTitle bytes.Buffer
	xml.EscapeText(&escapedTitle, []byte(doc.Title))
	bodyXml.WriteString(fmt.Sprintf(`
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="48"/></w:rPr><w:t>%s</w:t></w:r>
    </w:p>`, escapedTitle.String()))

	// Body Paragraphs
	paragraphs := strings.Split(doc.Content, "\n")
	for _, p := range paragraphs {
		trimmed := strings.TrimSpace(p)
		if trimmed == "" {
			bodyXml.WriteString("\n    <w:p/>")
			continue
		}
		var escapedP bytes.Buffer
		xml.EscapeText(&escapedP, []byte(trimmed))
		bodyXml.WriteString(fmt.Sprintf(`
    <w:p>
      <w:r><w:t>%s</w:t></w:r>
    </w:p>`, escapedP.String()))
	}

	bodyXml.WriteString(`
  </w:body>
</w:document>`)
	docXml.Write([]byte(bodyXml.String()))

	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ─── ODT Exporter ────────────────────────────────────────────────────────────

func exportODT(doc *Document) ([]byte, error) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	// mimetype (must be first, uncompressed in standard specs)
	mtHeader := &zip.FileHeader{
		Name:   "mimetype",
		Method: zip.Store,
	}
	mt, err := zw.CreateHeader(mtHeader)
	if err != nil {
		return nil, err
	}
	mt.Write([]byte("application/vnd.oasis.opendocument.text"))

	// META-INF/manifest.xml
	manifest, err := zw.Create("META-INF/manifest.xml")
	if err != nil {
		return nil, err
	}
	manifest.Write([]byte(`<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`))

	// content.xml
	contentFile, err := zw.Create("content.xml")
	if err != nil {
		return nil, err
	}

	var contentXml strings.Builder
	contentXml.WriteString(`<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" office:version="1.2">
  <office:body>
    <office:text>`)

	var escapedTitle bytes.Buffer
	xml.EscapeText(&escapedTitle, []byte(doc.Title))
	contentXml.WriteString(fmt.Sprintf(`<text:h text:outline-level="1">%s</text:h>`, escapedTitle.String()))

	paragraphs := strings.Split(doc.Content, "\n")
	for _, p := range paragraphs {
		var escapedP bytes.Buffer
		xml.EscapeText(&escapedP, []byte(p))
		contentXml.WriteString(fmt.Sprintf(`<text:p>%s</text:p>`, escapedP.String()))
	}

	contentXml.WriteString(`
    </office:text>
  </office:body>
</office:document-content>`)
	contentFile.Write([]byte(contentXml.String()))

	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ─── EPUB Exporter ───────────────────────────────────────────────────────────

func exportEPUB(doc *Document) ([]byte, error) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	// mimetype (must be first and uncompressed)
	mtHeader := &zip.FileHeader{
		Name:   "mimetype",
		Method: zip.Store,
	}
	mt, err := zw.CreateHeader(mtHeader)
	if err != nil {
		return nil, err
	}
	mt.Write([]byte("application/epub+zip"))

	// META-INF/container.xml
	container, err := zw.Create("META-INF/container.xml")
	if err != nil {
		return nil, err
	}
	container.Write([]byte(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`))

	// OEBPS/content.opf
	opf, err := zw.Create("OEBPS/content.opf")
	if err != nil {
		return nil, err
	}
	var escapedTitle bytes.Buffer
	xml.EscapeText(&escapedTitle, []byte(doc.Title))
	opf.Write([]byte(fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookID" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>%s</dc:title>
    <dc:identifier id="BookID">%s</dc:identifier>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chapter1"/>
  </spine>
</package>`, escapedTitle.String(), doc.ID)))

	// OEBPS/toc.ncx
	ncx, err := zw.Create("OEBPS/toc.ncx")
	if err != nil {
		return nil, err
	}
	ncx.Write([]byte(fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="%s"/>
  </head>
  <docTitle><text>%s</text></docTitle>
  <navMap>
    <navPoint id="navPoint-1" playOrder="1">
      <navLabel><text>%s</text></navLabel>
      <content src="chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`, doc.ID, escapedTitle.String(), escapedTitle.String())))

	// OEBPS/chapter1.xhtml
	chap, err := zw.Create("OEBPS/chapter1.xhtml")
	if err != nil {
		return nil, err
	}
	var chapXml strings.Builder
	chapXml.WriteString(fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>%s</title></head>
<body>
<h1>%s</h1>`, escapedTitle.String(), escapedTitle.String()))

	paragraphs := strings.Split(doc.Content, "\n")
	for _, p := range paragraphs {
		trimmed := strings.TrimSpace(p)
		if trimmed == "" {
			continue
		}
		var escapedP bytes.Buffer
		xml.EscapeText(&escapedP, []byte(trimmed))
		chapXml.WriteString(fmt.Sprintf("\n<p>%s</p>", escapedP.String()))
	}
	chapXml.WriteString("\n</body>\n</html>")
	chap.Write([]byte(chapXml.String()))

	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// ─── RTF Exporter ────────────────────────────────────────────────────────────

func exportRTF(doc *Document) []byte {
	var sb strings.Builder
	sb.WriteString("{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0\\fnil\\fcharset0 Helvetica;}}\n\\viewkind4\\uc1\\pard\\lang1033\\f0\\fs32\\b ")
	sb.WriteString(escapeRTF(doc.Title))
	sb.WriteString("\\b0\\fs22\\par\\par\n")

	paragraphs := strings.Split(doc.Content, "\n")
	for _, p := range paragraphs {
		sb.WriteString(escapeRTF(p))
		sb.WriteString("\\par\n")
	}
	sb.WriteString("}")
	return []byte(sb.String())
}

func escapeRTF(s string) string {
	var sb strings.Builder
	for _, r := range s {
		switch r {
		case '\\':
			sb.WriteString("\\\\")
		case '{':
			sb.WriteString("\\{")
		case '}':
			sb.WriteString("\\}")
		case '\n':
			sb.WriteString("\\par\n")
		case '\t':
			sb.WriteString("\\tab ")
		default:
			if r < 128 {
				sb.WriteRune(r)
			} else {
				sb.WriteString(fmt.Sprintf("\\u%d?", r))
			}
		}
	}
	return sb.String()
}

// ─── PDF Exporter ────────────────────────────────────────────────────────────

func exportPDF(doc *Document) []byte {
	var body bytes.Buffer

	// Build stream of PDF instructions
	var stream bytes.Buffer
	stream.WriteString("BT\n")
	stream.WriteString("/F1 18 Tf\n")
	stream.WriteString("50 750 Td\n")
	stream.WriteString(fmt.Sprintf("(%s) Tj\n", escapePDF(doc.Title)))
	stream.WriteString("/F1 11 Tf\n")
	stream.WriteString("0 -30 Td\n")

	paragraphs := strings.Split(doc.Content, "\n")
	yOffset := 720
	for _, p := range paragraphs {
		lines := wrapText(p, 80)
		for _, line := range lines {
			if yOffset < 50 {
				break
			}
			stream.WriteString(fmt.Sprintf("(%s) Tj\n", escapePDF(line)))
			stream.WriteString("0 -15 Td\n")
			yOffset -= 15
		}
		if yOffset < 50 {
			break
		}
		stream.WriteString("0 -8 Td\n")
		yOffset -= 8
	}
	stream.WriteString("ET\n")

	streamBytes := stream.Bytes()

	// Write objects
	var offsets []int

	// Header
	body.WriteString("%PDF-1.4\n")

	// Obj 1: Catalog
	offsets = append(offsets, body.Len())
	body.WriteString("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

	// Obj 2: Pages
	offsets = append(offsets, body.Len())
	body.WriteString("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")

	// Obj 3: Page
	offsets = append(offsets, body.Len())
	body.WriteString("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n")

	// Obj 4: Content Stream
	offsets = append(offsets, body.Len())
	body.WriteString(fmt.Sprintf("4 0 obj\n<< /Length %d >>\nstream\n%sendstream\nendobj\n", len(streamBytes), streamBytes))

	// Obj 5: Font
	offsets = append(offsets, body.Len())
	body.WriteString("5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

	// Xref
	xrefOffset := body.Len()
	body.WriteString("xref\n0 6\n0000000000 65535 f \n")
	for _, off := range offsets {
		body.WriteString(fmt.Sprintf("%010d 00000 n \n", off))
	}

	// Trailer
	body.WriteString(fmt.Sprintf("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", xrefOffset))

	_ = time.Now()
	return body.Bytes()
}

func escapePDF(s string) string {
	var sb strings.Builder
	for _, r := range s {
		switch r {
		case '(':
			sb.WriteString("\\(")
		case ')':
			sb.WriteString("\\)")
		case '\\':
			sb.WriteString("\\\\")
		default:
			if r >= 32 && r < 127 {
				sb.WriteRune(r)
			} else {
				sb.WriteRune(' ')
			}
		}
	}
	return sb.String()
}

func wrapText(text string, maxLen int) []string {
	if len(text) <= maxLen {
		return []string{text}
	}
	words := strings.Fields(text)
	var lines []string
	var current strings.Builder

	for _, w := range words {
		if current.Len()+len(w)+1 > maxLen {
			if current.Len() > 0 {
				lines = append(lines, current.String())
				current.Reset()
			}
		}
		if current.Len() > 0 {
			current.WriteString(" ")
		}
		current.WriteString(w)
	}
	if current.Len() > 0 {
		lines = append(lines, current.String())
	}
	return lines
}
