"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { SUPPORTED_EXTENSIONS } from "./data";

export function NewDocumentCard({
  title,
  subtitle,
  icon,
  onClick,
  onImportFile,
  disabled,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  onImportFile?: (file: File) => void;
  disabled?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (disabled) return;
    if (onImportFile && fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    } else if (onClick) {
      onClick();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportFile) {
      onImportFile(file);
    }
  };

  return (
    <div className="group relative flex h-full flex-col overflow-visible">
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_EXTENSIONS}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      {/* 1. Paper Sheet Preview Area (Strictly Sharp Edges - Physical Paper Look) */}
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        whileHover={disabled ? {} : { y: -4 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        transition={{ duration: 0.16 }}
        className={`relative aspect-[3/4] w-full rounded-none border border-dashed flex flex-col items-center justify-center p-4.5 bg-white transition-all ${
          disabled
            ? "border-slate-200 opacity-50 cursor-not-allowed bg-slate-50/50"
            : "border-slate-300 hover:border-[#2C7E86] shadow-[0_2px_8px_rgba(80,120,150,0.06)] hover:shadow-[0_10px_26px_rgba(60,110,140,0.14)] cursor-pointer"
        }`}
      >
        {icon ? (
          icon
        ) : (
          <div className="flex flex-col items-center space-y-2.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF6F8] text-[#2C7E86] group-hover:scale-105 group-hover:bg-[#DCF3F7] transition-all shadow-2xs border border-white">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-750 group-hover:text-[#2C7E86] transition-colors">
              New / Import
            </span>
          </div>
        )}
      </motion.button>

      {/* 2. Pedestal Meta Container (Flat top blending with paper, soft rounded bottom) */}
      <div className="p-3.5 rounded-t-none rounded-b-2xl bg-gradient-to-br from-[#EAF6F8] via-[#DEF2F6] to-[#CFECF3] border-x border-b border-slate-200/90 shadow-[0_2px_8px_rgba(80,120,150,0.06)] flex flex-col items-center justify-center text-center group-hover:bg-white group-hover:shadow-sm transition-all">
        <span className="text-xs font-bold text-slate-850 truncate max-w-full">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-slate-400 font-medium truncate max-w-full mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
