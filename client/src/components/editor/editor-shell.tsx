"use client";

import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileDown,
  ChevronRight,
} from "lucide-react";
import { type Editor } from "@tiptap/react";
import type { DocumentItem } from "../documents/types";
import { RichEditor } from "./rich-editor";
import { EditorToolbar } from "./toolbar";
import { type SaveStatus } from "./use-autosave";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const EXPORT_FORMATS = [
  { label: "Word Document", ext: "docx" },
  { label: "PDF", ext: "pdf" },
  { label: "Markdown", ext: "md" },
  { label: "EPUB", ext: "epub" },
  { label: "Plain Text", ext: "txt" },
];

export function EditorShell({
  doc,
  onExport,
}: {
  doc: DocumentItem;
  onExport?: (id: string, format: string) => void;
}) {
  const router = useRouter();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [wordCount, setWordCount] = useState<number>(doc.word_count || doc.wordCount || 0);

  // Update word count when editor changes
  React.useEffect(() => {
    if (!editor) return;
    const updateCount = () => {
      const text = editor.getText();
      const count = text.split(/\s+/).filter(Boolean).length;
      setWordCount(count);
    };
    editor.on("update", updateCount);
    return () => {
      editor.off("update", updateCount);
    };
  }, [editor]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#E3EDF6] flex flex-col">
      {/* ─── Top Studio Bar (Word/Google Docs Header) ─────────────────────────── */}
      <header className="h-14 shrink-0 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between gap-4 z-20">
        {/* Left: Back to Dashboard & Doc Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 gap-1.5 px-2.5 h-9"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline font-semibold text-xs">Dashboard</span>
          </Button>

          <div className="h-4 w-px bg-slate-200" />

          <div className="min-w-0 flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold text-slate-850 truncate max-w-[240px] sm:max-w-md">
              {doc.title || "Untitled Manuscript"}
            </h1>
          </div>
        </div>

        {/* Right: Word Count, Save Status & Export */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Word count */}
          <span className="hidden md:inline-block text-xs font-semibold text-slate-400">
            {wordCount.toLocaleString()} words
          </span>

          <div className="hidden md:block h-4 w-px bg-slate-200" />

          {/* Save status badge */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2C7E86]" />
                <span className="text-[#2C7E86]">Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-slate-400">Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
                <span className="text-rose-500">Save failed</span>
              </>
            )}
            {saveStatus === "idle" && (
              <span className="text-slate-400">Edited</span>
            )}
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-slate-200/90 text-slate-700 hover:text-[#2C7E86] hover:border-teal-300 gap-1.5 h-8.5 px-3.5 font-semibold text-xs shadow-2xs"
              >
                <FileDown className="h-3.5 w-3.5 text-slate-400" />
                <span>Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Export Document
              </DropdownMenuLabel>
              {EXPORT_FORMATS.map(({ label, ext }) => (
                <DropdownMenuItem
                  key={ext}
                  onClick={() => onExport?.(doc.id, ext)}
                  className="font-medium text-xs cursor-pointer py-2"
                >
                  <span className="w-10 text-[10px] font-bold text-slate-400 uppercase shrink-0">
                    .{ext}
                  </span>
                  <span>{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ─── Sticky Formatting Toolbar ───────────────────────────────────────── */}
      <div className="shrink-0 z-10 shadow-2xs">
        <EditorToolbar editor={editor} />
      </div>

      {/* ─── Document Scroll Area (Word / Google Docs 1:1 Canvas) ─────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-12 flex justify-center items-start">
        {/* Physical A4 / Letter Paper Sheet */}
        <div className="w-full max-w-[850px] min-h-[1100px] bg-white border border-slate-200/90 shadow-[0_4px_24px_rgba(40,80,120,0.10)] p-10 sm:p-16 lg:p-20 flex flex-col justify-start rounded-none select-text mb-12">
          {/* Document Title Header on Paper */}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans mb-8 pb-4 border-b border-slate-100">
            {doc.title || "Untitled Manuscript"}
          </h1>

          {/* Tiptap Rich Text Editor */}
          <div className="flex-1 min-h-[700px]">
            <RichEditor
              docId={doc.id}
              initialContent={doc.content || doc.excerpt || ""}
              onEditorReady={(ed) => setEditor(ed)}
              onSaveStatusChange={(s) => setSaveStatus(s)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
