export interface BranchInfo {
  name: string;
  isEdit: boolean;
  pendingChanges: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  excerpt: string;
  lastEdited: string;
  wordCount: number;
  branch: BranchInfo;
}
