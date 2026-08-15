import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, GitBranch, Download, Clock, BookOpen, Trash2 } from "lucide-react";
import type { DocumentItem } from "./types";

export function RecentSpotlight({
  doc,
  onOpen,
  onExport,
  onDelete,
}: {
  doc: DocumentItem;
  onOpen: () => void;
  onExport?: (id: string, format: string) => void;
  onDelete?: (id: string) => void;
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
    <div className="relative overflow-visible rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-gray-50/50 to-blue-50/20 p-6 shadow-xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        {/* Left Column: Playful Remark & CTAs */}
        <div className="flex-1 space-y-4 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Current Focus</span>
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 font-medium">Last edited {formattedDate}</span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 font-serif">
              Ready to jump back in, chief?
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-semibold text-gray-900">“{doc.title}”</span> is waiting for your next sentence. You&apos;re on the{" "}
              <span className="font-semibold text-gray-800 font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200">
                {doc.branch.name || "main"}
              </span>{" "}
              branch with <span className="font-semibold text-gray-900">{wordCount.toLocaleString()} words</span> written.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-gray-400" />
              <span>{wordCount.toLocaleString()} words</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>~{readingTime} min read</span>
            </div>
            {isEdit && (
              <div className="flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                <GitBranch className="w-3 h-3" />
                <span>+{pendingChanges} pending edits</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpen}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <span>Resume Writing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>

            {/* Quick Export Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>Export</span>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.1 }}
                    className="absolute left-0 top-full mt-1 z-30 w-44 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl"
                  >
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Export Format
                    </div>
                    {["docx", "pdf", "md", "epub", "txt"].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onExport?.(doc.id, fmt);
                        }}
                        className="flex w-full items-center px-3 py-1.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-700 uppercase font-medium"
                      >
                        .{fmt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Paper Sheet Snapshot (Sharp Edges) */}
        <div
          onClick={onOpen}
          className="w-full lg:w-72 shrink-0 cursor-pointer group"
        >
          <div className="relative aspect-[4/3] lg:aspect-[3/4] w-full rounded-none border border-gray-200/90 bg-white p-4.5 shadow-[0_2px_8px_rgba(0,0,0,0.05)] group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.09)] group-hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-gray-100">
                <div className="h-2 w-2/5 bg-gray-800/80 rounded-none" />
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-blue-50 text-blue-700 tracking-wider uppercase border border-blue-100">
                  {formatUpper}
                </span>
              </div>

              <div className="space-y-1 pt-0.5">
                <div className="h-1.5 w-full bg-gray-200/80 rounded-none" />
                <div className="h-1.5 w-4/5 bg-gray-200/60 rounded-none" />
              </div>

              <div className="pt-2 text-[10px] leading-relaxed text-gray-600 line-clamp-4 lg:line-clamp-6 select-none font-serif">
                {doc.excerpt || "Start typing your manuscript..."}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-[9px] text-gray-400 font-sans">
              <span className="font-medium">{wordCount.toLocaleString()} words</span>
              <span className="text-blue-600 font-semibold group-hover:underline">Click to edit →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
