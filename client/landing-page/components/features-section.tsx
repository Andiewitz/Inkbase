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
    <div className="clay-card-green relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 sm:p-6">
      <div>
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-wide text-emerald-200 clay-pill-green">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {badge}
        </div>
        <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg font-satoshi">
          {title}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-emerald-100/70 sm:text-sm">
          {description}
        </p>
      </div>
      {children && <div className="mt-4 font-mono text-xs">{children}</div>}
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section className="relative z-10 mx-auto w-full max-w-[99vw] px-2 sm:px-3 lg:px-4 -mt-24 sm:-mt-32 md:-mt-36 lg:-mt-40 pb-16">
      <div className="clay-container-green relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 lg:p-12 text-emerald-50">
        {/* Ambient subtle glow inside container */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

        {/* Section Header */}
        <div className="max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl font-satoshi leading-tight">
            For writing and beyond
          </h2>
          <p className="mt-2.5 text-xs sm:text-sm lg:text-base leading-relaxed text-emerald-100/70 font-normal">
            Inkbase runs on enterprise-grade manuscript analysis — so you can create full-stack books that scale.
          </p>
        </div>

        {/* Main Feature Highlight */}
        <div className="mt-8 rounded-2xl clay-card-green p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-xl">
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-emerald-200 clay-pill-green">
                Core Engine
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl font-satoshi">
                Hosting, handled
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-emerald-100/75 sm:text-sm">
                Inkbase handles hosting, SSL, and manuscript infrastructure. Your code and story data stay yours. Always.
              </p>
            </div>
            <div className="w-full lg:w-80 rounded-xl bg-[#132319]/90 p-4 border border-emerald-500/20 shadow-inner shrink-0">
              <div className="flex items-center justify-between text-[11px] text-emerald-300/70 mb-2">
                <span className="font-mono text-emerald-300">Chapter 04 • Diff view</span>
                <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[10px] text-emerald-400 font-mono border border-emerald-500/30">PASS</span>
              </div>
              <div className="space-y-1.5 text-xs font-sans">
                <div className="line-through text-red-300/60 bg-red-950/30 p-1.5 rounded">The shadow moved across the room quickly.</div>
                <div className="text-emerald-200 bg-emerald-950/50 p-1.5 rounded border-l-2 border-emerald-400 font-medium">The shadow crept across the floorboards.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Feature Grid */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
