import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusIcon, UploadCloudIcon, FileTextIcon, SparklesIcon, BookOpenIcon } from "lucide-react";
import { SUPPORTED_EXTENSIONS } from "./data";

export function DropzoneBanner({
  onImportFile,
  onCreateBlank,
  disabled,
  usedSlots,
  maxSlots,
}: {
  onImportFile: (file: File) => void;
  onCreateBlank: (title?: string) => void;
  disabled?: boolean;
  usedSlots: number;
  maxSlots: number;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onImportFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 ${
        isDragging
          ? "border-purple-500 bg-purple-50/80 shadow-lg ring-2 ring-purple-400/50"
          : "border-gray-200/90 bg-gradient-to-r from-white via-stone-50/60 to-purple-50/30 shadow-xs hover:border-gray-300"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_EXTENSIONS}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-5 lg:p-6 gap-6">
        {/* Left: Quick Actions & Welcome */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/80 text-purple-800 border border-purple-200/60">
              <SparklesIcon className="w-3 h-3 text-purple-600" />
              <span>Modern Prose Studio</span>
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 font-medium">
              {usedSlots} of {maxSlots} manuscript slots used
            </span>
          </div>

          <h2 className="text-lg lg:text-xl font-bold tracking-tight text-gray-900 font-serif">
            Draft, branch, and review your next manuscript.
          </h2>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <motion.button
              type="button"
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
              onClick={() => !disabled && onCreateBlank()}
              disabled={disabled}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                disabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-purple-700 hover:bg-purple-800 text-white shadow-purple-900/10 cursor-pointer"
              }`}
            >
              <PlusIcon className="w-4 h-4" />
              <span>Blank Manuscript</span>
            </motion.button>

            {/* Quick Templates */}
            <button
              type="button"
              onClick={() => !disabled && onCreateBlank("Untitled Novel Chapter")}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 bg-white border border-gray-200/80 hover:bg-gray-50 hover:border-gray-300 transition shadow-2xs"
            >
              <BookOpenIcon className="w-3.5 h-3.5 text-gray-500" />
              <span>Novel Chapter</span>
            </button>

            <button
              type="button"
              onClick={() => !disabled && onCreateBlank("Short Story Draft")}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 bg-white border border-gray-200/80 hover:bg-gray-50 hover:border-gray-300 transition shadow-2xs"
            >
              <FileTextIcon className="w-3.5 h-3.5 text-gray-500" />
              <span>Short Story</span>
            </button>
          </div>
        </div>

        {/* Right: Drag & Drop Upload Zone */}
        <div
          onClick={() => {
            if (!disabled && fileInputRef.current) {
              fileInputRef.current.value = "";
              fileInputRef.current.click();
            }
          }}
          className={`flex-1 max-w-md flex flex-col items-center justify-center p-4 lg:p-5 rounded-xl border border-dashed text-center transition-all ${
            disabled
              ? "border-gray-200 bg-gray-50/50 opacity-60 cursor-not-allowed"
              : isDragging
              ? "border-purple-500 bg-purple-100/50 cursor-copy"
              : "border-purple-200/80 bg-white/80 hover:bg-purple-50/40 hover:border-purple-300 cursor-pointer shadow-2xs"
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100/80 text-purple-700 mb-2">
            <UploadCloudIcon className="w-5 h-5" />
          </div>

          <p className="text-xs font-semibold text-gray-800">
            {isDragging ? "Drop your file to import" : "Drag & drop files or click to upload"}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Accepts <span className="font-medium text-purple-900">.docx, .pdf, .md, .epub, .rtf, .odt, .txt</span>
          </p>
        </div>
      </div>
    </div>
  );
}
