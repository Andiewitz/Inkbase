"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useAutoSave, type SaveStatus } from "./use-autosave";

interface RichEditorProps {
  docId: string;
  initialContent: string;
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
  onSaveStatusChange?: (s: SaveStatus) => void;
}

/**
 * Converts plain text to minimal Tiptap-compatible HTML.
 * Splits on double newlines (paragraphs) and wraps each block.
 */
function plainTextToHtml(text: string): string {
  if (!text.trim()) return "<p></p>";
  // If it already looks like HTML, pass through
  if (text.trimStart().startsWith("<")) return text;

  return text
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Preserve single newlines inside paragraphs as <br>
      const inner = trimmed.replace(/\n/g, "<br/>");
      return `<p>${inner}</p>`;
    })
    .filter(Boolean)
    .join("");
}

export function RichEditor({
  docId,
  initialContent,
  onEditorReady,
  onSaveStatusChange,
}: RichEditorProps) {
  const handleSaveStatus = React.useCallback(
    (s: SaveStatus) => onSaveStatusChange?.(s),
    [onSaveStatusChange],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Disable features not needed for writing
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your manuscript...",
      }),
    ],
    content: plainTextToHtml(initialContent),
    editorProps: {
      attributes: {
        class: "prose-editor focus:outline-none",
        spellcheck: "true",
      },
    },
  });

  // Expose editor instance to parent
  React.useEffect(() => {
    if (editor) onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  // Wire auto-save
  useAutoSave(editor, docId, true, handleSaveStatus);

  return (
    <EditorContent
      editor={editor}
      className="h-full w-full"
    />
  );
}
