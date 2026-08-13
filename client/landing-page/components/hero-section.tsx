"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { AnimatedGroup } from "./animated-group";
import { TextEffect } from "./text-effect";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

export function HeroSection() {
  return (
    <div className="relative flex min-h-[70vh] lg:min-h-[75vh] flex-col overflow-hidden bg-[#FBF8F3] text-slate-900 select-none pb-28 sm:pb-36 lg:pb-44">
      {/* Ambient background */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-amber-200/40 blur-3xl" />

      {/* Nav */}
      <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between bg-[#FBF8F3]/90 px-6 py-5 font-satoshi backdrop-blur-sm lg:px-10">
        <div className="flex items-center gap-8">
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
        </div>
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
      <AnimatedGroup className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-6 px-6 pb-6 pt-28 lg:px-10">
        {/* Copy */}
        <div className="flex w-full flex-col items-center gap-6 text-center">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight text-slate-900 md:text-5xl xl:text-6xl font-satoshi">
            The better way to write your{" "}
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

          <p className="max-w-lg text-sm leading-relaxed text-slate-600 md:text-base">
            Inkbase reviews your manuscript line by line — suggesting edits,
            checking consistency, and helping you ship your{" "}
            <strong className="font-semibold text-indigo-900">best story</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Start writing free</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/auth/login">See how it works</Link>
            </Button>
          </div>
        </div>
      </AnimatedGroup>
    </div>
  );
}
