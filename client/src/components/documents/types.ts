export interface BranchInfo {
  name: string;
  is_edit?: boolean;
  isEdit?: boolean;
  pending_changes?: number;
  pendingChanges?: number;
}

export type SupportedFormat =
  | "docx"
  | "pdf"
  | "txt"
  | "md"
  | "epub"
  | "rtf"
  | "odt";

export interface DocumentItem {
  id: string;
  user_id?: number;
  title: string;
  content?: string;
  excerpt: string;
  word_count?: number;
  wordCount?: number;
  format?: SupportedFormat | string;
  branch: BranchInfo;
  created_at?: string;
  updated_at?: string;
  lastEdited?: string;
}

export type ViewMode = "grid" | "list";
export type FilterTab = "all" | "in_review" | "drafts";
export type SortBy = "updated_desc" | "title_asc" | "words_desc";

