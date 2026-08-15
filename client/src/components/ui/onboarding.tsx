"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, PenLine, Pencil } from "lucide-react";

interface OnboardingProps {
  onClose: () => void;
}

const STEPS = [
  { id: "workspace", label: "Workspace" },
  { id: "name",      label: "You"       },
  { id: "role",      label: "Role"      },
  { id: "goal",      label: "Goal"      },
  { id: "source",    label: "Source"    },
];

const TOTAL = STEPS.length;

const OCCUPATIONS = [
  { id: "novelist",     label: "Novelist / Fiction",      icon: "✍️" },
  { id: "freelance",    label: "Freelance writer",        icon: "💼" },
  { id: "screenwriter", label: "Screenwriter",            icon: "🎬" },
  { id: "academic",     label: "Academic / Researcher",   icon: "🎓" },
  { id: "content",      label: "Content creator",         icon: "📣" },
  { id: "other",        label: "Something else",          icon: "✨" },
];

const USE_CASES = [
  { id: "exploring", label: "Just exploring",         desc: "Seeing what Inkbase can do"        },
  { id: "creative",  label: "Personal projects",      desc: "Fiction, poetry, passion work"     },
  { id: "freelance", label: "Freelance writing",      desc: "Client work, articles, copy"       },
  { id: "longform",  label: "A book or long project", desc: "Novel, memoir, thesis"             },
  { id: "team",      label: "Team collaboration",     desc: "Co-authoring or working with editors" },
  { id: "other",     label: "Something else",         desc: "Tell us later"                    },
];

const DISCOVERY = [
  { id: "twitter",    label: "Twitter / X"       },
  { id: "reddit",     label: "Reddit"            },
  { id: "friend",     label: "Word of mouth"     },
  { id: "search",     label: "Google or search"  },
  { id: "newsletter", label: "A newsletter"      },
  { id: "other",      label: "Somewhere else"    },
];

// Step-level copy
const COPY: Record<string, { title: string; subtitle: string; placeholder?: string }> = {
  workspace: {
    title: "Name your writing space",
    subtitle: "This is where your manuscripts and chapters live. You can rename it anytime.",
    placeholder: "e.g. My Novel, The Memoir Project…",
  },
  name: {
    title: "What should we call you?",
    subtitle: "Just your first name. We'll use it to make things feel a bit more personal.",
    placeholder: "e.g. Alex",
  },
  role: {
    title: "How do you write?",
    subtitle: "Pick the one that fits best — this shapes your default experience.",
  },
  goal: {
    title: "What brings you here?",
    subtitle: "No pressure. Even just exploring is a perfectly good answer.",
  },
  source: {
    title: "Where did you hear about us?",
    subtitle: "Purely out of curiosity — helps us understand how people find Inkbase.",
  },
};

