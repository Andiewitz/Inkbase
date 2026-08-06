"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { Bonjour } from "../components/ui/bonjour";
import { OnboardingOverlay } from "../components/ui/onboarding";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "bonjour" | "onboarding" | "dashboard";

interface BranchInfo {
  name: string;
  isEdit: boolean;
  pendingChanges: number;
}

interface DocumentItem {
  id: string;
  title: string;
  excerpt: string;
  lastEdited: string;
  wordCount: number;
  branch: BranchInfo;
}

// ─── Document Data ─────────────────────────────────────────────────────────────

const MOCK_WORKSPACE = { name: "My Workspace", plan: "Free Tier" };

const DOCUMENTS: DocumentItem[] = [
  {
    id: "1",
    title: "The Cassidy Chronicles: Part 1",
    excerpt:
      "The rain had not stopped since Tuesday. Below the elevated tracks of the 4th Avenue line, the streetlights reflected in long, shimmering ribbons across the wet asphalt. Mark pulled his collar up against the damp chill, watching the neon sign of the diner flicker and hum in the fog...",
    lastEdited: "Opened Aug 2, 2026",
    wordCount: 4820,
    branch: { name: "edit", isEdit: true, pendingChanges: 14 },
  },
  {
    id: "2",
    title: "The Bronze and the Silver",
    excerpt:
      "CHAPTER 1 — THE MERCANTILE CODE\n\nIn the grand halls of the guild masters, gold was considered crude—a metal for soldiers and tax collectors. Silver was for scholars, and polished bronze was reserved for those who recorded the true history of the river kingdoms...",
    lastEdited: "Opened Jul 23, 2026",
    wordCount: 2340,
    branch: { name: "main", isEdit: false, pendingChanges: 0 },
  },
  {
    id: "3",
    title: "Essay: Architecture of Solitude",
    excerpt:
      "When we look at the evolution of modern workspaces, we notice a subtle shift. The open office promised collaboration but delivered noise; the home office promised freedom but introduced isolation...",
    lastEdited: "Opened Jul 8, 2026",
    wordCount: 1940,
    branch: { name: "edit", isEdit: true, pendingChanges: 3 },
  },
];

const FREE_TIER_MAX = 3;

// ─── Google Docs Style Document Preview Card ──────────────────────────────────

function DocumentCard({
  doc,
  onClick,
}: {
  doc: DocumentItem;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="group cursor-pointer flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-gray-300 transition-all"
    >
      {/* Paper Sheet Preview Area */}
      <div className="relative aspect-[3/4] w-full bg-gray-50 border-b border-gray-100 p-4 overflow-hidden flex flex-col justify-start">
        {/* Paper Document Representation */}
        <div className="w-full h-full bg-white rounded-md border border-gray-200/80 shadow-xs p-3 flex flex-col space-y-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <div className="h-2 w-3/4 bg-gray-800/80 rounded-xs mb-1" />
          <div className="h-1.5 w-full bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-full bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-5/6 bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-full bg-gray-300/70 rounded-xs" />
          <div className="h-1.5 w-4/5 bg-gray-300/70 rounded-xs" />

          {/* Actual Micro Snippet Text Preview */}
          <div className="pt-2 text-[9px] leading-[1.3] text-gray-500 line-clamp-6 select-none font-serif">
            {doc.excerpt}
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-100 text-[8px] text-gray-400 font-sans">
            <span>{doc.wordCount} words</span>
            <span
              className={`font-semibold px-1 rounded ${
                doc.branch.isEdit
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {doc.branch.name}
            </span>
          </div>
        </div>
      </div>

      {/* Card Bottom Meta (Google Docs Style) */}
      <div className="p-3 bg-white flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          {/* Docs Blue Page Icon */}
          <div className="mt-0.5 shrink-0 text-blue-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {doc.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-gray-400">{doc.lastEdited}</span>
              {doc.branch.isEdit && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">
                  {doc.branch.pendingChanges} edits
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-dots Menu Button */}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 4.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM8 14.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Start New Document Template Card ─────────────────────────────────────────

function NewDocumentCard({
  title,
  subtitle,
  icon,
  onClick,
  disabled,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileHover={disabled ? {} : { y: -2 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
        className={`aspect-[3/4] w-full rounded-xl border flex items-center justify-center bg-white shadow-xs transition-all ${
          disabled
            ? "border-gray-200 opacity-50 cursor-not-allowed bg-gray-50"
            : "border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer"
        }`}
      >
        {icon ? (
          icon
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </div>
        )}
      </motion.button>
      <span className="mt-2 text-xs font-medium text-gray-900 text-center truncate max-w-full">
        {title}
      </span>
      {subtitle && (
        <span className="text-[10px] text-gray-400 text-center truncate max-w-full">
          {subtitle}
        </span>
      )}
    </div>
  );
}

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
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white px-3 py-4 select-none">
      {/* Workspace Branding */}
      <div className="flex items-center gap-2.5 px-2 pb-4 border-b border-gray-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white font-bold text-sm shrink-0">
          I
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">Inkbase</p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {workspace.name}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 space-y-1">
        {[
          { label: "Recent Documents", icon: "📄", active: true },
          { label: "Branch Reviews", icon: "🔀", active: false },
          { label: "Trash", icon: "🗑️", active: false },
        ].map((item) => (
          <button
            key={item.label}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              item.active
                ? "bg-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Document List in Sidebar */}
      <div className="mt-6">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Manuscripts
          </span>
          <span className="text-[10px] font-medium text-gray-400">
            {documents.length}/{FREE_TIER_MAX}
          </span>
        </div>
        <div className="space-y-0.5">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => onSelect(doc.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition ${
                activeId === doc.id
                  ? "bg-gray-100 font-semibold text-gray-900"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="text-blue-500 shrink-0">📄</span>
              <span className="truncate text-left">{doc.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Free Tier Storage Limit Indicator */}
      <div className="mt-auto border-t border-gray-100 pt-4 px-2">
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-gray-700">Free Tier</span>
            <span className="text-[10px] text-gray-500">
              {documents.length}/{FREE_TIER_MAX} Docs
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(documents.length / FREE_TIER_MAX) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 pt-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
            D
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-gray-800">
              devwork@mesh.com
            </p>
          </div>
        </div>
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
                title="Blank document"
                onClick={() => {}}
                disabled={atLimit}
              />
              <NewDocumentCard
                title="Fiction Chapter"
                subtitle="Novel Draft"
                onClick={() => {}}
                disabled={atLimit}
              />
              <NewDocumentCard
                title="Essay Proposal"
                subtitle="Academic / Non-Fiction"
                onClick={() => {}}
                disabled={atLimit}
              />
              <NewDocumentCard
                title="Prose Review"
                subtitle="Branch Review Template"
                onClick={() => {}}
                disabled={atLimit}
              />
              <NewDocumentCard
                title="Short Story"
                subtitle="Creative Writing"
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
