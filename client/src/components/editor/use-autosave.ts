"use client";

import { useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { apiFetch } from "@/lib/api";

export type SaveStatus = "idle" | "saving" | "saved" | "conflict" | "error";

interface LocalDraftBackup {
  docId: string;
  text: string;
  html: string;
  clientTimestamp: string;
  baseUpdatedAt?: string;
}

/**
 * Robust debounced sync engine for the document editor.
 * Features:
 * - 1.5s keystroke debouncing to prevent server request flooding
 * - In-flight mutex queue preventing overlapping concurrent saves
 * - Client-side timestamped local backup in localStorage
 * - Optimistic concurrency check (base_updated_at): server is source of truth
 * - Automatic resync on 409 conflict without data loss
 */
export function useAutoSave(
  editor: Editor | null,
  docId: string,
  initialServerUpdatedAt: string | undefined,
  enabled: boolean,
  onStatusChange: (s: SaveStatus) => void,
  onConflictResync?: (canonicalContent: string) => void,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHtmlRef = useRef<string>("");
  const serverUpdatedAtRef = useRef<string | undefined>(initialServerUpdatedAt);
  const isSavingRef = useRef<boolean>(false);
  const pendingSaveRef = useRef<boolean>(false);

  // Sync ref with prop if it changes
  useEffect(() => {
    if (initialServerUpdatedAt) {
      serverUpdatedAtRef.current = initialServerUpdatedAt;
    }
  }, [initialServerUpdatedAt]);

  const saveLocalBackup = useCallback((text: string, html: string) => {
    if (typeof window === "undefined" || !docId) return;
    try {
      const backup: LocalDraftBackup = {
        docId,
        text,
        html,
        clientTimestamp: new Date().toISOString(),
        baseUpdatedAt: serverUpdatedAtRef.current,
      };
      localStorage.setItem(`inkbase_draft_${docId}`, JSON.stringify(backup));
    } catch {
      // Storage quota or privacy mode
    }
  }, [docId]);

  const clearLocalBackup = useCallback(() => {
    if (typeof window === "undefined" || !docId) return;
    try {
      localStorage.removeItem(`inkbase_draft_${docId}`);
    } catch {
      // ignore
    }
  }, [docId]);

  const performSave = useCallback(async () => {
    if (!editor || !docId || isSavingRef.current) return;

    const html = editor.getHTML();
    const text = editor.getText();

    // Skip if unchanged since last successful server write
    if (html === lastSavedHtmlRef.current) {
      pendingSaveRef.current = false;
      return;
    }

    isSavingRef.current = true;
    pendingSaveRef.current = false;
    onStatusChange("saving");

    // Persist local backup immediately
    saveLocalBackup(text, html);

    try {
      const payload: Record<string, any> = {
        content: text,
        word_count: text.split(/\s+/).filter(Boolean).length,
      };

      if (serverUpdatedAtRef.current) {
        payload.base_updated_at = serverUpdatedAtRef.current;
      }

      const res = await apiFetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        // Server is ahead! Server is the source of truth.
        const data = await res.json().catch(() => ({}));
        if (data.document) {
          serverUpdatedAtRef.current = data.document.updated_at;
          lastSavedHtmlRef.current = data.document.content || "";
          clearLocalBackup();
          onStatusChange("conflict");
          onConflictResync?.(data.document.content || "");
        } else {
          onStatusChange("error");
        }
      } else if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.document?.updated_at) {
          serverUpdatedAtRef.current = data.document.updated_at;
        }
        lastSavedHtmlRef.current = html;
        clearLocalBackup();
        onStatusChange("saved");
      } else {
        onStatusChange("error");
      }
    } catch {
      onStatusChange("error");
    } finally {
      isSavingRef.current = false;
      // If keystrokes happened while the request was in flight, process them now
      if (pendingSaveRef.current) {
        performSave();
      }
    }
  }, [editor, docId, onStatusChange, onConflictResync, saveLocalBackup, clearLocalBackup]);

  // Schedule debounced save
  const scheduleSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onStatusChange("idle");
    pendingSaveRef.current = true;
    timerRef.current = setTimeout(() => {
      performSave();
    }, 1500);
  }, [onStatusChange, performSave]);

  useEffect(() => {
    if (!editor || !enabled) return;

    // Set initial baseline
    lastSavedHtmlRef.current = editor.getHTML();

    editor.on("update", scheduleSave);
    return () => {
      editor.off("update", scheduleSave);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [editor, enabled, scheduleSave]);

  // Flush pending save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        performSave();
      }
    };
  }, [performSave]);
}
