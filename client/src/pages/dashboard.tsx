"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { Bonjour } from "../components/ui/bonjour";
import { OnboardingOverlay } from "../components/ui/onboarding";

type Screen = "bonjour" | "onboarding" | "dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(() => {
    // Synchronous read before first paint — eliminates the flash-of-dashboard.
    // typeof window guard keeps SSR safe.
    if (typeof window === "undefined") return "dashboard";
    if (
      window.location.search.includes("onboarding=true") ||
      sessionStorage.getItem("inkbase_show_onboarding") === "true"
    ) {
      return "bonjour";
    }
    return "dashboard";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasOnboarding =
      window.location.search.includes("onboarding=true") ||
      sessionStorage.getItem("inkbase_show_onboarding") === "true" ||
      router.query.onboarding === "true";

    if (hasOnboarding) setScreen("bonjour");
  }, [router.isReady, router.query]);

  const handleBonjourFinished = () => setScreen("onboarding");

  const handleOnboardingClose = () => {
    setScreen("dashboard");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("inkbase_show_onboarding");
    }
    router.replace("/dashboard", undefined, { shallow: true });
  };

  const isOverlayActive = screen === "bonjour" || screen === "onboarding";

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* ── Dashboard content — always rendered, blurs when overlay is active ── */}
      <motion.div
        className="flex min-h-screen items-center justify-center"
        animate={{
          filter: isOverlayActive ? "blur(6px)" : "blur(0px)",
          scale: isOverlayActive ? 0.98 : 1,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <div className="text-center">
          <h1
            className="text-5xl font-bold tracking-tight text-gray-900"
            style={{ fontFamily: "var(--font-lobster), cursive" }}
          >
            Inkbase
          </h1>
          <p className="mt-3 text-sm text-gray-500">Welcome to your dashboard</p>
        </div>
      </motion.div>

      {/* ── Bonjour — full screen, sits above everything ── */}
      <AnimatePresence>{screen === "bonjour" && <Bonjour onFinished={handleBonjourFinished} />}</AnimatePresence>

      {/* ── Onboarding overlay — appears after Bonjour dissolves ── */}
      <AnimatePresence>
        {screen === "onboarding" && <OnboardingOverlay onClose={handleOnboardingClose} />}
      </AnimatePresence>
    </div>
  );
}