export function OnboardingOverlay({ onClose }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [workspaceName, setWorkspaceName] = useState("");
  const [name, setName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [useCase, setUseCase] = useState("");
  const [discovery, setDiscovery] = useState("");

  const goNext = () => {
    if (step < TOTAL) { setDirection(1);  setStep((s) => s + 1); }
    else { onClose(); }
  };
  const goBack = () => {
    if (step > 1) { setDirection(-1); setStep((s) => s - 1); }
  };

  const canContinue = () => {
    if (step === 1) return workspaceName.trim().length > 0;
    if (step === 2) return name.trim().length > 0;
    if (step === 3) return occupation !== "";
    if (step === 4) return useCase !== "";
    if (step === 5) return discovery !== "";
    return false;
  };

  const stepId = STEPS[step - 1].id;
  const copy   = COPY[stepId];

  // Compact pill/chip button matching Studio Cyan aesthetic
  const chipClass = (active: boolean) =>
    `flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition-all duration-150 cursor-pointer ${
      active
        ? "border-[#2C7E86] bg-[#E5F5F8] text-[#2C7E86] shadow-xs"
        : "border-slate-200/80 bg-white text-slate-700 hover:border-[#A2D9E2] hover:bg-[#EAF6F8]"
    }`;

  return (
    <motion.div
      key="backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Studio Canvas Floating Modal Card */}
      <motion.div
        className="w-[640px] rounded-[32px] bg-[#F6FBFC] border border-white/90 shadow-[0_24px_70px_-15px_rgba(50,95,140,0.25)] flex flex-col overflow-hidden"
        style={{ height: 560 }}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-8 pt-6 pb-0 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-2xs border border-white shrink-0 text-[#2C7E86]">
              <PenLine className="h-4 w-4" />
            </div>
            <span
              className="text-lg font-normal text-slate-850"
              style={{ fontFamily: "var(--font-lobster), cursive" }}
            >
              Inkbase
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Skip setup
          </button>
        </div>

        {/* ── Checkpoint progress ── */}
        <div className="px-8 pt-5 pb-0 shrink-0">
          <div className="flex items-start">
            {STEPS.map((s, i) => {
              const num = i + 1;
              const isDone = num < step;
              const isCurrent = num === step;
              return (
                <div key={s.id} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? "1" : "none" }}>
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <motion.div
                      animate={{
                        backgroundColor: isDone || isCurrent ? "#2C7E86" : "#E2EEF2",
                        scale: isCurrent ? 1.1 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                      className="h-6 w-6 rounded-full flex items-center justify-center shadow-2xs"
                    >
                      {isDone ? (
                        <Check className="h-3 w-3 text-white" />
                      ) : (
                        <span className={`text-[11px] font-bold ${isCurrent ? "text-white" : "text-slate-400"}`}>
                          {num}
                        </span>
                      )}
                    </motion.div>
                    <span className={`text-[10px] font-semibold ${isCurrent ? "text-[#2C7E86]" : isDone ? "text-teal-700" : "text-slate-400"}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 mx-2 h-[2px] rounded-full bg-[#E2EEF2] overflow-hidden mb-4 shrink-0">
                      <motion.div
                        animate={{ width: isDone ? "100%" : "0%" }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="h-full bg-[#2C7E86] rounded-full"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="mx-8 mt-4 mb-0 border-t border-slate-200/70 shrink-0" />

        {/* ── Step content — fixed flex-1, overflow hidden, never scrolls ── */}
        <div className="flex-1 overflow-hidden px-8 py-5 relative">
          <AnimatePresence mode="popLayout" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={{
                enter:  (d: number) => ({ x: d > 0 ? 30 : -30, opacity: 0, filter: "blur(3px)" }),
                center: { x: 0, opacity: 1, filter: "blur(0px)" },
                exit:   (d: number) => ({ x: d > 0 ? -30 : 30, opacity: 0, filter: "blur(3px)" }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="h-full flex flex-col gap-4"
            >
              {/* Heading */}
              <div className="shrink-0">
                <p className="text-[11px] font-bold text-[#2C7E86] uppercase tracking-widest mb-1">
                  Step {step} of {TOTAL}
                </p>
                <h2 className="text-xl font-bold tracking-tight text-slate-850">{copy.title}</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">{copy.subtitle}</p>
              </div>

              {/* Inputs / selections */}
              <div className="flex-1">
                {/* Step 1 — workspace */}
                {step === 1 && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder={copy.placeholder}
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && canContinue() && goNext()}
                      autoFocus
                      className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2C7E86] focus:outline-none focus:ring-2 focus:ring-[#2C7E86]/20 transition shadow-2xs"
                    />
                    <p className="text-xs text-slate-400 pl-1">
                      Think of it as your writing room. You can create more workspaces later.
                    </p>
                  </div>
                )}

                {/* Step 2 — name */}
                {step === 2 && (
                  <input
                    type="text"
                    placeholder={copy.placeholder}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && canContinue() && goNext()}
                    autoFocus
                    className="w-full rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2C7E86] focus:outline-none focus:ring-2 focus:ring-[#2C7E86]/20 transition shadow-2xs"
                  />
                )}

                {/* Step 3 — role (2×3 grid, all same height) */}
                {step === 3 && (
                  <div className="grid grid-cols-2 gap-2">
                    {OCCUPATIONS.map((item) => {
                      const active = occupation === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          onClick={() => setOccupation(item.id)}
                          whileTap={{ scale: 0.97 }}
                          className={chipClass(active)}
                        >
                          <span className="text-base leading-none shrink-0">{item.icon}</span>
                          <span className="flex-1">{item.label}</span>
                          {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#2C7E86]" />}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Step 4 — goal (2×3 grid, same chip layout for consistency) */}
                {step === 4 && (
                  <div className="grid grid-cols-2 gap-2">
                    {USE_CASES.map((item) => {
                      const active = useCase === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          onClick={() => setUseCase(item.id)}
                          whileTap={{ scale: 0.97 }}
                          className={chipClass(active)}
                        >
                          <span className="flex-1 flex flex-col">
                            <span>{item.label}</span>
                            <span className={`text-[11px] font-normal mt-0.5 ${active ? "text-teal-700" : "text-slate-400"}`}>
                              {item.desc}
                            </span>
                          </span>
                          {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#2C7E86]" />}
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Step 5 — source (2×3 grid) */}
                {step === 5 && (
                  <div className="grid grid-cols-2 gap-2">
                    {DISCOVERY.map((item) => {
                      const active = discovery === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          type="button"
                          onClick={() => setDiscovery(item.id)}
                          whileTap={{ scale: 0.97 }}
                          className={chipClass(active)}
                        >
                          <span className="flex-1">{item.label}</span>
                          {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#2C7E86]" />}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-slate-200/70 bg-slate-50/50 rounded-b-[32px] px-8 py-4 shrink-0">
          <div>
            <AnimatePresence>
              {step > 1 && (
                <motion.button
                  type="button"
                  onClick={goBack}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-[#EAF6F8] hover:text-[#2C7E86] transition cursor-pointer"
                >
                  Back
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            type="button"
            onClick={goNext}
            disabled={!canContinue()}
            whileTap={{ scale: canContinue() ? 0.97 : 1 }}
            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
              canContinue()
                ? "bg-[#2C7E86] hover:bg-[#22676E] text-white shadow-xs hover:shadow-md"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            {step === TOTAL ? (
              <>
                <Pencil className="h-3.5 w-3.5" />
                <span>Start writing</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
