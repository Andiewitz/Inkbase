"use client";

import { useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { apiFetch } from "@/lib/api";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced auto-save hook for the document editor.
 * Fires a PUT /api/documents/:id 1.5s after the last keystroke.
 */
export function useAutoSave(
  editor: Editor | null,
  docId: string,
  enabled: boolean,
  onStatusChange: (s: SaveStatus) => void,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const save = useCallback(async () => {
    if (!editor || !docId) return;

    const html = editor.getHTML();
    const text = editor.getText();

    // Skip if content unchanged
    if (html === lastSavedRef.current) return;

    onStatusChange("saving");
    try {
      const res = await apiFetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,        // stored as plain text in backend
          content_html: html,   // future: store rendered HTML too
          word_count: text.split(/\s+/).filter(Boolean).length,
        }),
      });
      if (res.ok) {
        lastSavedRef.current = html;
        onStatusChange("saved");
      } else {
        onStatusChange("error");
      }
    } catch {
      onStatusChange("error");
    }
  }, [editor, docId, onStatusChange]);

  // Wire up Tiptap's onUpdate to schedule a debounced save
  useEffect(() => {
    if (!editor || !enabled) return;

    const handleUpdate = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      onStatusChange("idle");
      timerRef.current = setTimeout(save, 1500);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [editor, enabled, save, onStatusChange]);

  // Flush save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        save();
      }
    };
  }, [save]);
}
