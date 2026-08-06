"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { OnboardingOverlay } from "../components/ui/onboarding";

export default function DashboardPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (router.isReady) {
      if (router.query.onboarding === "true") {
        setShowOnboarding(true);
      }
    }
  }, [router.isReady, router.query]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    // Clean up query param from URL without page reload
    router.replace("/dashboard", undefined, { shallow: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-white">
      {showOnboarding && <OnboardingOverlay onClose={handleCloseOnboarding} />}

      <div className="text-center">
        <h1
          className="text-5xl text-gray-900"
          style={{ fontFamily: "var(--font-lobster), cursive" }}
        >
          Inkbase
        </h1>
        <p className="mt-3 text-sm text-gray-400">Dashboard coming soon</p>
      </div>
    </div>
  );
}
