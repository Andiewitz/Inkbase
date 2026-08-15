"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, MoreVertical, Trash2, Download } from "lucide-react";
import type { DocumentItem } from "./types";
import { PaperPreview } from "./paper-preview";
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
  const isEdit = doc.branch?.isEdit || doc.branch?.is_edit || false;
  const pendingChanges = doc.branch?.pendingChanges ?? doc.branch?.pending_changes ?? 0;

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
      {/* 1. Paper Sheet Preview (1:1 Miniature Page Preview) */}
      <PaperPreview doc={doc} />

      {/* 2. Pedestal Meta Container (Flat top blending with paper, soft rounded bottom) */}
      <div className="p-3.5 rounded-t-none rounded-b-2xl bg-gradient-to-br from-[#EAF6F8] via-[#DEF2F6] to-[#CFECF3] border-x border-b border-slate-200/90 shadow-[0_2px_8px_rgba(80,120,150,0.06)] flex items-center justify-between gap-2 group-hover:bg-white group-hover:shadow-sm transition-all">
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
