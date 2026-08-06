"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface OnboardingProps {
  onClose: () => void;
}

const STEPS = [
  {
    badge: "Step 1 of 3 — Workspace",
    badgeColor: "bg-blue-50 text-blue-700 ring-blue-700/10",
    title: "Name your primary workspace",
    description:
      "Your workspace is where your architecture diagrams, design canvases, and team components live.",
  },
  {
    badge: "Step 2 of 3 — Role",
    badgeColor: "bg-purple-50 text-purple-700 ring-purple-700/10",
    title: "What is your primary role?",
    description: "Select your core discipline to customize your tool presets.",
  },
  {
    badge: "Step 3 of 3 — Goal",
    badgeColor: "bg-emerald-50 text-emerald-700 ring-emerald-700/10",
    title: "What are you building first?",
    description:
      "We will pre-load your workspace with relevant starter canvases.",
  },
];

const ROLES = [
  { title: "Software Engineer", desc: "API & backend systems" },
  { title: "UI/UX Designer", desc: "Interface design & systems" },
  { title: "System Architect", desc: "Microservices & infrastructure" },
  { title: "Product Manager", desc: "User journeys & specs" },
];

const GOALS = [
  { id: "Prototyping", label: "Interactive Web Application", badge: "Popular" },
  { id: "Microservices", label: "Decoupled Microservice Architecture", badge: "Advanced" },
  { id: "DesignSystem", label: "Component Library & Design System", badge: "UI/UX" },
];

export function OnboardingOverlay({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [workspaceName, setWorkspaceName] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [useCase, setUseCase] = useState("Prototyping");

  const goNext = () => {
    if (step < 3) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      onClose();
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const stepData = STEPS[step - 1];

  return (
    // Backdrop — animate in/out
    <motion.div
      key="backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Card — springs up from slightly below */}
      <motion.div
        className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-gray-100 px-8 py-6">
          <div>
            <h3
              className="text-xl font-bold tracking-tight text-gray-900"
              style={{ fontFamily: "var(--font-lobster), cursive" }}
            >
              Inkbase Setup
            </h3>
            <p className="text-xs text-gray-400">Account configuration</p>
          </div>

          {/* Step pills */}
          <div className="flex items-center gap-1.5 rounded-full bg-gray-100 p-1">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                className="h-2 rounded-full bg-gray-900"
                animate={{
                  width: s === step ? 28 : 8,
                  opacity: s <= step ? 1 : 0.2,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
            ))}
          </div>
        </div>

        {/* ── Step content — slides laterally ── */}
        <div className="relative overflow-hidden px-8 py-7" style={{ minHeight: 280 }}>
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={{
                enter: (d: number) => ({
                  x: d > 0 ? 40 : -40,
                  opacity: 0,
                  filter: "blur(4px)",
                }),
                center: {
                  x: 0,
                  opacity: 1,
                  filter: "blur(0px)",
                },
                exit: (d: number) => ({
                  x: d > 0 ? -40 : 40,
                  opacity: 0,
                  filter: "blur(4px)",
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              {/* Badge */}
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${stepData.badgeColor}`}
              >
                {stepData.badge}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {stepData.title}
              </h2>
              <p className="text-sm leading-relaxed text-gray-500">
                {stepData.description}
              </p>

              {/* Step-specific inputs */}
              {step === 1 && (
                <div className="pt-1">
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Meshwork Studio"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900"
                  />
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {ROLES.map((item) => (
                    <motion.button
                      key={item.title}
                      type="button"
                      onClick={() => setRole(item.title)}
                      whileTap={{ scale: 0.97 }}
                      className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                        role === item.title
                          ? "border-gray-900 bg-gray-900 text-white shadow-lg"
                          : "border-gray-200 bg-white text-gray-900 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-sm font-semibold">{item.title}</span>
                      <span
                        className={`mt-1 text-xs transition ${
                          role === item.title ? "text-gray-300" : "text-gray-500"
                        }`}
                      >
                        {item.desc}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-2.5 pt-1">
                  {GOALS.map((target) => (
                    <motion.button
                      key={target.id}
                      type="button"
                      onClick={() => setUseCase(target.id)}
                      whileTap={{ scale: 0.99 }}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-200 ${
                        useCase === target.id
                          ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {target.label}
                      </span>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {target.badge}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-gray-100 px-8 py-5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-gray-400 transition hover:text-gray-600"
          >
            Skip onboarding
          </button>

          <div className="flex items-center gap-3">
            <AnimatePresence>
              {step > 1 && (
                <motion.button
                  type="button"
                  onClick={goBack}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Back
                </motion.button>
              )}
            </AnimatePresence>

            <motion.button
              type="button"
              onClick={goNext}
              whileTap={{ scale: 0.96 }}
              className="rounded-xl bg-gray-900 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-gray-800"
            >
              {step === 3 ? "Launch Workspace 🚀" : "Continue"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
