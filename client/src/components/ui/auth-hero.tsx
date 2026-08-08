"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Users,
  GitFork,
  CheckCircle2,
  Heart,
  ArrowRight,
  Sparkle,
} from "lucide-react";

const featureVariants = {
  hidden: { opacity: 0, x: -15 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.08 * i + 0.1, duration: 0.35, ease: "easeOut" },
  }),
};

const floatCardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: 0.12 * i + 0.3, duration: 0.4, ease: "easeOut" },
  }),
};

export default function AuthHero() {
  return (
    <div className="relative flex h-screen max-h-screen w-full flex-col justify-between overflow-hidden bg-[#FBF8F3] px-6 py-6 xl:px-10 xl:py-8 select-none">
      {/* Background ambient glow */}
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

      {/* Main Grid Content - Fits tightly inside viewport */}
      <div className="relative z-10 my-auto grid w-full grid-cols-1 items-center gap-6 xl:grid-cols-12">
        {/* Left Column: Headline & Features */}
        <div className="flex flex-col justify-center xl:col-span-6 space-y-4">
          {/* Headline */}
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
            {/* Feature 1 */}
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

            {/* Feature 2 */}
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

            {/* Feature 3 */}
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

            {/* Feature 4 */}
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

        {/* Right Column: Simulated Manuscript Preview */}
        <div className="relative flex items-center justify-center xl:col-span-6">
          {/* Manuscript Card */}
          <div className="relative w-full max-w-xs xl:max-w-sm rounded-xl border border-amber-200/70 bg-[#FFFDF9] p-5 shadow-lg shadow-amber-950/5">
            {/* Chapter Header */}
            <div className="border-b border-amber-100 pb-2 mb-3">
              <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase">
                CHAPTER 12
              </span>
              <h3 className="text-base font-serif font-bold text-slate-800 tracking-tight">
                Dawn of Nothing
              </h3>
            </div>

            {/* Manuscript Lines */}
            <div className="space-y-2.5 font-serif text-xs text-slate-700 leading-normal">
              <p>
                The wind clawed at her coat as she stepped into the courtyard.
                Guards lined the walls,{" "}
                <mark className="bg-rose-100 text-rose-900 px-1 py-0.5 rounded font-sans text-[11px] border-b border-rose-300">
                  faces blank as stone.
                </mark>
              </p>

              <p>
                <mark className="bg-emerald-100 text-emerald-900 px-1 py-0.5 rounded font-sans text-[11px] border-b border-emerald-300">
                  Elira hesitated. She wasn&apos;t sure she was ready for what
                  came next.
                </mark>
              </p>

              <p>
                <mark className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-sans text-[11px] border-b border-amber-300">
                  The letter trembled in her hands. It had changed everything.
                </mark>
              </p>
            </div>

            {/* Skeleton placeholder lines */}
            <div className="mt-4 space-y-1.5">
              <div className="h-1 w-3/4 rounded-full bg-slate-100" />
              <div className="h-1 w-full rounded-full bg-slate-100" />
            </div>
          </div>

          {/* Floating Suggestion Cards */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-1">
            {/* Suggestion Card 1: Clarity */}
            <motion.div
              custom={0}
              variants={floatCardVariants}
              initial="hidden"
              animate="visible"
              className="pointer-events-auto ml-auto w-48 xl:w-56 rounded-lg border border-rose-100 bg-white/95 p-2.5 shadow-md backdrop-blur-sm -translate-y-2 translate-x-3"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600">
                <Sparkle className="h-3 w-3 fill-rose-500 text-rose-500" />
                <span>Clarity</span>
              </div>
              <p className="mt-0.5 text-[10px] leading-tight text-slate-600">
                &quot;Faces blank as stone&quot; is a common phrase. Consider a
                more specific image.
              </p>
              <button
                type="button"
                className="mt-1.5 flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <span>Show suggestion</span>
                <ArrowRight className="h-2 w-2" />
              </button>
            </motion.div>

            {/* Suggestion Card 2: Consistency */}
            <motion.div
              custom={1}
              variants={floatCardVariants}
              initial="hidden"
              animate="visible"
              className="pointer-events-auto ml-auto w-48 xl:w-56 rounded-lg border border-emerald-100 bg-white/95 p-2.5 shadow-md backdrop-blur-sm translate-x-5 my-auto"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                <Users className="h-3 w-3 text-emerald-600" />
                <span>Consistency</span>
              </div>
              <p className="mt-0.5 text-[10px] leading-tight text-slate-600">
                Elira&apos;s hesitation here contradicts her decision in ch. 11.
              </p>
              <button
                type="button"
                className="mt-1.5 flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <span>Review context</span>
                <ArrowRight className="h-2 w-2" />
              </button>
            </motion.div>

            {/* Suggestion Card 3: Structure */}
            <motion.div
              custom={2}
              variants={floatCardVariants}
              initial="hidden"
              animate="visible"
              className="pointer-events-auto ml-auto w-48 xl:w-56 rounded-lg border border-amber-100 bg-white/95 p-2.5 shadow-md backdrop-blur-sm translate-y-2 translate-x-2"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600">
                <GitFork className="h-3 w-3 text-amber-600" />
                <span>Structure</span>
              </div>
              <p className="mt-0.5 text-[10px] leading-tight text-slate-600">
                Great midpoint. Consider raising the stakes here.
              </p>
              <button
                type="button"
                className="mt-1.5 flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <span>See suggestions</span>
                <ArrowRight className="h-2 w-2" />
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer Tagline */}
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
