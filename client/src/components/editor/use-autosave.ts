"use client";

import { useEffect, useRef, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { apiFetch } from "@/lib/api";

export type SaveStatus = "idle" | "saving" | "saved" | "conflict" | "error";

export interface ConflictDetail {
  /** Unsaved local HTML at the moment the server rejected the write. Never discarded automatically. */
  localHtml: string;
  /** Canonical server content from the 409 response. */
  serverContent: string;
  /** Canonical server updated_at from the 409 response. */
  serverUpdatedAt?: string;
}

interface LocalDraftBackup {
  docId: string;
  text: string;
  html: string;
  clientTimestamp: string;
  baseUpdatedAt?: string;
}

interface SavePayload {
  content: string;
  word_count: number;
  base_updated_at?: string;
}

/**
 * Robust debounced sync engine for the document editor.
 * Features:
 * - 1.5s keystroke debouncing to prevent server request flooding
 * - Preserves rich HTML content, headings, bold/italics, lists, and indents
 * - In-flight mutex queue preventing overlapping concurrent saves
 * - Client-side timestamped local backup in localStorage
 * - Optimistic concurrency check (base_updated_at): server is source of truth
 * - Explicit conflict resolution on 409 — local work is never auto-discarded
 */
export function useAutoSave(
  editor: Editor | null,
  docId: string,
  initialServerUpdatedAt: string | undefined,
  enabled: boolean,
  onStatusChange: (s: SaveStatus) => void,
  onConflict?: (c: ConflictDetail) => void,
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

  // NOTE(react-compiler): manual memoization below is intentional.
  // performSave's identity must stay stable across renders: it is wired to
  // the Tiptap editor's `update` event via scheduleSave, and an unstable
  // identity would duplicate subscriptions on every keystroke render. The
  // compiler skips this hook because the explicit conflict resolvers
  // reschedule saves through timers — accepted, since skipping only forgoes
  // auto-memoization while runtime useCallback semantics are unchanged.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
      // Save rich HTML so headings, bold, italics, spacing, lists, and indents are preserved!
      const payload: SavePayload = {
        content: html,
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
        // Server is ahead. Preserve everything: keep the local backup, keep
        // lastSavedHtmlRef untouched, leave editor content alone. The author
        // resolves explicitly via the conflict UI.
        const data = await res.json().catch(() => ({}));
        if (data.document) {
          const detail: ConflictDetail = {
            localHtml: html,
            serverContent: data.document.content || "",
            serverUpdatedAt: data.document.updated_at,
          };
          onStatusChange("conflict");
          onConflict?.(detail);
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
  }, [editor, docId, onStatusChange, onConflict, saveLocalBackup, clearLocalBackup]);

  /**
   * Explicit "keep mine": rebase the local candidate onto the server revision
   * and retry immediately. The next write carries the server's updated_at as
   * base, so local content wins by explicit author choice — never silently.
   * Same scheduling shape as scheduleSave below (proven safe for the React
   * Compiler config used here).
   */
  const resolveKeepMine = useCallback(
    (serverUpdatedAt?: string) => {
      if (serverUpdatedAt) {
        serverUpdatedAtRef.current = serverUpdatedAt;
      }
      pendingSaveRef.current = true;
      onStatusChange("saving");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        performSave();
      }, 0);
    },
    [onStatusChange, performSave],
  );

  /**
   * Called by the editor after it applies the server content for "take
   * server". Records the new baseline and drops the local backup. No save is
   * triggered: applied content equals the new baseline, so future saves skip
   * until the author types again.
   */
  const acknowledgeServer = useCallback(
    (appliedHtml: string, serverUpdatedAt?: string) => {
      if (serverUpdatedAt) {
        serverUpdatedAtRef.current = serverUpdatedAt;
      }
      lastSavedHtmlRef.current = appliedHtml;
      clearLocalBackup();
      onStatusChange("saved");
    },
    [clearLocalBackup, onStatusChange],
  );

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

  return { resolveKeepMine, acknowledgeServer };
}
