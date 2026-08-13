"use client";

import React from "react";

interface FeatureCardProps {
  title: string;
  badge: string;
  description: string;
  children?: React.ReactNode;
}

function FeatureCard({ title, badge, description, children }: FeatureCardProps) {
  return (
    <div className="clay-card-green relative flex flex-col justify-between overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide text-emerald-200 clay-pill-green">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {badge}
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl lg:text-3xl font-satoshi">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-emerald-100/80 sm:text-base lg:text-lg">
          {description}
        </p>
      </div>
      {children && <div className="mt-6 font-mono text-xs">{children}</div>}
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="mx-auto w-full max-w-[99vw] px-2 sm:px-3 lg:px-4 pb-16 pt-2">
      <div className="clay-container-green relative overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-14 lg:p-20 text-emerald-50">
        {/* Ambient subtle glow inside container */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

        {/* Section Header */}
        <div className="max-w-3xl">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl font-satoshi leading-[1.1]">
            For writing and beyond
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-emerald-100/75 sm:text-xl lg:text-2xl font-normal max-w-2xl">
            Inkbase runs on AI-assisted manuscript analysis — so you can create full-stack stories and books that scale.
          </p>
        </div>

        {/* Main Feature Highlight */}
        <div className="mt-12 rounded-[2.5rem] clay-card-green p-8 sm:p-10 lg:p-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold text-emerald-200 clay-pill-green">
                Core Engine
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl font-satoshi">
                Line-by-line feedback, handled
              </h3>
              <p className="mt-4 text-base leading-relaxed text-emerald-100/80 sm:text-lg lg:text-xl">
                Inkbase handles prose refinement, syntax polish, and backend manuscript consistency. Your code and story stay yours. Always.
              </p>
            </div>
            <div className="w-full lg:w-96 rounded-2xl bg-[#132319]/90 p-6 border border-emerald-500/20 shadow-inner shrink-0">
              <div className="flex items-center justify-between text-xs text-emerald-300/70 mb-3">
                <span className="font-mono text-emerald-300">Chapter 04 • Diff view</span>
                <span className="rounded-md bg-emerald-950/80 px-2 py-0.5 text-[11px] text-emerald-400 font-mono border border-emerald-500/30">PASS</span>
              </div>
              <div className="space-y-2 text-xs sm:text-sm font-sans">
                <div className="line-through text-red-300/60 bg-red-950/30 p-2 rounded-lg">The shadow moved across the room quickly.</div>
                <div className="text-emerald-200 bg-emerald-950/50 p-2 rounded-lg border-l-2 border-emerald-400 font-medium">The shadow crept across the floorboards.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Feature Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            badge="Consistency"
            title="World-building, synced"
            description="Tracks character names, plot timelines, and location details automatically across 100k+ words."
          />

          <FeatureCard
            badge="Version Control"
            title="Visual PR Diffs"
            description="Review suggested edits line-by-line with visual diffs. Accept or reject changes with one click."
          />

          <FeatureCard
            badge="Privacy"
            title="Manuscript Security"
            description="End-to-end encrypted storage. Your creative work is never used to train public LLM models."
          />
        </div>
      </div>
    </section>
  );
}
