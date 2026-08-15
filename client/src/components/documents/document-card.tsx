import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { DocumentItem } from "./types";

export function DocumentCard({
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
  const isEdit = doc.branch.isEdit || doc.branch.is_edit || false;
  const pendingChanges = doc.branch.pendingChanges ?? doc.branch.pending_changes ?? 0;
  const formatUpper = (doc.format || "TXT").toUpperCase();

  const formattedDate = doc.lastEdited || (doc.updated_at ? new Date(doc.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) : "Recent");

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="group relative flex h-full cursor-pointer flex-col rounded-xl border border-gray-200 bg-white overflow-visible shadow-xs hover:shadow-md hover:border-gray-300 transition-all"
    >
      {/* Paper Sheet Preview Area */}
      <div className="relative aspect-[3/4] w-full bg-gray-50 border-b border-gray-100 p-4 overflow-hidden flex flex-col justify-start rounded-t-xl">
        {/* Paper Document Representation */}
        <div className="w-full h-full bg-white rounded-md border border-gray-200/80 shadow-xs p-3 flex flex-col space-y-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="h-2 w-1/2 bg-gray-800/80 rounded-xs mb-1" />
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 tracking-wider">
              {formatUpper}
            </span>
          </div>
          <div className="h-1.5 w-full bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-full bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-5/6 bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-full bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-4/5 bg-gray-300/70 rounded-xs" />

          {/* Actual Micro Snippet Text Preview */}
          <div className="pt-2 text-[9px] leading-[1.3] text-gray-500 line-clamp-6 select-none font-serif">
            {doc.excerpt || "No excerpt available."}
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-100 text-[8px] text-gray-400 font-sans">
            <span>{wordCount} words</span>
            <span
              className={`font-semibold px-1 rounded ${
                isEdit
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {doc.branch.name || "main"}
            </span>
          </div>
        </div>
      </div>

      {/* Card Bottom Meta (Google Docs Style) */}
      <div className="p-3 bg-white flex items-start justify-between gap-2 rounded-b-xl">
        <div className="flex items-start gap-2.5 min-w-0">
          {/* Docs Blue Page Icon */}
          <div className="mt-0.5 shrink-0 text-blue-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {doc.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-gray-400">{formattedDate}</span>
              {isEdit && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                  {pendingChanges} edits
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-dots Menu Button & Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="Document options"
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
            </svg>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 bottom-full mb-1 z-30 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
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
                    className="flex w-full items-center px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 uppercase"
                  >
                    .{fmt}
                  </button>
                ))}
                <div className="my-1 border-t border-gray-100" />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete?.(doc.id);
                  }}
                  className="flex w-full items-center px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Delete manuscript
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
