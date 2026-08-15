"use client";

import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bars3BottomLeftIcon,
  Bars3Icon,
  DocumentIcon,
  DocumentTextIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { GitBranchIcon, PlusIcon, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import Logo from "../assets/logo.svg";
import { FREE_TIER_MAX } from "../components/documents/data";
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
  userEmail,
  onSelect,
}: {
  workspace: typeof MOCK_WORKSPACE;
  documents: DocumentItem[];
  activeId: string | null;
  userEmail: string;
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

  const userInitial = userEmail.charAt(0).toUpperCase() || "U";

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-gray-300 bg-white py-4 select-none transition-[width] duration-300 ease-in-out overflow-hidden shadow-[4px_0_8px_-6px_rgba(0,0,0,0.12)]",
        collapsed ? "w-16 px-2" : "w-60 px-3",
      )}
    >
      {/* Workspace Branding + Collapse Toggle */}
      <div
        className={cn(
          "flex items-center pb-4 border-b border-gray-100",
          collapsed ? "justify-center" : "gap-2.5 px-2",
        )}
      >
        {!collapsed && (
          <Image
            src={Logo}
            alt="Inkbase logo"
            width={268}
            height={545}
            className="h-7 w-auto shrink-0"
          />
        )}
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-900">Inkbase</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {workspace.name}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
        >
          {collapsed ? (
            <Bars3Icon className="h-4 w-4" />
          ) : (
            <Bars3BottomLeftIcon className="h-4 w-4" />
          )}
        </button>
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
      <div className="mt-6 flex-1 overflow-y-auto">
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
                style={{ width: `${Math.min(100, (documents.length / FREE_TIER_MAX) * 100)}%` }}
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
            {userInitial}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-800">
                {userEmail || "Signed in"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ─── Main Google Docs Style Dashboard View ────────────────────────────────────

function DashboardMain({
  documents,
  loading,
  error,
  userEmail,
  searchQuery,
  setSearchQuery,
  onImportFile,
  onCreateBlank,
  onDelete,
  onExport,
}: {
  documents: DocumentItem[];
  loading: boolean;
  error: string | null;
  userEmail: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onImportFile: (file: File) => void;
  onCreateBlank: () => void;
  onDelete: (id: string) => void;
  onExport: (id: string, format: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const atLimit = documents.length >= FREE_TIER_MAX;

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-100/60">
      <Sidebar
        workspace={MOCK_WORKSPACE}
        documents={documents}
        activeId={activeId}
        userEmail={userEmail}
        onSelect={setActiveId}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-8 py-3">
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 w-full max-w-xl rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700 focus-within:bg-white focus-within:shadow-md focus-within:ring-1 focus-within:ring-gray-300 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400 shrink-0">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manuscripts and review branches"
              className="w-full bg-transparent outline-none placeholder-gray-400 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCreateBlank}
              disabled={atLimit}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                atLimit
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs"
              }`}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>New Manuscript</span>
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto py-6 px-8 space-y-6">
          {/* Error Alert banner */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Recent documents */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">
                Recent documents
              </h3>

              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Owned by you</span>
                <span className="font-medium text-gray-400">
                  {documents.length} of {FREE_TIER_MAX} slots used
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                <NewDocumentCard
                  title="Import Document"
                  subtitle=".docx, .pdf, .md, .epub, .rtf, .odt"
                  onImportFile={onImportFile}
                  disabled={atLimit}
                />
                {filteredDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onClick={() => setActiveId(doc.id)}
                    onDelete={onDelete}
                    onExport={onExport}
                  />
                ))}
              </div>
            )}
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
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/documents");
      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to load manuscripts");
        return;
      }
      const data = await res.json();
      setDocuments(data.documents || []);
      setError(null);
    } catch {
      setError("Network error while connecting to documents service");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadUser = useCallback(async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.user_id) {
          setUserEmail(`User #${data.user_id}`);
        }
      }
    } catch {
      // Best-effort
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    loadUser();
  }, [loadDocuments, loadUser]);

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

  const handleImportFile = async (file: File) => {
    try {
      setError(null);
      const formData = new FormData();
      formData.append("file", file);

      const res = await apiFetch("/api/documents/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to import file");
        return;
      }

      await loadDocuments();
    } catch {
      setError("Error uploading file");
    }
  };

  const handleCreateBlank = async () => {
    try {
      setError(null);
      const res = await apiFetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Manuscript",
          content: "",
          format: "md",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to create document");
        return;
      }

      await loadDocuments();
    } catch {
      setError("Error creating document");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      const res = await apiFetch(`/api/documents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to delete document");
        return;
      }
      await loadDocuments();
    } catch {
      setError("Error deleting document");
    }
  };

  const handleExport = (id: string, format: string) => {
    window.open(`/api/documents/${id}/export?format=${format}`, "_blank");
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
        <DashboardMain
          documents={documents}
          loading={loading}
          error={error}
          userEmail={userEmail}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onImportFile={handleImportFile}
          onCreateBlank={handleCreateBlank}
          onDelete={handleDelete}
          onExport={handleExport}
        />
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
