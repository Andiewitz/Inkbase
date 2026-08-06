"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BonjourProps {
  onFinished: () => void;
}

const HELLO = "Hello.";

// Each character fades in individually — staggered, cinematic
const containerVariants: import("framer-motion").Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const charVariants: import("framer-motion").Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: "blur(6px)",
    transition: { duration: 0.5, ease: "easeIn" },
  },
};

export function Bonjour({ onFinished }: BonjourProps) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [mounted, setMounted] = useState(true);

  // After stagger completes (~0.12 * 6 chars + 0.6 letter duration ≈ 1.4s), hold
  useEffect(() => {
    if (phase !== "in") return;
    const t = setTimeout(() => setPhase("hold"), 1600);
    return () => clearTimeout(t);
  }, [phase]);

  // Hold for 2.4 seconds, then exit
  useEffect(() => {
    if (phase !== "hold") return;
    const t = setTimeout(() => setPhase("out"), 2400);
    return () => clearTimeout(t);
  }, [phase]);

  // Exit animation takes ~1s, then unmount and call onFinished
  useEffect(() => {
    if (phase !== "out") return;
    const t = setTimeout(() => {
      setMounted(false);
    }, 900);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!mounted) onFinished();
  }, [mounted, onFinished]);

  return (
    <AnimatePresence>
      {mounted && (
        <motion.div
          key="bonjour-screen"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <motion.h1
            className="flex select-none text-[clamp(4rem,12vw,9rem)] font-bold tracking-tight text-gray-900"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
            variants={containerVariants}
            initial="hidden"
            animate={phase === "out" ? "exit" : "visible"}
          >
            {HELLO.split("").map((char, i) => (
              <motion.span key={i} variants={charVariants}>
                {char}
              </motion.span>
            ))}
          </motion.h1>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
