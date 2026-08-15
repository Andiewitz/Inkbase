"use client";

import React from "react";
import { motion } from "framer-motion";

export function StudioStatCard({
  title,
  value,
  icon,
  subtitle,
  onClick,
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  subtitle?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="relative flex flex-col justify-between rounded-3xl border border-white/80 bg-gradient-to-br from-[#D9F2F7] via-[#D1EFF5] to-[#C3EBF2] p-5 shadow-[0_4px_16px_rgba(120,165,185,0.12)] cursor-pointer overflow-hidden group"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-600 tracking-wide">
            {title}
          </span>
          {subtitle && (
            <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-2xs border border-white/90 group-hover:bg-white group-hover:scale-105 transition-all">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <span className="text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight">
          {value}
        </span>
      </div>
    </motion.div>
  );
}
