"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useAutoSave, type SaveStatus, type ConflictDetail } from "./use-autosave";
import { ConflictResolve } from "./conflict-resolve";

interface RichEditorProps {
  docId: string;
  initialContent: string;
  initialServerUpdatedAt?: string;
  onEditorReady?: (editor: ReturnType<typeof useEditor>) => void;
  onSaveStatusChange?: (s: SaveStatus) => void;
  onResynced?: () => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Converts structured text / markdown / plain text into Tiptap HTML
 * without stripping indentation, tabs, headings, or paragraph spacing.
 */
function formatContentToHtml(content: string): string {
  if (!content) return "<p></p>";

  const trimmed = content.trim();
  // If it already looks like HTML (from previous rich auto-save or rich import)
  if (
    trimmed.startsWith("<") &&
    (trimmed.includes("</p>") ||
      trimmed.includes("</h1>") ||
      trimmed.includes("</h2>") ||
      trimmed.includes("</h3>") ||
      trimmed.includes("</div>") ||
      trimmed.includes("<br"))
  ) {
    return content;
  }

  // Split on double newlines for paragraph boundaries
  const blocks = content.split(/\r?\n\r?\n+/);

  return blocks
    .map((rawBlock) => {
      if (!rawBlock) return "";

      const trimmedStart = rawBlock.trimStart();

      // Heading 1
      if (trimmedStart.startsWith("# ")) {
        return `<h1>${escapeHtml(trimmedStart.slice(2))}</h1>`;
      }
      // Heading 2
      if (trimmedStart.startsWith("## ")) {
        return `<h2>${escapeHtml(trimmedStart.slice(3))}</h2>`;
      }
      // Heading 3
      if (trimmedStart.startsWith("### ")) {
        return `<h3>${escapeHtml(trimmedStart.slice(4))}</h3>`;
      }

      // Regular paragraph — preserve leading tabs, 4-space indentation, and multiple spaces
      const lines = rawBlock.split(/\r?\n/).map((line) => {
        // Convert leading tabs to 4 non-breaking spaces
        let formatted = line.replace(/^\t+/, (match) =>
          "&nbsp;&nbsp;&nbsp;&nbsp;".repeat(match.length),
        );
        // Convert leading spaces (2+) to &nbsp;
        formatted = formatted.replace(/^( +)/, (match) =>
          "&nbsp;".repeat(match.length),
        );
        return escapeHtml(formatted);
      });

      return `<p>${lines.join("<br/>")}</p>`;
    })
    .filter(Boolean)
    .join("");
}

export function RichEditor({
  docId,
  initialContent,
  initialServerUpdatedAt,
  onEditorReady,
  onSaveStatusChange,
  onResynced,
}: RichEditorProps) {
  const handleSaveStatus = React.useCallback(
    (s: SaveStatus) => onSaveStatusChange?.(s),
    [onSaveStatusChange],
  );

  // Conflict state lives here, next to the resolution UI. The save hook only
  // reports 409s via onConflict and exposes rebase/acknowledge primitives —
  // nothing is applied or discarded until the author chooses below.
  const [conflict, setConflict] = React.useState<ConflictDetail | null>(null);
  const handleConflict = React.useCallback((c: ConflictDetail) => {
    setConflict(c);
  }, []);

  const initialHtml = React.useMemo(() => {
    return formatContentToHtml(initialContent);
  }, [initialContent]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your manuscript...",
      }),
    ],
    content: initialHtml,
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

  // Wire debounced auto-save with explicit conflict resolution
  const { resolveKeepMine, acknowledgeServer } = useAutoSave(
    editor,
    docId,
    initialServerUpdatedAt,
    true,
    handleSaveStatus,
    handleConflict,
  );

  // Non-destructive conflict handling: nothing is applied until the author
  // chooses. "Take server" applies the canonical content; "keep mine"
  // re-saves the untouched local candidate on top of the server revision.
  const handleTakeServer = React.useCallback(() => {
    if (editor && conflict) {
      editor.commands.setContent(formatContentToHtml(conflict.serverContent));
      acknowledgeServer(editor.getHTML(), conflict.serverUpdatedAt);
      setConflict(null);
      onResynced?.();
    }
  }, [editor, conflict, acknowledgeServer, onResynced]);

  const handleKeepMine = React.useCallback(() => {
    if (!conflict) return;
    resolveKeepMine(conflict.serverUpdatedAt);
    setConflict(null);
  }, [conflict, resolveKeepMine]);

  return (
    <>
      {conflict && (
        <ConflictResolve
          serverUpdatedAt={conflict.serverUpdatedAt}
          onKeepMine={handleKeepMine}
          onTakeServer={handleTakeServer}
        />
      )}
      <EditorContent
        editor={editor}
        className="h-full w-full"
      />
    </>
  );
}
