import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranchIcon, MoreVerticalIcon, DownloadIcon, TrashIcon, ClockIcon, BookOpenIcon } from "lucide-react";
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
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.16 }}
      onClick={onClick}
      className="group relative flex h-full cursor-pointer flex-col overflow-visible"
    >
      {/* Paper Sheet Preview (Sharp Edges - Editorial Paper Look) */}
      <div className="relative aspect-[3/4] w-full rounded-none border border-gray-200/90 border-b-gray-100 bg-[#FCFCFD] p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)] group-hover:shadow-[0_10px_25px_rgba(0,0,0,0.08)] group-hover:border-purple-200 transition-all flex flex-col justify-between overflow-hidden">
        {/* Top Paper Header */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-sans">
                Draft
              </span>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-purple-50 text-purple-700 tracking-wider uppercase border border-purple-100/80">
              {formatUpper}
            </span>
          </div>

          {/* Chapter Title Skeleton Line */}
          <div className="pt-0.5">
            <div className="h-2 w-3/5 bg-gray-800/80 rounded-none mb-1.5" />
            <div className="h-1 w-full bg-gray-200/70 rounded-none" />
          </div>

          {/* Authentic Book Typography Snippet */}
          <div className="pt-2 text-[10.5px] leading-relaxed text-gray-600 line-clamp-6 select-none font-serif tracking-normal">
            {doc.excerpt || "Start typing your manuscript..."}
          </div>
        </div>

        {/* Paper Sheet Footer Meta */}
        <div className="pt-3 flex items-center justify-between border-t border-gray-100 text-[9.5px] text-gray-400 font-sans">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-gray-600">{wordCount.toLocaleString()}w</span>
            <span>•</span>
            <span className="flex items-center gap-0.5 text-gray-400">
              <ClockIcon className="w-2.5 h-2.5" />
              {readingTime}m
            </span>
          </div>

          <span
            className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded-none text-[8.5px] uppercase tracking-wider ${
              isEdit
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
          >
            <GitBranchIcon className="w-2.5 h-2.5" />
            <span>{doc.branch.name || "main"}</span>
          </span>
        </div>
      </div>

      {/* Card Bottom Meta Container (Soft Edged) */}
      <div className="p-3.5 bg-gray-50/90 border-x border-b border-gray-200/90 rounded-b-2xl flex items-center justify-between gap-2 shadow-xs group-hover:bg-white transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Inkbase Manuscript Icon */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-purple-100/70 text-purple-700">
            <BookOpenIcon className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
              {doc.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-gray-400">{formattedDate}</span>
              {isEdit && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
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
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-200/60 transition"
          >
            <MoreVerticalIcon className="w-3.5 h-3.5" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 bottom-full mb-1 z-30 w-48 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl"
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
    </motion.div>
  );
}
