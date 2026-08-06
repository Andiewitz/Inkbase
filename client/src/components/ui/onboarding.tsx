"use client";

import { useState } from "react";

interface OnboardingProps {
  onClose: () => void;
}

export function OnboardingOverlay({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [role, setRole] = useState("Developer");

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <span
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "var(--font-lobster), cursive" }}
          >
            Inkbase Setup
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Step {step} of 2
          </span>
        </div>

        {/* Content Body */}
        {step === 1 ? (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Welcome to Inkbase! 🎉
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Let&apos;s set up your primary workspace. You can invite team members and create projects here.
            </p>
            <div className="pt-2">
              <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Workspace Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Studio"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition"
              />
            </div>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">
              What is your main role?
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              This helps us tailor your canvas tools and recommendations.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {["Developer", "Designer", "Product Manager", "Architect"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRole(item)}
                  className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                    role === item
                      ? "border-black bg-gray-50 ring-1 ring-black"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900">{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-gray-400 hover:text-gray-600 transition"
          >
            Skip for now
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition active:scale-95"
          >
            {step === 2 ? "Complete Setup" : "Continue →"}
          </button>
        </div>
      </div>
    </div>
  );
}
