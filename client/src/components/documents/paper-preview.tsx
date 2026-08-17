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
  const rawContent = (doc.content || doc.excerpt || "").trim();

  const isHtml =
    rawContent.startsWith("<") &&
    (rawContent.includes("</p>") ||
      rawContent.includes("</h1>") ||
      rawContent.includes("</h2>") ||
      rawContent.includes("</h3>") ||
      rawContent.includes("</div>") ||
      rawContent.includes("<br"));

  return (
    <div
      className={`relative aspect-[8.5/11] w-full rounded-none border border-slate-200/90 bg-white p-4.5 shadow-[0_2px_8px_rgba(80,120,150,0.08)] group-hover:shadow-[0_10px_26px_rgba(60,110,140,0.14)] group-hover:border-[#A2D9E2] transition-all flex flex-col justify-start overflow-hidden select-none font-serif ${className}`}
    >
      {/* Document Title Header (1:1 Document Heading) */}
      <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-snug tracking-tight mb-2 pb-1.5 border-b border-slate-100 font-sans">
        {doc.title || "Untitled Document"}
      </h3>

      {/* Document Body Prose (Exact 1:1 whitespace, heading & formatting preservation) */}
      <div className="flex-1 overflow-hidden">
        {rawContent ? (
          isHtml ? (
            <div
              className="text-[7.5px] leading-[1.45] text-slate-700 font-serif overflow-hidden break-words [&_h1]:text-[9.5px] [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mb-1 [&_h1]:mt-1.5 [&_h2]:text-[8.5px] [&_h2]:font-bold [&_h2]:text-slate-850 [&_h2]:mb-0.5 [&_h3]:text-[8px] [&_h3]:font-semibold [&_p]:mb-1.5 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-3 [&_ol]:list-decimal [&_ol]:pl-3 [&_li]:mb-0.5 whitespace-normal"
              dangerouslySetInnerHTML={{ __html: rawContent }}
            />
          ) : (
            <div className="text-[7.5px] leading-[1.45] text-slate-700 whitespace-pre-wrap break-words">
              {rawContent}
            </div>
          )
        ) : (
          <p className="text-[7.5px] italic text-slate-400">
            Blank manuscript page. Start typing or import a document...
          </p>
        )}
      </div>
    </div>
  );
}
