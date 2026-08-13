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
    <div className="clay-card-green relative flex flex-col justify-between overflow-hidden rounded-[2rem] p-6 sm:p-8">
      <div>
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-emerald-200 clay-pill-green">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {badge}
        </div>
        <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl font-satoshi">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-emerald-100/80 sm:text-base">
          {description}
        </p>
      </div>
      {children && <div className="mt-6 font-mono text-xs">{children}</div>}
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16 pt-4">
      <div className="clay-container-green relative overflow-hidden rounded-[2.5rem] p-8 sm:p-12 lg:p-16 text-emerald-50">
        {/* Ambient subtle glow inside container */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

        {/* Section Header */}
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl font-satoshi leading-[1.15]">
            For writing and beyond
          </h2>
          <p className="mt-4 text-base leading-relaxed text-emerald-100/75 sm:text-lg font-normal">
            Inkbase runs on AI-assisted manuscript analysis — so you can create full-stack stories and books that scale.
          </p>
        </div>

        {/* Main Feature Highlight */}
        <div className="mt-10 rounded-[2rem] clay-card-green p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-emerald-200 clay-pill-green">
                Core Engine
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-white sm:text-3xl font-satoshi">
                Line-by-line feedback, handled
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-emerald-100/80 sm:text-base">
                Inkbase handles prose refinement, syntax polish, and backend manuscript consistency. Your code and story stay yours. Always.
              </p>
            </div>
            <div className="w-full lg:w-72 rounded-xl bg-[#132319]/80 p-4 border border-emerald-500/20 shadow-inner">
              <div className="flex items-center justify-between text-xs text-emerald-300/70 mb-2">
                <span>Chapter 04 • Diff view</span>
                <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[10px] text-emerald-400 font-mono">PASS</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="line-through text-red-300/60 bg-red-950/30 p-1 rounded">The shadow moved across the room quickly.</div>
                <div className="text-emerald-200 bg-emerald-950/50 p-1 rounded border-l-2 border-emerald-400 font-medium">The shadow crept across the floorboards.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Feature Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
