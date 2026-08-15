"use client";

import React from "react";
import type { DocumentItem } from "./types";

export function PaperPreview({
  doc,
  className = "",
}: {
  doc: DocumentItem;
  className?: string;
}) {
  const formatUpper = (doc.format || "TXT").toUpperCase();
  const wordCount = doc.wordCount ?? doc.word_count ?? 0;

  // Split content / excerpt into realistic miniature paragraphs
  const rawText = doc.content || doc.excerpt || "";
  const paragraphs = rawText
    ? rawText.split(/\n+/).filter((p) => p.trim().length > 0)
    : [
        "The morning sun broke through the tall windows, casting long rectangular shadows across the worn oak desk.",
        "A fresh sheet of paper lay waiting, its surface untouched, inviting the first stroke of ink to bring a new world to life.",
        "Every paragraph carried the weight of deliberate thought, balancing rhythm, tension, and prose in harmony.",
      ];

  return (
    <div
      className={`relative aspect-[8.5/11] w-full rounded-none border border-slate-200/90 bg-white p-4 shadow-[0_2px_8px_rgba(80,120,150,0.08)] group-hover:shadow-[0_10px_26px_rgba(60,110,140,0.14)] group-hover:border-[#A2D9E2] transition-all flex flex-col justify-between overflow-hidden select-none ${className}`}
    >
      {/* Top Margin & Authentic Document Header */}
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2 pb-1 border-b border-slate-200/80">
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] font-bold font-serif text-slate-900 leading-tight truncate tracking-tight">
              {doc.title || "Untitled Manuscript"}
            </h4>
            <div className="flex items-center gap-1.5 text-[7px] text-slate-400 font-sans mt-0.5">
              <span>Chapter 1</span>
              <span>•</span>
              <span className="font-mono text-[6.5px] uppercase">{doc.branch?.name || "main"}</span>
            </div>
          </div>
          <span className="text-[7.5px] font-bold px-1 py-0.2 rounded-none bg-[#E5F5F8] text-[#2C7E86] tracking-wider uppercase border border-[#D0EEF4] shrink-0">
            {formatUpper}
          </span>
        </div>

        {/* 1:1 Scaled Miniature Manuscript Body Prose */}
        <div className="pt-1.5 space-y-1.5 text-[7.5px] leading-[1.35] text-slate-700 font-serif overflow-hidden">
          {paragraphs.slice(0, 5).map((para, i) => (
            <p key={i} className="indent-2 text-justify line-clamp-3">
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Page Footer (Like a 1:1 real typed document page) */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[7px] text-slate-400 font-sans">
        <span className="font-medium">{wordCount.toLocaleString()} words</span>
        <span className="font-mono text-[7px] text-slate-400">1</span>
      </div>
    </div>
  );
}
