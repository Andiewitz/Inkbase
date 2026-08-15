"use client";

import React from "react";
import { motion } from "framer-motion";

export function StatusDonutCard({
  totalCount,
  finalizedCount = 0,
  inReviewCount = 0,
}: {
  totalCount: number;
  finalizedCount?: number;
  inReviewCount?: number;
}) {
  const safeTotal = Math.max(1, totalCount);
  const finalizedPct = (finalizedCount / safeTotal) * 100;
  const inReviewPct = (inReviewCount / safeTotal) * 100;

  // SVG circle math: radius = 40, circumference = 2 * PI * 40 ≈ 251.32
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const finalizedStroke = (finalizedPct / 100) * circumference;
  const inReviewStroke = (inReviewPct / 100) * circumference;

  return (
    <div className="relative flex flex-col justify-between rounded-3xl border border-white/80 bg-gradient-to-br from-[#E2F4F7] via-[#D5F0F5] to-[#C7ECF3] p-5 shadow-[0_4px_16px_rgba(120,165,185,0.12)]">
      <div className="flex items-center justify-between pb-2">
        <h4 className="text-xs font-bold text-slate-700">Manuscript Status</h4>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-0.5 font-semibold text-slate-600 border border-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Main {finalizedCount}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-0.5 font-semibold text-slate-600 border border-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
            Review {inReviewCount}
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-center my-auto py-2">
        <svg width="130" height="130" viewBox="0 0 100 100" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#CBDDE4"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Finalized segment */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#10B981"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={`${finalizedStroke} ${circumference}`}
            strokeDashoffset="0"
            strokeLinecap="round"
          />
          {/* In Review segment */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#2C7E86"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={`${inReviewStroke} ${circumference}`}
            strokeDashoffset={-finalizedStroke}
            strokeLinecap="round"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total
          </span>
          <span className="text-xl font-extrabold text-slate-800 leading-none mt-0.5">
            {totalCount}
          </span>
        </div>
      </div>
    </div>
  );
}
