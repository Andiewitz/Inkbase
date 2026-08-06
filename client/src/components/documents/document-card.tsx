import { motion } from "framer-motion";
import type { DocumentItem } from "./types";

export function DocumentCard({
  doc,
  onClick,
}: {
  doc: DocumentItem;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-gray-300 transition-all"
    >
      {/* Paper Sheet Preview Area */}
      <div className="relative aspect-[3/4] w-full bg-gray-50 border-b border-gray-100 p-4 overflow-hidden flex flex-col justify-start">
        {/* Paper Document Representation */}
        <div className="w-full h-full bg-white rounded-md border border-gray-200/80 shadow-xs p-3 flex flex-col space-y-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="h-2 w-3/4 bg-gray-800/80 rounded-xs mb-1" />
          <div className="h-1.5 w-full bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-full bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-5/6 bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-full bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-4/5 bg-gray-300/70 rounded-xs" />

          {/* Actual Micro Snippet Text Preview */}
          <div className="pt-2 text-[9px] leading-[1.3] text-gray-500 line-clamp-6 select-none font-serif">
            {doc.excerpt}
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-100 text-[8px] text-gray-400 font-sans">
            <span>{doc.wordCount} words</span>
            <span
              className={`font-semibold px-1 rounded ${
                doc.branch.isEdit
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {doc.branch.name}
            </span>
          </div>
        </div>
      </div>

      {/* Card Bottom Meta (Google Docs Style) */}
      <div className="p-3 bg-white flex items-start justify-between gap-2">
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
              <span className="text-[11px] text-gray-400">{doc.lastEdited}</span>
              {doc.branch.isEdit && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                  {doc.branch.pendingChanges} edits
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-dots Menu Button */}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
