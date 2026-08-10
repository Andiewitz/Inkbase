"use client";

import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  Megaphone,
  PenTool,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { AnimatedGroup } from "./animated-group";
import { TextEffect } from "./text-effect";
import { ManuscriptPreview } from "./manuscript-preview";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

const PERSONAS = [
  { label: "Novelist", icon: PenTool },
  { label: "Screenwriter", icon: BookOpen },
  { label: "Freelancer", icon: Megaphone },
  { label: "Academic", icon: GraduationCap },
  { label: "Content", icon: TrendingUp },
];

export function HeroSection() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#FBF8F3] text-slate-900 select-none">
      {/* Ambient background */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 lg:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/auth/signup">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <AnimatedGroup className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-12 px-6 py-14 lg:flex-row lg:px-10">
        {/* Copy */}
        <div className="flex flex-1 flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-purple-700 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 fill-purple-200 text-purple-600" />
            PR reviews, but for writing
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-5xl xl:text-6xl">
            Line-by-line AI reviews for your{" "}
            <span className="relative inline-block text-indigo-700">
              <TextEffect words={["manuscript", "novel", "screenplay", "memoir"]} />
              <svg
                className="absolute -bottom-1 left-0 w-full text-indigo-400 opacity-80"
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
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-slate-600 md:text-base">
            Inkbase reviews your manuscript line by line — suggesting edits,
            checking consistency, and helping you ship your{" "}
            <strong className="font-semibold text-indigo-900">best story</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Start writing free</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/auth/login">See how it works</Link>
            </Button>
          </div>

          {/* Personas */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            {PERSONAS.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-sm"
              >
                <Icon className="h-3 w-3 text-indigo-600" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Product visual */}
        <div className="flex flex-1 justify-center">
          <ManuscriptPreview />
        </div>
      </AnimatedGroup>
    </div>
  );
}
