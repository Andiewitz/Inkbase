"use client";

import React from "react";
import {
  Sparkles,
  ArrowRight,
  GitBranch,
  Download,
  Clock,
  BookOpen,
} from "lucide-react";
import type { DocumentItem } from "./types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function RecentSpotlight({
  doc,
  onOpen,
  onExport,
}: {
  doc: DocumentItem;
  onOpen: () => void;
  onExport?: (id: string, format: string) => void;
  onDelete?: (id: string) => void;
}) {
  const wordCount = doc.wordCount ?? doc.word_count ?? 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
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
    <div className="relative overflow-hidden rounded-3xl border border-white/90 bg-gradient-to-br from-[#E0F4F7] via-[#D3F0F5] to-[#C5EBF2] p-6 shadow-[0_4px_20px_rgba(100,160,180,0.14)]">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6">
        {/* Left Column: Physical Paper Sheet Snapshot (Sharp Edges - Physical Paper Rule) */}
        <div
          onClick={onOpen}
          className="w-full sm:w-56 shrink-0 cursor-pointer group"
        >
          <div className="relative aspect-[3/4] w-full rounded-none border border-slate-200/90 bg-white p-4 shadow-[0_2px_8px_rgba(80,120,150,0.08)] group-hover:shadow-[0_8px_24px_rgba(60,110,140,0.16)] group-hover:border-teal-400 transition-all flex flex-col justify-between overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <div className="h-2 w-2/5 bg-slate-800 rounded-none" />
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-teal-50 text-teal-700 tracking-wider uppercase border border-teal-100">
                  {formatUpper}
                </span>
              </div>

              <div className="space-y-1 pt-0.5">
                <div className="h-1.5 w-full bg-slate-200 rounded-none" />
                <div className="h-1.5 w-4/5 bg-slate-200/70 rounded-none" />
              </div>

              <div className="pt-1.5 text-[10px] leading-relaxed text-slate-600 line-clamp-5 select-none font-serif">
                {doc.excerpt || "Start typing your manuscript..."}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[9px] text-slate-400 font-sans">
              <span className="font-medium">{wordCount.toLocaleString()} words</span>
              <span className="text-teal-700 font-bold group-hover:underline">
                Open →
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Playful Remark & CTAs */}
        <div className="flex-1 space-y-3.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/80 text-teal-800 border border-white shadow-2xs">
              <Sparkles className="w-3 h-3 text-teal-600" />
              <span>Current Focus</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Last edited {formattedDate}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-850 font-serif">
              Ready to jump back in, chief?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-900">“{doc.title}”</span> is
              waiting for your next sentence on the{" "}
              <span className="font-semibold text-slate-800 font-mono text-xs px-1.5 py-0.5 rounded bg-white/80 border border-white">
                {doc.branch?.name || "main"}
              </span>{" "}
              branch.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
            <div className="flex items-center gap-1.5 bg-white/60 px-2.5 py-1 rounded-xl border border-white/80">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>{wordCount.toLocaleString()} words</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/60 px-2.5 py-1 rounded-xl border border-white/80">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>~{readingTime} min read</span>
            </div>
            {isEdit && (
              <div className="flex items-center gap-1 text-amber-800 font-medium bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-200 text-xs">
                <GitBranch className="w-3.5 h-3.5" />
                <span>+{pendingChanges} pending edits</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              size="default"
              onClick={onOpen}
              className="gap-2 cursor-pointer bg-[#2C7E86] hover:bg-[#22666D] text-white rounded-xl shadow-xs hover:shadow-md transition-all font-semibold"
            >
              <span>Resume Writing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="default"
                  className="gap-1.5 cursor-pointer bg-white/90 border-white hover:bg-white rounded-xl shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44 rounded-2xl">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}
