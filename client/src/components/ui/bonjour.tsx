"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BonjourProps {
  /** Called once the animation fully completes and the screen has dissolved */
  onFinished: () => void;
}

const HELLO_TEXT = "Hello.";

export function Bonjour({ onFinished }: BonjourProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "hold" | "exit">("typing");
  const [visible, setVisible] = useState(true);

  // Phase 1 — type each character at ~90ms
  useEffect(() => {
    if (phase !== "typing") return;
    if (charIndex < HELLO_TEXT.length) {
      const t = setTimeout(() => {
        setDisplayedText((prev) => prev + HELLO_TEXT[charIndex]);
        setCharIndex((i) => i + 1);
      }, 90);
      return () => clearTimeout(t);
    } else {
      // All chars typed → hold briefly then exit
      const t = setTimeout(() => setPhase("hold"), 900);
      return () => clearTimeout(t);
    }
  }, [charIndex, phase]);

  // Phase 2 — hold, then begin exit
  useEffect(() => {
    if (phase !== "hold") return;
    const t = setTimeout(() => setPhase("exit"), 600);
    return () => clearTimeout(t);
  }, [phase]);

  // Phase 3 — exit: Framer motion handles the fade/scale, we fire onFinished
  useEffect(() => {
    if (phase !== "exit") return;
    // Give the exit animation time to complete (800ms) then unmount
    const t = setTimeout(() => {
      setVisible(false);
    }, 800);
    return () => clearTimeout(t);
  }, [phase]);

  // When visibility flips off, fire the parent callback
  useEffect(() => {
    if (!visible) onFinished();
  }, [visible, onFinished]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="bonjour"
          // Entry — instant mount, full opacity
          initial={{ opacity: 1 }}
          // Exit — scale up slightly + fade (Apple's characteristic dissolve)
          animate={phase === "exit" ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black"
        >
          {/* Wordmark */}
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 0.25, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="absolute top-10 text-xs font-semibold uppercase tracking-[0.3em] text-white"
            style={{ fontFamily: "var(--font-lobster), cursive" }}
          >
            Inkbase
          </motion.p>

          {/* The Hello text — fades in word by word via character accumulation */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="select-none text-center text-[clamp(3.5rem,10vw,7.5rem)] font-bold leading-none tracking-tight text-white"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          >
            {displayedText}
            {/* Blinking cursor — hides once typing is done */}
            {phase === "typing" && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                className="ml-1 inline-block h-[0.85em] w-[4px] translate-y-[0.05em] rounded-full bg-white align-middle"
              />
            )}
          </motion.h1>

          {/* Subtitle — fades in once typing is complete */}
          <AnimatePresence>
            {(phase === "hold" || phase === "exit") && (
              <motion.p
                key="subtitle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 0.45, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-5 text-sm font-medium tracking-wide text-white"
              >
                Welcome to your workspace
              </motion.p>
            )}
          </AnimatePresence>

          {/* Bottom progress line (Apple-style thin bar) */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-white/20"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
