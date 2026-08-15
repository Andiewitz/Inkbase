"use client";

import React from "react";
import { motion } from "framer-motion";
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
    <div className="relative overflow-hidden rounded-2xl border border-sky-200/60 bg-gradient-to-br from-white via-slate-50/70 to-sky-50/40 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-7">
        {/* Left Column: Physical Paper Sheet Snapshot (Sharp Edges - Physical Paper Rule) */}
        <div
          onClick={onOpen}
          className="w-full lg:w-64 shrink-0 cursor-pointer group"
        >
          <div className="relative aspect-[3/4] w-full rounded-none border border-slate-200/90 bg-white p-4.5 shadow-[0_2px_8px_rgba(100,130,170,0.08)] group-hover:shadow-[0_8px_24px_rgba(80,110,170,0.14)] group-hover:border-blue-300 transition-all flex flex-col justify-between overflow-hidden">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <div className="h-2 w-2/5 bg-slate-800/80 rounded-none" />
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-none bg-blue-50 text-blue-700 tracking-wider uppercase border border-blue-100">
                  {formatUpper}
                </span>
              </div>

              <div className="space-y-1 pt-0.5">
                <div className="h-1.5 w-full bg-slate-200/80 rounded-none" />
                <div className="h-1.5 w-4/5 bg-slate-200/60 rounded-none" />
              </div>

              <div className="pt-2 text-[10px] leading-relaxed text-slate-600 line-clamp-5 select-none font-serif">
                {doc.excerpt || "Start typing your manuscript..."}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[9px] text-slate-400 font-sans">
              <span className="font-medium">{wordCount.toLocaleString()} words</span>
              <span className="text-blue-600 font-semibold group-hover:underline">
                Click to edit →
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Playful Remark & CTAs */}
        <div className="flex-1 space-y-4 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Current Focus</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-medium">
              Last edited {formattedDate}
            </span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-serif">
              Ready to jump back in, chief?
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-900">“{doc.title}”</span> is
              waiting for your next sentence. You&apos;re on the{" "}
              <span className="font-semibold text-slate-800 font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                {doc.branch?.name || "main"}
              </span>{" "}
              branch with{" "}
              <span className="font-semibold text-slate-900">
                {wordCount.toLocaleString()} words
              </span>{" "}
              written.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>{wordCount.toLocaleString()} words</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>~{readingTime} min read</span>
            </div>
            {isEdit && (
              <div className="flex items-center gap-1 text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                <GitBranch className="w-3 h-3" />
                <span>+{pendingChanges} pending edits</span>
              </div>
            )}
          </div>

          {/* Action Buttons using shadcn Button & Dropdown */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              size="lg"
              onClick={onOpen}
              className="gap-2 cursor-pointer shadow-xs hover:shadow-md transition-all"
            >
              <span>Resume Writing</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="lg"
                  className="gap-1.5 cursor-pointer bg-white"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
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
