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
      {/* Paper Sheet Preview Area (Sharp Edges - Physical Paper Rule) */}
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
            : "border-slate-300 hover:border-blue-500 shadow-[0_1px_4px_rgba(100,130,170,0.06)] hover:shadow-[0_8px_24px_rgba(80,110,170,0.12)] cursor-pointer"
        }`}
      >
        {icon ? (
          icon
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 group-hover:scale-105 group-hover:bg-blue-100 transition-all">
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
              New / Import
            </span>
          </div>
        )}
      </motion.button>

      {/* Card Bottom Meta Container (Soft Edged) */}
      <div className="p-3.5 bg-slate-50/90 border-x border-b border-slate-200/90 rounded-b-2xl flex flex-col items-center justify-center text-center shadow-xs group-hover:bg-white transition-colors">
        <span className="text-xs font-semibold text-slate-900 truncate max-w-full">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-slate-400 truncate max-w-full mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
