"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { AnimatePresence, motion } from "framer-motion";
import { Bonjour } from "../components/ui/bonjour";
import { OnboardingOverlay } from "../components/ui/onboarding";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "bonjour" | "onboarding" | "dashboard";

interface Branch {
  name: string;
  isEdit: boolean;
  pendingChanges: number;
  lastEdit: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  wordCount: number;
  mainBranch: Branch;
  editBranch: Branch | null;
  lastEdited: string;
  collaborators: number;
  status: "active" | "review" | "merged";
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_WORKSPACE = { name: "My Workspace", plan: "free" };

const MOCK_PROJECTS: Project[] = [
  {
    id: "1",
    title: "The Architecture of Solitude",
    description: "A long-form essay exploring how remote work changed the texture of modern loneliness.",
    wordCount: 4820,
    mainBranch: { name: "main", isEdit: false, pendingChanges: 0, lastEdit: "2 days ago" },
    editBranch: { name: "edit", isEdit: true, pendingChanges: 14, lastEdit: "3 hours ago" },
    lastEdited: "3 hours ago",
    collaborators: 1,
    status: "review",
  },
  {
    id: "2",
    title: "On Calibrated Uncertainty",
    description: "A short piece on epistemic humility and why smart people hold their beliefs loosely.",
    wordCount: 1940,
    mainBranch: { name: "main", isEdit: false, pendingChanges: 0, lastEdit: "1 week ago" },
    editBranch: null,
    lastEdited: "1 week ago",
    collaborators: 1,
    status: "active",
  },
];

const FREE_TIER_MAX = 3;

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Project["status"] }) {
  const map = {
    active: { label: "Active", cls: "bg-gray-100 text-gray-600" },
    review: { label: "In Review", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
    merged: { label: "Merged", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function BranchPill({ branch, dimmed = false }: { branch: Branch; dimmed?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${dimmed ? "opacity-40" : ""}`}>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-gray-400">
        <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="4" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="8" r="2" stroke={branch.isEdit ? "#f59e0b" : "currentColor"} strokeWidth="1.5" fill={branch.isEdit ? "#fef3c7" : "none"} />
        <path d="M4 6v4M4 6c0-1 1-2 2-2h2c1 0 2 1 2 2v1M10 7v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className={`text-xs font-mono font-medium ${branch.isEdit ? "text-amber-600" : "text-gray-500"}`}>
        {branch.name}
      </span>
      {branch.pendingChanges > 0 && (
        <span className="rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-bold text-amber-700">
          {branch.pendingChanges}
        </span>
      )}
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.15 }}
      className="group w-full rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-black">
            {project.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-gray-500 leading-relaxed">
            {project.description}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Branch indicators */}
      <div className="mt-5 flex items-center gap-4 border-t border-gray-100 pt-4">
        <BranchPill branch={project.mainBranch} />
        {project.editBranch ? (
          <>
            <svg width="14" height="14" viewBox="0 0 16 16" className="text-gray-300 shrink-0">
              <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <BranchPill branch={project.editBranch} />
          </>
        ) : (
          <span className="text-xs text-gray-400">No active edits</span>
        )}
      </div>

      {/* Footer meta */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-gray-400">
        <span>{project.wordCount.toLocaleString()} words</span>
        <span>Edited {project.lastEdited}</span>
      </div>
    </motion.button>
  );
}

function NewProjectCard({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { y: -2 }}
      whileTap={disabled ? {} : { scale: 0.99 }}
      transition={{ duration: 0.15 }}
      className={`flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition ${
        disabled
          ? "cursor-not-allowed border-gray-150 opacity-50"
          : "border-gray-200 hover:border-gray-400 hover:bg-gray-50/60"
      }`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${disabled ? "bg-gray-100" : "bg-gray-900"}`}>
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke={disabled ? "#9ca3af" : "white"} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className={`text-sm font-semibold ${disabled ? "text-gray-400" : "text-gray-700"}`}>
          {disabled ? "Project limit reached" : "New project"}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">
          {disabled ? "Upgrade to add more projects" : "Start a new manuscript"}
        </p>
      </div>
    </motion.button>
  );
}

function Sidebar({ workspace, projects, activeId, onSelect, onNewProject }: {
  workspace: typeof MOCK_WORKSPACE;
  projects: Project[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewProject: () => void;
}) {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-5">
      {/* Workspace header */}
      <div className="flex items-center gap-2.5 px-2 pb-5 border-b border-gray-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white text-xs font-bold shrink-0">
          {workspace.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{workspace.name}</p>
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Free</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="mt-4 space-y-0.5">
        {[
          { label: "Home", icon: "M2 6l6-4 6 4v8a1 1 0 01-1 1H3a1 1 0 01-1-1V6z" },
          { label: "All Projects", icon: "M4 4h3v3H4V4zm5 0h3v3H9V4zM4 9h3v3H4V9zm5 0h3v3H9V9z" },
          { label: "Activity", icon: "M2 8h2l2 4 4-8 2 4h2" },
        ].map((item) => (
          <button
            key={item.label}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="shrink-0 text-gray-400">
              <path d={item.icon} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Projects list */}
      <div className="mt-5">
        <div className="flex items-center justify-between px-3 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Projects</span>
          <span className="text-[10px] font-semibold text-gray-400">{projects.length}/{FREE_TIER_MAX}</span>
        </div>
        <div className="space-y-0.5">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                activeId === p.id
                  ? "bg-gray-100 text-gray-900 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="shrink-0 text-base">📄</span>
              <span className="truncate">{p.title}</span>
              {p.editBranch && p.editBranch.pendingChanges > 0 && (
                <span className="ml-auto shrink-0 h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
          {projects.length < FREE_TIER_MAX && (
            <button
              onClick={onNewProject}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              New project
            </button>
          )}
        </div>
      </div>

      {/* Spacer + User */}
      <div className="mt-auto border-t border-gray-100 pt-4">
        {/* Free tier usage */}
        <div className="mb-4 rounded-xl bg-gray-50 px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-700">Free plan</span>
            <span className="text-xs text-gray-500">{projects.length}/{FREE_TIER_MAX} projects</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-gray-900 transition-all"
              style={{ width: `${(projects.length / FREE_TIER_MAX) * 100}%` }}
            />
          </div>
          <button className="mt-2.5 w-full rounded-lg bg-gray-900 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition">
            Upgrade
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
            D
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-gray-700">devwork@mesh.com</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 transition">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 9a1 1 0 100-2 1 1 0 000 2zM3 9a1 1 0 100-2 1 1 0 000 2zM13 9a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Dashboard main view ───────────────────────────────────────────────────────

function DashboardMain({ projects }: { projects: Project[] }) {
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const atLimit = projects.length >= FREE_TIER_MAX;

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar
        workspace={MOCK_WORKSPACE}
        projects={projects}
        activeId={activeProject}
        onSelect={setActiveProject}
        onNewProject={() => {}}
      />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/80 px-8 py-4 backdrop-blur">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Projects</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {MOCK_WORKSPACE.name} · {projects.length} of {FREE_TIER_MAX} projects used
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition">
              Activity
            </button>
            <button
              disabled={atLimit}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                atLimit
                  ? "cursor-not-allowed bg-gray-100 text-gray-400"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              New project
            </button>
          </div>
        </header>

        <div className="px-8 py-8">
          {/* Summary row */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            {[
              {
                label: "Total words",
                value: projects.reduce((s, p) => s + p.wordCount, 0).toLocaleString(),
                sub: "across all manuscripts",
                icon: "M3 4h10M3 8h7M3 12h4",
              },
              {
                label: "In review",
                value: projects.filter((p) => p.status === "review").length,
                sub: "projects with pending edits",
                icon: "M2 8h2l2 4 4-8 2 4h2",
              },
              {
                label: "Open edits",
                value: projects.reduce((s, p) => s + (p.editBranch?.pendingChanges ?? 0), 0),
                sub: "changes awaiting approval",
                icon: "M4 4h3v3H4V4zm5 0h3v3H9V4zM4 9h3v3H4V9zm5 0h3v3H9V9z",
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-gray-400">
                    <path d={stat.icon} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{stat.label}</span>
                </div>
                <p className="text-3xl font-bold tracking-tight text-gray-900">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500">{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Projects grid */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Your manuscripts</h2>
            <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
              {["grid", "list"].map((v) => (
                <button
                  key={v}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition"
                >
                  {v === "grid" ? (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z" stroke="currentColor" strokeWidth="1.2" /></svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.35, ease: "easeOut" }}
              >
                <ProjectCard project={p} onClick={() => setActiveProject(p.id)} />
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: projects.length * 0.07, duration: 0.35, ease: "easeOut" }}
            >
              <NewProjectCard onClick={() => {}} disabled={atLimit} />
            </motion.div>
          </div>

          {/* How it works callout */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white">
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <circle cx="4" cy="4" r="2" stroke="white" strokeWidth="1.4" />
                  <circle cx="4" cy="12" r="2" stroke="white" strokeWidth="1.4" />
                  <circle cx="12" cy="8" r="2" stroke="#fbbf24" strokeWidth="1.4" fill="#fef3c7" />
                  <path d="M4 6v4M4 6c0-1 1-2 2-2h2c1 0 2 1 2 2v1M10 7v1" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">How branching works</h3>
                <p className="mt-1 text-sm text-gray-500 leading-relaxed max-w-xl">
                  Every project has a <code className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono">main</code> branch — your approved manuscript. When you edit, changes go to your{" "}
                  <code className="rounded bg-amber-50 px-1 py-0.5 text-xs font-mono text-amber-700">edit</code> branch. Review AI suggestions like GitHub PRs, then merge approved edits into main.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(() => {
    if (typeof window === "undefined") return "dashboard";
    if (
      window.location.search.includes("onboarding=true") ||
      sessionStorage.getItem("inkbase_show_onboarding") === "true"
    ) {
      return "bonjour";
    }
    return "dashboard";
  });

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
        <DashboardMain projects={MOCK_PROJECTS} />
      </motion.div>

      {/* Bonjour splash */}
      <AnimatePresence>
        {screen === "bonjour" && <Bonjour onFinished={handleBonjourFinished} />}
      </AnimatePresence>

      {/* Onboarding overlay */}
      <AnimatePresence>
        {screen === "onboarding" && <OnboardingOverlay onClose={handleOnboardingClose} />}
      </AnimatePresence>
    </div>
  );
}
