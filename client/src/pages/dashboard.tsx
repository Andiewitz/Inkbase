"use client";

import { useEffect, useLayoutEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Bars3BottomLeftIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import {
  GitBranchIcon,
  PlusIcon,
  Loader2,
  AlertCircle,
  LayoutGridIcon,
  ListIcon,
  SearchIcon,
  BookOpenIcon,
  Trash2Icon,
  LayersIcon,
  SparklesIcon,
  ArrowUpDownIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import Logo from "../assets/logo.svg";
import { FREE_TIER_MAX } from "../components/documents/data";
import { DocumentCard } from "../components/documents/document-card";
import { DocumentListRow } from "../components/documents/document-list-row";
import { DropzoneBanner } from "../components/documents/dropzone-banner";
import type { DocumentItem, ViewMode, FilterTab, SortBy } from "../components/documents/types";
import { Bonjour } from "../components/ui/bonjour";
import { OnboardingOverlay } from "../components/ui/onboarding";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "bonjour" | "onboarding" | "dashboard";

const MOCK_WORKSPACE = { name: "Author Studio", plan: "Free Tier" };

// ─── Sidebar Component ────────────────────────────────────────────────────────

function Sidebar({
  workspace,
  documents,
  activeId,
  userEmail,
  filterTab,
  onSelectFilter,
  onSelectDoc,
}: {
  workspace: typeof MOCK_WORKSPACE;
  documents: DocumentItem[];
  activeId: string | null;
  userEmail: string;
  filterTab: FilterTab;
  onSelectFilter: (tab: FilterTab) => void;
  onSelectDoc: (id: string) => void;
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

  const userInitial = userEmail ? userEmail.replace(/^User #/, "").charAt(0) || "A" : "A";
  const inReviewCount = documents.filter((d) => d.branch?.is_edit || d.branch?.isEdit).length;

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-gray-200/90 bg-[#FBFBFC] py-4 select-none transition-[width] duration-300 ease-in-out overflow-hidden shadow-xs",
        collapsed ? "w-16 px-2" : "w-64 px-3.5",
      )}
    >
      {/* Workspace Branding + Collapse Toggle */}
      <div
        className={cn(
          "flex items-center pb-4 border-b border-gray-200/70",
          collapsed ? "justify-center" : "gap-2.5 px-1.5",
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
            <p className="truncate text-sm font-bold text-gray-900 font-serif">Inkbase</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-700/80">
              {workspace.name}
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
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
        <button
          type="button"
          onClick={() => onSelectFilter("all")}
          title={collapsed ? "All Manuscripts" : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
            collapsed && "justify-center px-2",
            filterTab === "all"
              ? "bg-purple-100/70 text-purple-900 shadow-2xs"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          <BookOpenIcon className="h-4 w-4 shrink-0 text-purple-600" />
          {!collapsed && <span>All Manuscripts</span>}
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter("in_review")}
          title={collapsed ? "Branch Reviews" : undefined}
          className={cn(
            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition",
            collapsed && "justify-center px-2",
            filterTab === "in_review"
              ? "bg-purple-100/70 text-purple-900 shadow-2xs"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          <div className="flex items-center gap-2.5">
            <GitBranchIcon className="h-4 w-4 shrink-0 text-amber-600" />
            {!collapsed && <span>Branch Reviews</span>}
          </div>
          {!collapsed && inReviewCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {inReviewCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectFilter("drafts")}
          title={collapsed ? "Drafts" : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition",
            collapsed && "justify-center px-2",
            filterTab === "drafts"
              ? "bg-purple-100/70 text-purple-900 shadow-2xs"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          <LayersIcon className="h-4 w-4 shrink-0 text-gray-500" />
          {!collapsed && <span>Drafts</span>}
        </button>
      </nav>

      {/* Manuscripts List in Sidebar */}
      <div className="mt-6 flex-1 overflow-y-auto">
        {!collapsed && (
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Recent Manuscripts
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
              onClick={() => onSelectDoc(doc.id)}
              title={collapsed ? doc.title : undefined}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition",
                collapsed && "justify-center px-2",
                activeId === doc.id
                  ? "bg-purple-50 font-semibold text-purple-900"
                  : "text-gray-600 hover:bg-gray-100/80",
              )}
            >
              <div className="h-1.5 w-1.5 rounded-full bg-purple-400 shrink-0" />
              {!collapsed && <span className="truncate text-left">{doc.title}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Free Tier Storage Limit Indicator */}
      <div className="mt-auto border-t border-gray-200/70 pt-4 px-1">
        {!collapsed && (
          <div className="rounded-xl bg-white p-3 border border-gray-200/80 shadow-2xs">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-800">Free Tier</span>
              <span className="text-[10px] font-medium text-gray-500">
                {documents.length}/{FREE_TIER_MAX} Docs
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full bg-purple-600 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (documents.length / FREE_TIER_MAX) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div
          className={cn(
            "mt-3 flex items-center gap-2.5 pt-1",
            collapsed && "justify-center",
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-800 text-xs font-bold text-white shadow-xs">
            {userInitial}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900">
                {userEmail || "Author"}
              </p>
              <p className="text-[10px] text-gray-400">Prose Studio</p>
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
  viewMode,
  setViewMode,
  filterTab,
  setFilterTab,
  sortBy,
  setSortBy,
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
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  filterTab: FilterTab;
  setFilterTab: (f: FilterTab) => void;
  sortBy: SortBy;
  setSortBy: (s: SortBy) => void;
  onImportFile: (file: File) => void;
  onCreateBlank: (title?: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string, format: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const atLimit = documents.length >= FREE_TIER_MAX;

  // Filter & Sort Logic
  const filteredAndSortedDocs = useMemo(() => {
    let result = documents.filter((doc) => {
      const matchesSearch =
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterTab === "in_review") {
        return doc.branch?.is_edit || doc.branch?.isEdit;
      }
      if (filterTab === "drafts") {
        return !(doc.branch?.is_edit || doc.branch?.isEdit);
      }
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "title_asc") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "words_desc") {
        const wA = a.wordCount ?? a.word_count ?? 0;
        const wB = b.wordCount ?? b.word_count ?? 0;
        return wB - wA;
      }
      // default: updated_desc
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return result;
  }, [documents, searchQuery, filterTab, sortBy]);

  return (
    <div className="flex flex-1 overflow-hidden bg-[#F7F7F8]">
      <Sidebar
        workspace={MOCK_WORKSPACE}
        documents={documents}
        activeId={activeId}
        userEmail={userEmail}
        filterTab={filterTab}
        onSelectFilter={setFilterTab}
        onSelectDoc={setActiveId}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/80 bg-white/95 backdrop-blur-xs px-8 py-3.5 shadow-2xs">
          {/* Search Input Bar */}
          <div className="flex items-center gap-3 w-full max-w-xl rounded-xl bg-gray-100/90 px-3.5 py-2 text-sm text-gray-700 focus-within:bg-white focus-within:shadow-xs focus-within:ring-2 focus-within:ring-purple-200 border border-transparent focus-within:border-purple-300 transition-all">
            <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manuscripts, branches, or excerpts..."
              className="w-full bg-transparent outline-none placeholder-gray-400 text-sm font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onCreateBlank()}
              disabled={atLimit}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                atLimit
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                  : "bg-purple-700 text-white hover:bg-purple-800 shadow-xs cursor-pointer"
              }`}
            >
              <PlusIcon className="h-3.5 w-3.5" />
              <span>New Manuscript</span>
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto py-7 px-8 space-y-7">
          {/* Error Alert banner */}
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 shadow-2xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Top Creation & Dropzone Hub */}
          <DropzoneBanner
            onImportFile={onImportFile}
            onCreateBlank={onCreateBlank}
            disabled={atLimit}
            usedSlots={documents.length}
            maxSlots={FREE_TIER_MAX}
          />

          {/* Controls Bar: Filters, Sort, View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-200/60">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-200/60 p-1 rounded-xl">
              {[
                { id: "all" as FilterTab, label: "All Manuscripts" },
                { id: "in_review" as FilterTab, label: "In Review" },
                { id: "drafts" as FilterTab, label: "Drafts" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filterTab === tab.id
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right Controls: Sort & View Toggle */}
            <div className="flex items-center gap-3">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white border border-gray-200/80 rounded-xl px-2.5 py-1.5 shadow-2xs">
                <ArrowUpDownIcon className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-transparent text-xs font-medium text-gray-700 outline-none cursor-pointer"
                >
                  <option value="updated_desc">Recently edited</option>
                  <option value="words_desc">Word count</option>
                  <option value="title_asc">Title (A-Z)</option>
                </select>
              </div>

              {/* Grid / List View Toggle */}
              <div className="flex items-center gap-0.5 bg-gray-200/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-purple-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <LayoutGridIcon className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  title="List View"
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white text-purple-700 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Documents Content Grid / List */}
          <div>
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            ) : filteredAndSortedDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
                <BookOpenIcon className="w-10 h-10 text-gray-300 mb-3" />
                <h3 className="text-sm font-semibold text-gray-900">
                  {searchQuery ? "No matching manuscripts found" : "No manuscripts in this view"}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">
                  {searchQuery
                    ? `No drafts matched "${searchQuery}". Try a different keyword or clear search.`
                    : "Create a blank manuscript or drop a file to start writing."}
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-3 text-xs font-semibold text-purple-700 hover:underline"
                  >
                    Clear search filter
                  </button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {filteredAndSortedDocs.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onClick={() => setActiveId(doc.id)}
                    onDelete={onDelete}
                    onExport={onExport}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredAndSortedDocs.map((doc) => (
                  <DocumentListRow
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
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortBy>("updated_desc");

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
    sessionStorage.removeItem("inkbase_show_onboarding");
    setScreen("dashboard");
    if (window.location.search.includes("onboarding=true")) {
      router.replace("/dashboard", undefined, { shallow: true });
    }
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
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to import file");
        return;
      }

      await loadDocuments();
    } catch {
      setError("Failed to upload manuscript");
    }
  };

  const handleCreateBlank = async (title?: string) => {
    try {
      setError(null);
      const res = await apiFetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled Manuscript",
          content: "Chapter 1\n\nBegin your story here...",
          format: "txt",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to create blank manuscript");
        return;
      }

      await loadDocuments();
    } catch {
      setError("Failed to create document");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      const res = await apiFetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete document");
        return;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      setError("Failed to delete document");
    }
  };

  const handleExport = async (id: string, format: string) => {
    try {
      const res = await apiFetch(`/api/documents/${id}/export?format=${format}`);
      if (!res.ok) {
        setError(`Failed to export document as ${format.toUpperCase()}`);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `manuscript-${id}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download exported file");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F7F8] font-sans antialiased text-gray-900">
      {screen === "bonjour" && (
        <Bonjour onFinished={handleBonjourFinished} />
      )}
      {screen === "onboarding" && (
        <OnboardingOverlay onClose={handleOnboardingClose} />
      )}
      {screen === "dashboard" && (
        <DashboardMain
          documents={documents}
          loading={loading}
          error={error}
          userEmail={userEmail}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filterTab={filterTab}
          setFilterTab={setFilterTab}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onImportFile={handleImportFile}
          onCreateBlank={handleCreateBlank}
          onDelete={handleDelete}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
