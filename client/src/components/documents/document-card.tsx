"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, MoreVertical, Trash2, Download } from "lucide-react";
import type { DocumentItem } from "./types";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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
  const wordCount = doc.wordCount ?? doc.word_count ?? 0;
  const isEdit = doc.branch?.isEdit || doc.branch?.is_edit || false;
  const pendingChanges = doc.branch?.pendingChanges ?? doc.branch?.pending_changes ?? 0;
  const formatUpper = (doc.format || "TXT").toUpperCase();

  const formattedDate =
    doc.lastEdited ||
    (doc.updated_at
      ? new Date(doc.updated_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Recent");

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.16 }}
      onClick={onClick}
      className="group relative flex h-full cursor-pointer flex-col overflow-visible"
    >
      {/* 1. Paper Sheet Preview (Strictly Sharp Edges - Physical Paper Look) */}
      <div className="relative aspect-[3/4] w-full rounded-none border border-slate-200/90 bg-white p-4.5 shadow-[0_2px_8px_rgba(80,120,150,0.07)] group-hover:shadow-[0_10px_26px_rgba(60,110,140,0.14)] group-hover:border-[#A2D9E2] transition-all flex flex-col justify-between overflow-hidden">
        {/* Top Paper Header & Skeletal lines */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100/90">
            <div className="h-2 w-2/5 bg-slate-800/80 rounded-none" />
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-[#E5F5F8] text-[#2C7E86] tracking-wider uppercase border border-[#D0EEF4]">
              {formatUpper}
            </span>
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="h-1.5 w-full bg-slate-200/80 rounded-none" />
            <div className="h-1.5 w-11/12 bg-slate-200/70 rounded-none" />
            <div className="h-1.5 w-4/5 bg-slate-200/60 rounded-none" />
          </div>

          {/* Micro Snippet Text / Excerpt */}
          <div className="pt-2 text-[10px] leading-relaxed text-slate-600 line-clamp-6 select-none font-serif tracking-normal">
            {doc.excerpt || "No excerpt available."}
          </div>
        </div>

        {/* Paper Sheet Footer Meta */}
        <div className="pt-2.5 flex items-center justify-between border-t border-slate-100 text-[9px] text-slate-400 font-sans">
          <span className="font-medium text-slate-500">{wordCount.toLocaleString()} words</span>
          <span
            className={`font-semibold px-1.5 py-0.5 rounded-none text-[8px] uppercase tracking-wider ${
              isEdit
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            {doc.branch?.name || "main"}
          </span>
        </div>
      </div>

      {/* 2. Separate Soft Bottom Meta Container (Distinct Pill Dock with Soft Edges) */}
      <div className="mt-2.5 p-3 rounded-2xl bg-gradient-to-br from-[#EAF6F8] via-[#DEF2F6] to-[#CFECF3] border border-white/90 shadow-[0_2px_8px_rgba(80,120,150,0.06)] flex items-center justify-between gap-2 group-hover:bg-white group-hover:shadow-sm transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/80 text-[#2C7E86] shadow-2xs border border-white">
            <FileText className="w-3.5 h-3.5" />
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-850 truncate group-hover:text-[#2C7E86] transition-colors">
              {doc.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-slate-400 font-medium">{formattedDate}</span>
              {isEdit && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                  {pendingChanges} edits
                </span>
              )}
            </div>
          </div>
        </div>

        {/* shadcn Dropdown Menu */}
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Document options"
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-white/80 transition cursor-pointer outline-none"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Export As</DropdownMenuLabel>
              {["docx", "pdf", "md", "epub", "txt"].map((fmt) => (
                <DropdownMenuItem
                  key={fmt}
                  onClick={() => onExport?.(doc.id, fmt)}
                  className="font-medium uppercase"
                >
                  <Download className="w-3.5 h-3.5 mr-2 text-slate-400" />
                  .{fmt}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(doc.id)}
                className="font-semibold text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2 text-red-500" />
                Delete manuscript
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.div>
  );
}
