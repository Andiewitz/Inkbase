"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Wand2 } from "lucide-react";

// Animation loop:
// 0: cursor over line 1       1: popup 1 appears
// 2: click Approve            3: line 1 morphs to approved
// 4: cursor to line 2         5: popup 2 appears
// 6: click Approve            7: line 2 morphs to approved
const STEPS = 8;

export function ManuscriptPreview() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setStep((prev) => (prev + 1) % STEPS), 2100);
    return () => clearInterval(timer);
  }, []);

  const line1Approved = step >= 3;
  const line2Approved = step >= 7;
  const popup1 = step === 1 || step === 2;
  const popup2 = step === 5 || step === 6;

  let cursorX = 150;
  let cursorY = 108;
  let clicking = false;

  if (step === 0) {
    cursorX = 150;
    cursorY = 108;
  } else if (step === 1 || step === 2) {
    cursorX = 246;
    cursorY = 214;
    clicking = step === 2;
  } else if (step === 3) {
    cursorX = 190;
    cursorY = 150;
  } else if (step === 4) {
    cursorX = 140;
    cursorY = 190;
  } else if (step === 5 || step === 6) {
    cursorX = 240;
    cursorY = 306;
    clicking = step === 6;
  } else if (step === 7) {
    cursorX = 270;
    cursorY = 350;
  }

  return (
    <div className="relative w-full max-w-[360px] aspect-[8.5/11] rounded-lg border border-amber-200/80 bg-[#FFFDF9] p-6 shadow-2xl shadow-slate-900/10 flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="relative z-10">
        <div className="flex items-center justify-between border-b border-amber-100/80 pb-3 mb-4">
          <div>
            <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
              CHAPTER 12
            </span>
            <h3 className="text-base font-serif font-bold text-slate-900 tracking-tight">
              Dawn of Nothing
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">p. 142</span>
        </div>

        <div className="space-y-4 font-serif text-xs text-slate-800 leading-relaxed">
          <p>
            The wind clawed at her coat as she stepped into the courtyard.
            Guards lined the walls,{" "}
            <AnimatePresence mode="wait">
              {!line1Approved ? (
                <motion.mark
                  key="l1-orig"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-purple-100 text-purple-950 px-1.5 py-0.5 rounded font-sans text-xs font-medium border-b-2 border-purple-400 inline-flex items-center gap-1"
                >
                  <span>faces blank as stone.</span>
                </motion.mark>
              ) : (
                <motion.mark
                  key="l1-new"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-100 text-emerald-950 px-1.5 py-0.5 rounded font-sans text-xs font-semibold border-b-2 border-emerald-400 inline-flex items-center gap-1 shadow-sm"
                >
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>features carved like cold granite.</span>
                </motion.mark>
              )}
            </AnimatePresence>{" "}
            Somewhere beyond, the city waited.
          </p>

          <p>
            <AnimatePresence mode="wait">
              {!line2Approved ? (
                <motion.mark
                  key="l2-orig"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-sans text-xs font-medium border-b-2 border-amber-400 inline-flex items-center gap-1"
                >
                  <span>Elira hesitated.</span>
                </motion.mark>
              ) : (
                <motion.mark
                  key="l2-new"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-100 text-emerald-950 px-1.5 py-0.5 rounded font-sans text-xs font-semibold border-b-2 border-emerald-400 inline-flex items-center gap-1 shadow-sm"
                >
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Elira paused, steadying her breath.</span>
                </motion.mark>
              )}
            </AnimatePresence>{" "}
            She wasn&apos;t sure she was ready for what came next.
          </p>
        </div>

        <div className="mt-6 space-y-2">
          <div className="h-1.5 w-11/12 rounded-full bg-slate-100" />
          <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
          <div className="h-1.5 w-full rounded-full bg-slate-100" />
          <div className="h-1.5 w-2/3 rounded-full bg-slate-100" />
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 pt-4 border-t border-amber-100/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>MANUSCRIPT_DRAFT_V3</span>
        <span>WORD COUNT: 42,190</span>
      </div>

      {/* Popup 1 */}
      <AnimatePresence>
        {popup1 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.92 }}
            className="absolute top-[78px] left-[24px] z-30 w-[260px] rounded-xl border border-purple-200 bg-white p-3 shadow-xl shadow-purple-900/10"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700">
                <Wand2 className="h-3.5 w-3.5" />
                <span>AI Clarity Review</span>
              </div>
              <span className="text-[9px] bg-purple-50 text-purple-600 font-semibold px-1.5 py-0.5 rounded">
                High Confidence
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
              Replace cliché phrase with evocative imagery:
            </p>
            <div className="mt-1.5 rounded bg-purple-50 p-1.5 text-[11px] font-medium text-purple-900 border border-purple-100">
              &quot;features carved like cold granite.&quot;
            </div>
            <div className="mt-2.5 flex items-center justify-end">
              <div className="relative">
                {clicking && step === 2 && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-md bg-purple-400 pointer-events-none"
                  />
                )}
                <button
                  type="button"
                  className={`flex items-center gap-1 rounded-md px-3.5 py-1 text-xs font-bold text-white transition-all shadow-sm ${
                    clicking && step === 2
                      ? "bg-purple-800 scale-90 ring-2 ring-purple-400"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup 2 */}
      <AnimatePresence>
        {popup2 && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.92 }}
            className="absolute top-[176px] left-[20px] z-30 w-[260px] rounded-xl border border-amber-200 bg-white p-3 shadow-xl shadow-amber-900/10"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <Wand2 className="h-3.5 w-3.5" />
                <span>Pacing Suggestion</span>
              </div>
              <span className="text-[9px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded">
                Enhance Tension
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
              Make reaction active &amp; vivid:
            </p>
            <div className="mt-1.5 rounded bg-amber-50 p-1.5 text-[11px] font-medium text-amber-950 border border-amber-100">
              &quot;Elira paused, steadying her breath.&quot;
            </div>
            <div className="mt-2.5 flex items-center justify-end">
              <div className="relative">
                {clicking && step === 6 && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0.8 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-md bg-amber-400 pointer-events-none"
                  />
                )}
                <button
                  type="button"
                  className={`flex items-center gap-1 rounded-md px-3.5 py-1 text-xs font-bold text-white transition-all shadow-sm ${
                    clicking && step === 6
                      ? "bg-amber-800 scale-90 ring-2 ring-amber-400"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated AI cursor */}
      <motion.div
        animate={{ x: cursorX, y: cursorY, scale: clicking ? 0.82 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="absolute top-0 left-0 z-40 pointer-events-none drop-shadow-md"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.17157L17.2132 12.3673H5.65376Z"
            fill="#7C3AED"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        </svg>
        <div className="ml-3 -mt-1 rounded-full bg-purple-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
          AI Editor
        </div>
      </motion.div>
    </div>
  );
}
