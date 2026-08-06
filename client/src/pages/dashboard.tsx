"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  DocumentIcon,
  DocumentTextIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { GitBranchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DOCUMENTS,
  FREE_TIER_MAX,
} from "../components/documents/data";
import { DocumentCard } from "../components/documents/document-card";
import { NewDocumentCard } from "../components/documents/new-document-card";
import type { DocumentItem } from "../components/documents/types";
import { Bonjour } from "../components/ui/bonjour";
import { OnboardingOverlay } from "../components/ui/onboarding";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "bonjour" | "onboarding" | "dashboard";

const MOCK_WORKSPACE = { name: "My Workspace", plan: "Free Tier" };

// ─── Sidebar Component ────────────────────────────────────────────────────────

function Sidebar({
  workspace,
  documents,
  activeId,
  onSelect,
}: {
  workspace: typeof MOCK_WORKSPACE;
  documents: DocumentItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("inkbase_sidebar_collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem("inkbase_sidebar_collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-gray-200 bg-white py-4 select-none transition-[width] duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-16 px-2" : "w-60 px-3",
      )}
    >
      {/* Workspace Branding */}
      <div
        className={cn(
          "flex items-center pb-4 border-b border-gray-100",
          collapsed ? "justify-center" : "gap-2.5 px-2",
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-sm font-bold text-white">
          I
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900">Inkbase</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {workspace.name}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4 space-y-1">
        {[
          { label: "Recent Documents", icon: DocumentTextIcon, active: true },
          { label: "Branch Reviews", icon: GitBranchIcon, active: false },
          { label: "Trash", icon: TrashIcon, active: false },
        ].map((item) => (
          <button
            key={item.label}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
              collapsed && "justify-center px-2",
              item.active
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Document List in Sidebar */}
      <div className="mt-6">
        {!collapsed && (
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Manuscripts
            </span>
            <span className="text-[10px] font-medium text-gray-400">
              {documents.length}/{FREE_TIER_MAX}
            </span>
          </div>
        )}
        <div className="space-y-0.5">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              title={collapsed ? doc.title : undefined}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition",
                collapsed && "justify-center px-2",
                activeId === doc.id
                  ? "bg-gray-100 font-semibold text-gray-900"
                  : "text-gray-600 hover:bg-gray-50",
              )}
            >
              <DocumentIcon className="h-4 w-4 shrink-0 text-blue-500" />
              {!collapsed && <span className="truncate text-left">{doc.title}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Free Tier Storage Limit Indicator */}
      <div className="mt-auto border-t border-gray-100 pt-4 px-2">
        {!collapsed && (
          <div className="rounded-xl bg-gray-50 p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-700">Free Tier</span>
              <span className="text-[10px] text-gray-500">
                {documents.length}/{FREE_TIER_MAX} Docs
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${(documents.length / FREE_TIER_MAX) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div
          className={cn(
            "mt-4 flex items-center gap-2.5 pt-2",
            collapsed && "justify-center",
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
            D
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-800">
                devwork@mesh.com
              </p>
            </div>
          )}
        </div>

        {/* Collapse Toggle */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="mt-2 flex w-full items-center justify-center rounded-lg py-2 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
        >
          {collapsed ? (
            <ChevronDoubleRightIcon className="h-4 w-4" />
          ) : (
            <ChevronDoubleLeftIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}

// ─── Main Google Docs Style Dashboard View ────────────────────────────────────

function DashboardMain({ documents }: { documents: DocumentItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const atLimit = documents.length >= FREE_TIER_MAX;

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-100/60">
      <Sidebar
        workspace={MOCK_WORKSPACE}
        documents={documents}
        activeId={activeId}
        onSelect={setActiveId}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header Bar (Google Docs Style) */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-3">
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 w-full max-w-xl rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 focus-within:bg-white focus-within:shadow-md focus-within:ring-1 focus-within:ring-gray-300 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400 shrink-0">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search manuscripts and review branches"
              className="w-full bg-transparent outline-none placeholder-gray-400 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition">
              Upgrade Plan
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto py-6 px-8 space-y-8">
          {/* Section 1: Start a new document (Google Docs Style Template Row) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Start a new document
              </h3>
              <span className="text-xs font-medium text-gray-500 hover:text-gray-700 cursor-pointer">
                Template gallery ↕
              </span>
            </div>

            <div className="grid grid-cols-5 gap-4">
              <NewDocumentCard
                title="Blank Document"
                onClick={() => {}}
                disabled={atLimit}
              />
              <NewDocumentCard
                title="Standard Manuscript"
                subtitle="Book / Long-form"
                onClick={() => {}}
                disabled={atLimit}
              />
              <NewDocumentCard
                title="Screenplay"
                subtitle="Script Format"
                onClick={() => {}}
                disabled={atLimit}
              />
              <NewDocumentCard
                title="Stage Play"
                subtitle="Theatre Format"
                onClick={() => {}}
                disabled={atLimit}
              />
              <NewDocumentCard
                title="Academic Paper"
                subtitle="APA / MLA"
                onClick={() => {}}
                disabled={atLimit}
              />
            </div>
          </div>

          {/* Section 2: Recent documents (Cards ONLY with Text Preview) */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Recent documents
              </h3>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Owned by anyone ▾</span>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                  <button className="p-1 rounded bg-gray-100 text-gray-800">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z" />
                    </svg>
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100 text-gray-500">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M2 4h12M2 8h12M2 12h12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Document Cards Grid ONLY */}
            <div className="grid grid-cols-4 gap-5">
              {documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onClick={() => setActiveId(doc.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Dashboard Page Wrapper ───────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [screen, setScreen] = useState<Screen>("dashboard");

  useLayoutEffect(() => {
    const hasOnboarding =
      window.location.search.includes("onboarding=true") ||
      sessionStorage.getItem("inkbase_show_onboarding") === "true";
    if (hasOnboarding) setScreen("bonjour");
    setIsMounted(true);
  }, []);

  const handleBonjourFinished = () => setScreen("onboarding");

  const handleOnboardingClose = () => {
    setScreen("dashboard");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("inkbase_show_onboarding");
    }
    router.replace("/dashboard", undefined, { shallow: true });
  };

  const isOverlayActive = screen === "bonjour" || screen === "onboarding";

  if (!isMounted) {
    return <div className="fixed inset-0 bg-white" />;
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-white">
      {/* Dashboard — always rendered, blurred behind overlays */}
      <motion.div
        className="flex h-full w-full"
        animate={{
          filter: isOverlayActive ? "blur(5px)" : "blur(0px)",
          scale: isOverlayActive ? 0.985 : 1,
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        <DashboardMain documents={DOCUMENTS} />
      </motion.div>

      {/* Bonjour splash */}
      <AnimatePresence>
        {screen === "bonjour" && <Bonjour onFinished={handleBonjourFinished} />}
      </AnimatePresence>

      {/* Onboarding overlay */}
      <AnimatePresence>
        {screen === "onboarding" && (
          <OnboardingOverlay onClose={handleOnboardingClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
