"use client";

import { useState } from "react";

interface OnboardingProps {
  onClose: () => void;
}

export function OnboardingOverlay({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [role, setRole] = useState("Developer");
  const [useCase, setUseCase] = useState("Prototyping");

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 backdrop-blur-md p-4 transition-all duration-300">
      {/* Floating Card Stack Container */}
      <div className="relative w-full max-w-xl">
        {/* Background Stacked Card Accent (Depth Layer) */}
        <div className="absolute -top-3 left-6 right-6 h-full rounded-3xl bg-gray-800/40 blur-sm scale-95 transform transition-all duration-300" />
        <div className="absolute -top-1.5 left-3 right-3 h-full rounded-3xl bg-gray-900/60 blur-xs scale-98 transform transition-all duration-300" />

        {/* Primary Interactive Floating Card */}
        <div className="relative rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-black/5 border border-gray-100 overflow-hidden">
          {/* Subtle Top Glow Accent */}
          <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

          {/* Floating Card Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-5">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white font-bold shadow-md">
                ⚡
              </div>
              <div>
                <h3
                  className="text-2xl font-bold tracking-tight text-gray-900"
                  style={{ fontFamily: "var(--font-lobster), cursive" }}
                >
                  Inkbase Setup
                </h3>
                <p className="text-xs text-gray-400 font-medium">Account Setup & Configuration</p>
              </div>
            </div>

            {/* Step Pills */}
            <div className="flex items-center space-x-1.5 rounded-full bg-gray-100 p-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    s === step
                      ? "w-7 bg-gray-900"
                      : s < step
                      ? "w-2.5 bg-gray-400"
                      : "w-2.5 bg-gray-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Dynamic Step Content */}
          <div className="py-6">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                  Step 1 of 3 — Workspace
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Name your primary workspace
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your workspace is where your architecture diagrams, design canvases, and team components live.
                </p>

                <div className="pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Meshwork Studio"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 ring-1 ring-inset ring-purple-700/10">
                  Step 2 of 3 — Role
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  What is your primary role?
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Select your core discipline to customize your tool presets.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    { title: "Software Engineer", desc: "API & backend systems" },
                    { title: "UI/UX Designer", desc: "Interface design & systems" },
                    { title: "System Architect", desc: "Microservices & infrastructure" },
                    { title: "Product Manager", desc: "User journeys & specs" },
                  ].map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => setRole(item.title)}
                      className={`group flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                        role === item.title
                          ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                          : "border-gray-200 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50/80"
                      }`}
                    >
                      <span className="text-sm font-semibold">{item.title}</span>
                      <span
                        className={`text-xs mt-1 transition ${
                          role === item.title ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
                  Step 3 of 3 — Goal
                </div>
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                  What are you building first?
                </h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  We will pre-load your workspace with relevant starter canvases.
                </p>

                <div className="space-y-2.5 pt-2">
                  {[
                    { id: "Prototyping", label: "Interactive Web Application", badge: "Popular" },
                    { id: "Microservices", label: "Decoupled Microservice Architecture", badge: "Advanced" },
                    { id: "DesignSystem", label: "Component Library & Design System", badge: "UI/UX" },
                  ].map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      onClick={() => setUseCase(target.id)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-200 ${
                        useCase === target.id
                          ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-900">{target.label}</span>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {target.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating Card Actions Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition"
            >
              Skip onboarding
            </button>

            <div className="flex items-center space-x-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-gray-800 active:scale-95 transition"
              >
                {step === 3 ? "Launch Workspace 🚀" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
