"use client";

import React, { useEffect, useLayoutEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import {
  LayoutDashboard,
  BookOpen,
  GitBranch,
  Trash2,
  Settings,
  LogOut,
  Search,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import Logo from "../assets/logo.svg";
import { FREE_TIER_MAX } from "../components/documents/data";
import { DocumentCard } from "../components/documents/document-card";
import { NewDocumentCard } from "../components/documents/new-document-card";
import { RecentSpotlight } from "../components/documents/recent-spotlight";
import type { DocumentItem } from "../components/documents/types";
import { Bonjour } from "../components/ui/bonjour";
import { OnboardingOverlay } from "../components/ui/onboarding";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "bonjour" | "onboarding" | "dashboard";

// ─── Studio Sidebar ───────────────────────────────────────────────────────────

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

// ─── Main Studio Content (Spotlight + Manuscript Cards Grid) ─────────────────

function StudioDashboardMain({
  documents,
  loading,
  error,
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
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onImportFile: (file: File) => void;
  onCreateBlank: () => void;
  onDelete: (id: string) => void;
  onExport: (id: string, format: string) => void;
}) {
  const atLimit = documents.length >= FREE_TIER_MAX;
  const recentDoc = documents[0];

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[#F6FBFC] p-6 lg:p-9 space-y-7">
      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-850 font-sans">
            Dashboard
          </h2>
        </div>

        {/* Search Bar + Date + New Manuscript Button */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5 rounded-full bg-white border border-slate-200/80 px-4 py-2 text-xs text-slate-700 shadow-2xs focus-within:shadow-xs focus-within:border-teal-400 transition w-full sm:w-72">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manuscripts..."
              className="w-full bg-transparent outline-none placeholder-slate-400 text-xs"
            />
          </div>

          <span className="hidden lg:inline-block text-xs font-semibold text-slate-400 whitespace-nowrap px-1">
            {todayFormatted}
          </span>

          <Button
            onClick={onCreateBlank}
            disabled={atLimit}
            size="default"
            className="rounded-full bg-[#2C7E86] hover:bg-[#22676E] text-white shadow-xs font-semibold cursor-pointer gap-1.5"
          >
            <Plus className="h-4 w-4" />
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

      {/* Spotlight Hero: "Ready to jump back in, chief?" */}
      {!loading && !searchQuery && recentDoc && (
        <RecentSpotlight
          doc={recentDoc}
          onOpen={() => {}}
          onExport={onExport}
          onDelete={onDelete}
        />
      )}

      {/* Manuscripts Cards Section */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-850">
              {searchQuery ? "Search Results" : "All Manuscripts"}
            </h3>
            <p className="text-xs text-slate-400">
              Physical paper sheets with branch histories
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>
              {documents.length} of {FREE_TIER_MAX} slots used
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#2C7E86]" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
            <p className="text-sm font-bold text-slate-700">No matching manuscripts</p>
            <p className="text-xs text-slate-400 mt-1">Try a different search keyword or create a new manuscript</p>
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
                onClick={() => {}}
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
      {/* Unified Floating Rounded Studio Shell */}
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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onImportFile={handleImportFile}
          onCreateBlank={handleCreateBlank}
          onDelete={handleDelete}
          onExport={handleExport}
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
