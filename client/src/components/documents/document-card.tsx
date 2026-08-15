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
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.16 }}
      onClick={onClick}
      className="group relative flex h-full cursor-pointer flex-col overflow-visible"
    >
      {/* Paper Sheet Preview (Sharp Edges - Physical Paper Look) */}
      <div className="relative aspect-[3/4] w-full rounded-none border border-gray-200/90 border-b-gray-100 bg-white p-4.5 shadow-[0_1px_4px_rgba(0,0,0,0.05)] group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all flex flex-col justify-between overflow-hidden">
        {/* Top Paper Header & Skeletal lines */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-gray-100/80">
            <div className="h-2 w-2/5 bg-gray-800/80 rounded-none" />
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-blue-50 text-blue-700 tracking-wider uppercase border border-blue-100">
              {formatUpper}
            </span>
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="h-1.5 w-full bg-gray-200/80 rounded-none" />
            <div className="h-1.5 w-11/12 bg-gray-200/70 rounded-none" />
            <div className="h-1.5 w-4/5 bg-gray-200/60 rounded-none" />
          </div>

          {/* Micro Snippet Text / Excerpt */}
          <div className="pt-2 text-[10px] leading-relaxed text-gray-600 line-clamp-6 select-none font-serif tracking-normal">
            {doc.excerpt || "No excerpt available."}
          </div>
        </div>

        {/* Paper Sheet Footer Meta */}
        <div className="pt-2.5 flex items-center justify-between border-t border-gray-100 text-[9px] text-gray-400 font-sans">
          <span className="font-medium">{wordCount.toLocaleString()} words</span>
          <span
            className={`font-semibold px-1.5 py-0.5 rounded-none text-[8px] uppercase tracking-wider ${
              isEdit
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          >
            {doc.branch.name || "main"}
          </span>
        </div>
      </div>

      {/* Card Bottom Meta Container (Soft Edged) */}
      <div className="p-3.5 bg-gray-50/90 border-x border-b border-gray-200/90 rounded-b-2xl flex items-center justify-between gap-2 shadow-xs group-hover:bg-white transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Docs Blue Page Icon */}
          <div className="shrink-0 text-blue-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                  {pendingChanges} edits
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-dots Menu Button & Dropdown */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            aria-label="Document options"
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-200/60 transition"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
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
                className="absolute right-0 bottom-full mb-1 z-30 w-44 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl"
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
                    className="flex w-full items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 uppercase font-medium"
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
                  className="flex w-full items-center px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
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
