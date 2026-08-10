"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Users,
  GitFork,
  CheckCircle2,
  Heart,
  Check,
  Wand2,
} from "lucide-react";

const featureVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.08 * i + 0.1, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function AuthHero() {
  // Animation step loop:
  // 0: Cursor hovers line 1 ("faces blank as stone")
  // 1: Popup 1 appears, cursor moves directly to Approve button
  // 2: Cursor clicks Approve button (ripple effect + press)
  // 3: Text 1 morphs to "features carved like cold granite."
  // 4: Cursor moves to line 2 ("Elira hesitated")
  // 5: Popup 2 appears, cursor moves to Approve button
  // 6: Cursor clicks Approve button (ripple effect + press)
  // 7: Text 2 morphs to "Elira paused, steadying her breath."
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 8);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  const isLine1Approved = step >= 3 && step < 8;
  const isLine2Approved = step >= 7;

  const showPopup1 = step === 1 || step === 2;
  const showPopup2 = step === 5 || step === 6;

  // Exact coordinates for pointer tip landing precisely on the center of the "Approve" button
  let cursorX = 140;
  let cursorY = 100;
  let isClicking = false;

  if (step === 0) {
    cursorX = 140;
    cursorY = 100;
  } else if (step === 1) {
    cursorX = 234;
    cursorY = 194;
  } else if (step === 2) {
    cursorX = 234;
    cursorY = 194;
    isClicking = true;
  } else if (step === 3) {
    cursorX = 180;
    cursorY = 140;
  } else if (step === 4) {
    cursorX = 130;
    cursorY = 180;
  } else if (step === 5) {
    cursorX = 229;
    cursorY = 289;
  } else if (step === 6) {
    cursorX = 229;
    cursorY = 289;
    isClicking = true;
  } else if (step === 7) {
    cursorX = 260;
    cursorY = 340;
  }

  return (
    <div className="relative flex h-screen max-h-screen w-full flex-col justify-between overflow-hidden bg-[#FBF8F3] px-6 py-6 xl:px-10 xl:py-8 select-none">
      {/* Ambient background blur */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

      {/* Header / Logo */}
      <div className="relative z-10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <h1
            className="text-3xl xl:text-4xl font-bold tracking-tight text-slate-900"
            style={{ fontFamily: "var(--font-lobster), cursive" }}
          >
            Inkbase
          </h1>
          <motion.div
            animate={{ rotate: [0, 15, -10, 0], scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <Sparkles className="h-5 w-5 text-purple-600 fill-purple-200" />
          </motion.div>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
          <Heart className="h-3.5 w-3.5 fill-purple-500 text-purple-500 animate-pulse" />
          <span>Loved by writers who ship.</span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="relative z-10 my-auto grid w-full grid-cols-1 items-center gap-6 xl:grid-cols-12">
        {/* Left Column: Copy & Value Proposition */}
        <div className="flex flex-col justify-center xl:col-span-5 space-y-4">
          <div className="space-y-1.5">
            <h2 className="text-2xl lg:text-3xl xl:text-[2.2rem] font-extrabold leading-tight text-slate-900 tracking-tight">
              PR reviews, <br />
              but for{" "}
              <span className="relative inline-block text-purple-700">
                writing.
                <svg
                  className="absolute -bottom-1 left-0 w-full text-purple-400 opacity-80"
                  height="6"
                  viewBox="0 0 100 12"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,8 Q50,0 100,8"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
            <p className="text-xs xl:text-sm text-slate-600 leading-relaxed font-normal">
              Inkbase reviews your manuscript line by line—suggesting edits,
              checking consistency, and helping you ship your{" "}
              <strong className="font-semibold text-purple-900">
                best story
              </strong>
              .
            </p>
          </div>

          {/* Feature Bullets */}
          <div className="space-y-2.5 pt-1">
            <motion.div
              custom={0}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Sentence-level suggestions
                </h3>
                <p className="text-[11px] text-slate-500">
                  Clarity, flow, and style—one line at a time.
                </p>
              </div>
            </motion.div>

            <motion.div
              custom={1}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shadow-sm">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Character &amp; plot consistency
                </h3>
                <p className="text-[11px] text-slate-500">
                  Catch gaps, contradictions, and lore drift.
                </p>
              </div>
            </motion.div>

            <motion.div
              custom={2}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 shadow-sm">
                <GitFork className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Story structure insights
                </h3>
                <p className="text-[11px] text-slate-500">
                  Pacing, tension, and beats that land.
                </p>
              </div>
            </motion.div>

            <motion.div
              custom={3}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shadow-sm">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Actionable, not overwhelming
                </h3>
                <p className="text-[11px] text-slate-500">
                  AI suggestions you can review and accept.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Column: Standard US Letter / Bond Paper Mockup */}
        <div className="relative flex items-center justify-center xl:col-span-7">
          <div className="relative w-full max-w-[320px] sm:max-w-[360px] xl:max-w-[390px] aspect-[8.5/11] rounded-lg border border-amber-200/80 bg-[#FFFDF9] p-6 xl:p-7 shadow-2xl shadow-slate-900/10 flex flex-col justify-between overflow-hidden">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between border-b border-amber-100/80 pb-3 mb-4">
                <div>
                  <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                    CHAPTER 12
                  </span>
                  <h3 className="text-base xl:text-lg font-serif font-bold text-slate-900 tracking-tight">
                    Dawn of Nothing
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  p. 142
                </span>
              </div>

              {/* Manuscript Content */}
              <div className="space-y-4 font-serif text-xs xl:text-sm text-slate-800 leading-relaxed">
                <p>
                  The wind clawed at her coat as she stepped into the courtyard.
                  Guards lined the walls,{" "}
                  <AnimatePresence mode="wait">
                    {!isLine1Approved ? (
                      <motion.mark
                        key="line1-orig"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-purple-100 text-purple-950 px-1.5 py-0.5 rounded font-sans text-xs font-medium border-b-2 border-purple-400 inline-flex items-center gap-1"
                      >
                        <span>faces blank as stone.</span>
                      </motion.mark>
                    ) : (
                      <motion.mark
                        key="line1-new"
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
                    {!isLine2Approved ? (
                      <motion.mark
                        key="line2-orig"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-sans text-xs font-medium border-b-2 border-amber-400"
                      >
                        Elira hesitated.
                      </motion.mark>
                    ) : (
                      <motion.mark
                        key="line2-new"
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

                <p className="text-slate-600">
                  The letter trembled in her hands. It had changed everything.
                </p>
              </div>

              {/* Skeleton lines */}
              <div className="mt-6 space-y-2">
                <div className="h-1.5 w-11/12 rounded-full bg-slate-100" />
                <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
                <div className="h-1.5 w-full rounded-full bg-slate-100" />
                <div className="h-1.5 w-2/3 rounded-full bg-slate-100" />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-amber-100/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>MANUSCRIPT_DRAFT_V3</span>
              <span>WORD COUNT: 42,190</span>
            </div>

            {/* INLINE AI SUGGESTION POPUP 1 */}
            <AnimatePresence>
              {showPopup1 && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.92 }}
                  className="absolute top-[75px] left-[30px] z-30 w-[260px] rounded-xl border border-purple-200 bg-white p-3 shadow-xl shadow-purple-900/10"
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
                      {isClicking && step === 2 && (
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
                          isClicking && step === 2
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

            {/* INLINE AI SUGGESTION POPUP 2 */}
            <AnimatePresence>
              {showPopup2 && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.92 }}
                  className="absolute top-[170px] left-[25px] z-30 w-[260px] rounded-xl border border-amber-200 bg-white p-3 shadow-xl shadow-amber-900/10"
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
                      {isClicking && step === 6 && (
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
                          isClicking && step === 6
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

            {/* ANIMATED SVG CURSOR */}
            <motion.div
              animate={{ x: cursorX, y: cursorY, scale: isClicking ? 0.82 : 1 }}
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
        </div>
      </div>

      {/* Tagline Footer */}
      <div className="relative z-10 shrink-0 pt-2 flex items-center justify-between">
        <div>
          <p
            className="text-base font-bold text-slate-700 leading-tight"
            style={{ fontFamily: "var(--font-lobster), cursive" }}
          >
            Less guesswork. More great writing.
          </p>
          <svg
            className="w-32 text-purple-400 opacity-90 mt-0.5"
            height="6"
            viewBox="0 0 140 12"
            fill="none"
          >
            <path
              d="M 5,8 Q 35,2 70,8 T 135,5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="xl:hidden flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-white/80 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
          <Heart className="h-3 w-3 fill-purple-500 text-purple-500 animate-pulse" />
          <span>Loved by writers who ship.</span>
        </div>
      </div>
    </div>
  );
}
