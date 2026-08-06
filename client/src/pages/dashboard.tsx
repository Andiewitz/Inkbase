"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Bonjour } from "../components/ui/bonjour";
import { OnboardingOverlay } from "../components/ui/onboarding";

type Screen = "bonjour" | "onboarding" | "dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("dashboard");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchHasOnboarding = window.location.search.includes("onboarding=true");
    const storageHasOnboarding =
      sessionStorage.getItem("inkbase_show_onboarding") === "true";
    const routerHasOnboarding = router.query.onboarding === "true";

    if (searchHasOnboarding || storageHasOnboarding || routerHasOnboarding) {
      // New registration → Bonjour first, then Onboarding overlay
      setScreen("bonjour");
    }
  }, [router.isReady, router.query]);

  const handleBonjourFinished = () => {
    setScreen("onboarding");
  };

  const handleOnboardingClose = () => {
    setScreen("dashboard");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("inkbase_show_onboarding");
    }
    router.replace("/dashboard", undefined, { shallow: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50">
      {/* Full-screen Bonjour splash — only on new account registration */}
      {screen === "bonjour" && (
        <Bonjour onFinished={handleBonjourFinished} />
      )}

      {/* Onboarding overlay — shown after Bonjour dissolves */}
      {screen === "onboarding" && (
        <OnboardingOverlay onClose={handleOnboardingClose} />
      )}

      {/* Dashboard content — visible behind Bonjour/Onboarding or standalone */}
      <div className="text-center">
        <h1
          className="text-5xl text-gray-900"
          style={{ fontFamily: "var(--font-lobster), cursive" }}
        >
          Inkbase
        </h1>
        <p className="mt-3 text-sm text-gray-500">Welcome to your dashboard</p>
      </div>
    </div>
  );
}
