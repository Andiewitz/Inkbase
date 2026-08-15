"use client";

import React, { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  GitBranch,
  Trash2,
  Settings,
  LogOut,
  ChevronLeft,
  Search,
  Plus,
  FileText,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  MoreVertical,
  Download,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import Logo from "../assets/logo.svg";
import { FREE_TIER_MAX } from "../components/documents/data";
import { DocumentCard } from "../components/documents/document-card";
import { NewDocumentCard } from "../components/documents/new-document-card";
import { RecentSpotlight } from "../components/documents/recent-spotlight";
import { StudioStatCard } from "../components/documents/studio-stat-card";
import { StatusDonutCard } from "../components/documents/status-donut";
import { WritingVelocityChart } from "../components/documents/writing-velocity-chart";
import type { DocumentItem } from "../components/documents/types";
import { Bonjour } from "../components/ui/bonjour";
import { OnboardingOverlay } from "../components/ui/onboarding";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "bonjour" | "onboarding" | "dashboard";

// ─── Sidebar Component (Matching Reference) ───────────────────────────────────

function StudioSidebar({
  documents,
  userEmail,
  activeTab,
  setActiveTab,
  onLogout,
}: {
  documents: DocumentItem[];
  userEmail: string;
  activeTab: string;
  setActiveTab: (t: string) => void;
  onLogout?: () => void;
}) {
  const userInitial = userEmail.charAt(0).toUpperCase() || "A";
  const usedSlots = documents.length;
  const storagePct = Math.min(100, Math.round((usedSlots / FREE_TIER_MAX) * 100));

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "manuscripts", label: "Manuscripts", icon: BookOpen },
    { id: "branches", label: "Branch Reviews", icon: GitBranch },
    { id: "trash", label: "Trash", icon: Trash2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-[#EAF4F7]/80 md:min-h-full p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#D2E7EE] select-none">
      <div className="space-y-6">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 px-2 pt-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xs border border-white">
            <Image
              src={Logo}
              alt="Inkbase"
              width={24}
              height={24}
              className="h-6 w-auto"
            />
          </div>
          <div>
            <h1
              className="text-xl font-normal text-slate-850 leading-tight tracking-tight"
              style={{ fontFamily: "var(--font-lobster), cursive" }}
            >
              Inkbase
            </h1>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Writing Studio
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 pt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex w-full items-center gap-3.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-white text-slate-850 shadow-[0_2px_8px_rgba(80,120,150,0.08)] border border-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/40",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-[#2C7E86]" : "text-slate-500",
                  )}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 pt-6">
        {/* Storage Widget Card */}
        <div className="rounded-2xl border border-white/80 bg-gradient-to-br from-[#D8F0F5] to-[#C4E8EF] p-4 shadow-[0_2px_10px_rgba(100,150,180,0.08)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Storage
              </p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {usedSlots} / {FREE_TIER_MAX} Free Slots
              </p>
              <p className="text-[9px] text-slate-400 mt-0.5">Free Tier</p>
            </div>

            {/* Circular Gauge */}
            <div className="relative flex h-11 w-11 items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/60"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#2C7E86] transition-all duration-500"
                  strokeDasharray={`${storagePct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[9px] font-extrabold text-slate-800">
                {storagePct}%
              </span>
            </div>
          </div>
        </div>

        {/* User Profile Pill & Logout */}
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 rounded-full border border-white/90 bg-white p-1.5 pr-3.5 shadow-xs">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2C7E86] to-[#1E5C63] text-xs font-bold text-white shadow-2xs">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-800">
                {userEmail.split("@")[0] || "Author"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Main Studio Dashboard ───────────────────────────────────────────────────

function StudioDashboardMain({
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
  onLogout,
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
  onLogout?: () => void;
}) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [listFilter, setListFilter] = useState<"all" | "review">("all");
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const atLimit = documents.length >= FREE_TIER_MAX;
  const recentDoc = documents[0];

  // Aggregate Stats
  const totalWords = documents.reduce(
    (acc, d) => acc + (d.wordCount ?? d.word_count ?? 0),
    0,
  );
  const activeBranchesCount = documents.filter(
    (d) => d.branch?.name && d.branch.name !== "main",
  ).length;
  const inReviewCount = documents.filter(
    (d) => d.branch?.isEdit || d.branch?.is_edit,
  ).length;

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    if (listFilter === "review") {
      return (
        matchesSearch && (doc.branch?.isEdit || doc.branch?.is_edit || false)
      );
    }
    return matchesSearch;
  });

  // Format today's date nicely
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#F6FBFC] p-5 lg:p-8 space-y-6">
      {/* Top Header Bar (Matching Reference) */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveDocId(null)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-slate-200/80 shadow-xs text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Back to top"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-850 font-sans">
              Dashboard
            </h2>
          </div>
        </div>

        {/* Center/Right Controls: Search + Date + New Manuscript */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* Search Input Bar */}
          <div className="flex items-center gap-2.5 rounded-full bg-white border border-slate-200/80 px-4 py-1.5 text-xs text-slate-700 shadow-2xs focus-within:shadow-xs focus-within:border-teal-400 transition w-full sm:w-64">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manuscripts..."
              className="w-full bg-transparent outline-none placeholder-slate-400 text-xs"
            />
          </div>

          <span className="hidden lg:inline-block text-xs font-semibold text-slate-400 whitespace-nowrap">
            {todayFormatted}
          </span>

          <Button
            onClick={onCreateBlank}
            disabled={atLimit}
            size="sm"
            className="rounded-full bg-[#2C7E86] hover:bg-[#22676E] text-white shadow-xs font-semibold cursor-pointer gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Manuscript</span>
          </Button>
        </div>
      </header>

      {/* Error Alert banner if present */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── TOP ROW: Greeting + Stat Cards + Recently Viewed ───────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* User Greeting Card (Matching Reference "Hello, Mandy!") */}
        <div className="flex items-center gap-4 rounded-3xl border border-white/80 bg-gradient-to-br from-[#E0F4F7] via-[#D2EFF4] to-[#C2EBF2] p-5 shadow-[0_4px_16px_rgba(120,165,185,0.12)]">
          <div className="relative">
            <div className="flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-[#2C7E86] to-[#1E5C63] text-lg font-bold text-white shadow-sm ring-2 ring-white">
              {userEmail.charAt(0).toUpperCase() || "A"}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-white shadow-2xs">
              👑
            </span>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Hello,</p>
            <h3 className="text-lg font-extrabold text-slate-850 leading-tight">
              {userEmail.split("@")[0] || "Author"}!
            </h3>
            <p className="text-[10px] font-semibold text-teal-800 mt-0.5">
              Ready to write?
            </p>
          </div>
        </div>

        {/* Stat Card 1: Total Words */}
        <StudioStatCard
          title="Words Written"
          value={totalWords.toLocaleString()}
          subtitle="Across all manuscripts"
          icon={<FileText className="h-4 w-4 text-[#2C7E86]" />}
        />

        {/* Stat Card 2: Active Branches */}
        <StudioStatCard
          title="Active Branches"
          value={activeBranchesCount || 1}
          subtitle="Parallel review drafts"
          icon={<GitBranch className="h-4 w-4 text-[#2C7E86]" />}
        />

        {/* Stat Card 3: Total Manuscripts */}
        <StudioStatCard
          title="Total Manuscripts"
          value={documents.length}
          subtitle={`${FREE_TIER_MAX - documents.length} slots available`}
          icon={<BookOpen className="h-4 w-4 text-[#2C7E86]" />}
        />
      </div>

      {/* ─── MIDDLE ROW: Spotlight + Donut Chart + Manuscript List ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Spotlight Hero + Writing Velocity Wave (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {recentDoc && (
            <RecentSpotlight
              doc={recentDoc}
              onOpen={() => setActiveDocId(recentDoc.id)}
              onExport={onExport}
              onDelete={onDelete}
            />
          )}

          {/* Bottom Velocity Wave Trend (Delivered Albums Chart style) */}
          <WritingVelocityChart wordCount={totalWords || 1116} />
        </div>

        {/* Right Column: Status Donut + Segmented Manuscript List (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Status Donut Breakdown */}
          <StatusDonutCard
            totalCount={documents.length}
            finalizedCount={documents.length - inReviewCount}
            inReviewCount={inReviewCount}
          />

          {/* Filterable Manuscript List Card (Matching Reference's "Finalized / Pending" List) */}
          <div className="rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_4px_18px_rgba(100,140,170,0.08)] flex flex-col justify-between space-y-4">
            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setListFilter("all")}
                className={cn(
                  "flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer",
                  listFilter === "all"
                    ? "bg-[#2C7E86] text-white shadow-xs"
                    : "bg-[#E5F5F8] text-[#2C7E86] hover:bg-[#D7F0F4]",
                )}
              >
                All Manuscripts ({documents.length})
              </button>
              <button
                type="button"
                onClick={() => setListFilter("review")}
                className={cn(
                  "flex-1 py-1.5 text-center text-xs font-bold rounded-xl transition-all cursor-pointer",
                  listFilter === "review"
                    ? "bg-[#2C7E86] text-white shadow-xs"
                    : "bg-[#E5F5F8] text-[#2C7E86] hover:bg-[#D7F0F4]",
                )}
              >
                In Review ({inReviewCount})
              </button>
            </div>

            {/* List Rows with Sharp Paper Previews */}
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {filteredDocs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs font-medium">
                  No manuscripts in this view.
                </div>
              ) : (
                filteredDocs.map((doc) => {
                  const docWords = doc.wordCount ?? doc.word_count ?? 0;
                  const isEdit = doc.branch?.isEdit || doc.branch?.is_edit;
                  const dateStr = doc.lastEdited || (doc.updated_at ? new Date(doc.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent");

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setActiveDocId(doc.id)}
                      className="group flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50/70 hover:bg-[#EAF6F8] border border-slate-100/90 transition-all cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Miniature Paper Sheet Preview (Sharp Edges) */}
                        <div className="h-10 w-8 shrink-0 rounded-none border border-slate-200 bg-white p-1 shadow-2xs flex flex-col justify-between">
                          <div className="h-1 w-full bg-slate-700 rounded-none" />
                          <div className="space-y-0.5">
                            <div className="h-0.5 w-full bg-slate-200 rounded-none" />
                            <div className="h-0.5 w-3/4 bg-slate-200 rounded-none" />
                          </div>
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-850 truncate group-hover:text-[#2C7E86] transition-colors">
                            {doc.title}
                          </h5>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                            <span>{docWords.toLocaleString()} words</span>
                            <span>•</span>
                            <span className="font-mono text-[9px] text-slate-500 bg-white px-1 py-0.2 rounded border border-slate-200">
                              {doc.branch?.name || "main"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-medium text-slate-400">
                          {dateStr}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-white transition"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuLabel>Export</DropdownMenuLabel>
                            {["docx", "pdf", "md", "epub", "txt"].map((fmt) => (
                              <DropdownMenuItem
                                key={fmt}
                                onClick={() => onExport(doc.id, fmt)}
                                className="uppercase text-xs"
                              >
                                <Download className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                .{fmt}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(doc.id)}
                              className="text-red-600 font-semibold text-xs"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2 text-red-500" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM ROW: Full Manuscript Grid Gallery ───────────────────────── */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-850">
              All Manuscript Works
            </h3>
            <p className="text-xs text-slate-400">
              Physical paper sheets with version branch history
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>
              {documents.length} of {FREE_TIER_MAX} slots used
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#2C7E86]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            <NewDocumentCard
              title="Import Document"
              subtitle=".docx, .pdf, .md, .epub, .txt"
              onImportFile={onImportFile}
              disabled={atLimit}
            />
            {filteredDocs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onClick={() => setActiveDocId(doc.id)}
                onDelete={onDelete}
                onExport={onExport}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Dashboard Page Wrapper (Floating Studio Canvas) ──────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

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
      // ignore
    }
  }, []);

  useLayoutEffect(() => {
    setIsMounted(true);
    const seen = localStorage.getItem("inkbase_onboarding_seen");
    if (!seen) {
      setScreen("bonjour");
    }
  }, []);

  useEffect(() => {
    loadDocuments();
    loadUser();
  }, [loadDocuments, loadUser]);

  const handleCreateBlank = async () => {
    if (documents.length >= FREE_TIER_MAX) return;
    try {
      const res = await apiFetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Manuscript" }),
      });
      if (res.ok) {
        loadDocuments();
      }
    } catch {
      setError("Could not create blank document");
    }
  };

  const handleImportFile = async (file: File) => {
    if (documents.length >= FREE_TIER_MAX) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/api/documents/import", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        loadDocuments();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Import failed");
      }
    } catch {
      setError("Failed to upload document");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await apiFetch(`/api/documents/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      setError("Failed to delete manuscript");
    }
  };

  const handleExport = (id: string, format: string) => {
    window.open(`/api/documents/${id}/export?format=${format}`, "_blank");
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.replace("/auth/login");
    } catch {
      router.replace("/auth/login");
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#E3EDF6] p-2 sm:p-4 lg:p-6 flex items-center justify-center">
      {/* Unified Floating Rounded Studio Shell (Matching Reference Canvas) */}
      <div className="w-full max-w-[1520px] min-h-[92vh] rounded-[28px] sm:rounded-[36px] bg-[#F5FAFC] border border-white/90 shadow-[0_24px_70px_-15px_rgba(50,95,140,0.22)] overflow-hidden flex flex-col md:flex-row">
        <StudioSidebar
          documents={documents}
          userEmail={userEmail}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
        />

        <StudioDashboardMain
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
          onLogout={handleLogout}
        />
      </div>

      {screen === "bonjour" && (
        <Bonjour onFinished={() => setScreen("onboarding")} />
      )}
      {screen === "onboarding" && (
        <OnboardingOverlay onClose={() => setScreen("dashboard")} />
      )}
    </div>
  );
}
