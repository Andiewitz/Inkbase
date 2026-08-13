"use client";

import React, { useState } from "react";

const FEATURES_LIST = [
  {
    id: "hosting",
    title: "Hosting, handled",
    description:
      "Inkbase handles hosting, SSL, line-by-line feedback, and backend manuscript infrastructure. Your code and data stay yours. Always.",
  },
  {
    id: "stack",
    title: "Your manuscript stack, connected",
    description:
      "Seamlessly connects your local editor, manuscript repositories, and team review pipelines in one unified workflow.",
  },
  {
    id: "diffs",
    title: "Version control, diffed & tracked",
    description:
      "Review suggested manuscript changes with visual inline diffs. Accept or reject edits with single-click precision.",
  },
  {
    id: "security",
    title: "Safe and secure, as standard",
    description:
      "End-to-end encrypted storage ensures your manuscripts and proprietary ideas are never shared or used to train public AI.",
  },
  {
    id: "everywhere",
    title: "Works wherever, whenever",
    description:
      "Available across desktop, web, and offline environments — keeping your writing momentum active anywhere.",
  },
];

export function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState("hosting");

  const currentFeature =
    FEATURES_LIST.find((f) => f.id === activeFeature) || FEATURES_LIST[0];

  return (
    <section className="relative z-10 mx-auto w-full max-w-[99vw] px-2 sm:px-3 lg:px-4 -mt-24 sm:-mt-32 md:-mt-36 lg:-mt-40 pb-20">
      <div className="clay-container-gray relative overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-12 lg:p-16 text-slate-100">
        {/* Subtle ambient gradient highlights */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-pink-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />

        {/* 2-Column Main Layout Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14 lg:items-center">
          {/* Left Column: Headline & Vertical Feature Tabs */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-10">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl font-satoshi leading-[1.12]">
                For writing and beyond
              </h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-400 font-normal max-w-lg">
                Inkbase runs on enterprise-grade infrastructure – so you can create full-stack stories and books that scale.
              </p>
            </div>

            {/* Vertical Interactive Feature List */}
            <div className="space-y-4 pt-2">
              {FEATURES_LIST.map((feature) => {
                const isActive = feature.id === activeFeature;
                return (
                  <div
                    key={feature.id}
                    onClick={() => setActiveFeature(feature.id)}
                    className="group cursor-pointer pt-3"
                  >
                    <h3
                      className={`text-base sm:text-lg font-semibold tracking-tight transition-colors ${
                        isActive ? "text-white font-bold" : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      {feature.title}
                    </h3>

                    {isActive && (
                      <div className="mt-2.5">
                        {/* Pink / Purple Accent Line */}
                        <div className="h-0.5 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full" />
                        <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-400">
                          {feature.description}
                        </p>
                      </div>
                    )}

                    {!isActive && (
                      <div className="mt-4 border-b border-white/10" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Browser Preview Card */}
          <div className="lg:col-span-7">
            <div className="clay-card-gray relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 flex flex-col justify-between min-h-[460px] sm:min-h-[540px]">
              {/* Outer Window Container with Neon Gradient Border */}
              <div className="relative rounded-2xl border border-pink-500/30 bg-[#121215]/90 p-5 sm:p-7 shadow-[0_0_50px_rgba(236,72,153,0.12)]">
                {/* Browser Header Bar */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  {/* Address Pill */}
                  <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1 text-xs font-mono text-slate-400 border border-white/10">
                    <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>orbit.inkbase.app</span>
                  </div>
                  <div className="w-8" />
                </div>

                {/* Central Canvas Diagram */}
                <div className="relative my-10 flex items-center justify-center py-8">
                  {/* Dashed Trajectory Line Background */}
                  <svg className="absolute inset-0 h-full w-full stroke-slate-600/40 pointer-events-none" fill="none">
                    <path d="M 50 100 Q 200 20 400 100 T 750 100" strokeDasharray="6 6" strokeWidth="1.5" />
                  </svg>

                  {/* Connected Nodes */}
                  <div className="relative z-10 flex items-center justify-around w-full max-w-lg">
                    {/* Node 1: Lock */}
                    <div className="clay-node-gray flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full text-slate-300">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>

                    {/* Node 2: Git / Branch */}
                    <div className="clay-node-gray flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-slate-300">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7v8a2 2 0 002 2h6M8 7a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>

                    {/* Center Node: Inkbase Cloud/AI Node with Glowing Halo */}
                    <div className="clay-node-gray relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full text-white border border-pink-500/40 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                      <svg className="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 15a4 4 0 004 4h9a5 5 0 001-9.9M7 15a5 5 0 019.9-1M7 15H6.5" />
                      </svg>
                    </div>

                    {/* Node 4: Key / Security */}
                    <div className="clay-node-gray flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full text-slate-300">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>

                    {/* Node 5: Database */}
                    <div className="clay-node-gray flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-full text-slate-300">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Integration Logos Row */}
              <div className="mt-8 flex items-center justify-around border-t border-white/10 pt-6 opacity-40 grayscale hover:opacity-70 transition-opacity">
                <span className="text-xs font-mono tracking-wider font-semibold text-slate-400">MARKDOWN</span>
                <span className="text-xs font-mono tracking-wider font-semibold text-slate-400">EPUB 3.0</span>
                <span className="text-xs font-mono tracking-wider font-semibold text-slate-400">PDF RENDER</span>
                <span className="text-xs font-mono tracking-wider font-semibold text-slate-400">GIT DIFF</span>
                <span className="text-xs font-mono tracking-wider font-semibold text-slate-400">VS CODE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
