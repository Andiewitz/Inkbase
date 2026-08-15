import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranchIcon, ClockIcon, MoreVerticalIcon, FileTextIcon, TrashIcon, DownloadIcon } from "lucide-react";
import type { DocumentItem } from "./types";

export function DocumentListRow({
  doc,
  onClick,
  onDelete,
  onExport,
}: {
  doc: DocumentItem;
  onClick: () => void;
  onDelete?: (id: string) => void;
  onExport?: (id: string, format: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

  const wordCount = doc.wordCount ?? doc.word_count ?? 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const isEdit = doc.branch.isEdit || doc.branch.is_edit || false;
  const pendingChanges = doc.branch.pendingChanges ?? doc.branch.pending_changes ?? 0;
  const formatUpper = (doc.format || "TXT").toUpperCase();

  const formattedDate = doc.lastEdited || (doc.updated_at ? new Date(doc.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) : "Recent");

  return (
    <div
      onClick={onClick}
      className="group relative flex items-center justify-between gap-4 px-4 py-3.5 bg-white hover:bg-stone-50/80 border border-gray-200/80 rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs hover:border-purple-200"
    >
      {/* Left: Document Info */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Format Badge */}
        <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100 uppercase tracking-wider">
          {formatUpper}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
              {doc.title}
            </h4>

            {/* Branch pill */}
            <span
              className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                isEdit
                  ? "bg-amber-100/80 text-amber-800 border border-amber-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              <GitBranchIcon className="w-2.5 h-2.5" />
              <span>{doc.branch.name || "main"}</span>
            </span>

            {isEdit && pendingChanges > 0 && (
              <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                +{pendingChanges} edits
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 truncate font-serif mt-0.5">
            {doc.excerpt || "No excerpt available."}
          </p>
        </div>
      </div>

      {/* Middle: Metrics */}
      <div className="hidden sm:flex items-center gap-6 text-xs text-gray-500 shrink-0">
        <div className="flex items-center gap-1.5 min-w-24">
          <FileTextIcon className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium text-gray-700">{wordCount.toLocaleString()} words</span>
        </div>

        <div className="flex items-center gap-1.5 min-w-20">
          <ClockIcon className="w-3.5 h-3.5 text-gray-400" />
          <span>~{readingTime}m read</span>
        </div>

        <span className="text-gray-400 min-w-24 text-right">{formattedDate}</span>
      </div>

      {/* Right: Actions Menu */}
      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          aria-label="Document options"
          className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition"
        >
          <MoreVerticalIcon className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute right-0 top-full mt-1 z-30 w-48 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Export As
              </div>
              {["docx", "pdf", "md", "epub", "txt"].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onExport?.(doc.id, fmt);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-purple-50 hover:text-purple-900 uppercase font-medium"
                >
                  <DownloadIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span>.{fmt}</span>
                </button>
              ))}
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(doc.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Delete manuscript</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
