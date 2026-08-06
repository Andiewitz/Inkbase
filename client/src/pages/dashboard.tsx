"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { OnboardingOverlay } from "../components/ui/onboarding";

export default function DashboardPage() {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchHasOnboarding = window.location.search.includes("onboarding=true");
      const storageHasOnboarding = sessionStorage.getItem("inkbase_show_onboarding") === "true";
      const routerHasOnboarding = router.query.onboarding === "true";

      if (searchHasOnboarding || storageHasOnboarding || routerHasOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [router.isReady, router.query]);

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("inkbase_show_onboarding");
    }
    router.replace("/dashboard", undefined, { shallow: true });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50">
      {showOnboarding && <OnboardingOverlay onClose={handleCloseOnboarding} />}

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
