import type { DocumentItem } from "./types";

export const DOCUMENTS: DocumentItem[] = [
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

export const FREE_TIER_MAX = 3;
