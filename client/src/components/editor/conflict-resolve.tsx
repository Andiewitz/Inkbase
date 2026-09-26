"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConflictResolveProps {
  serverUpdatedAt?: string;
  onKeepMine: () => void;
  onTakeServer: () => void;
}

/**
 * Conflict choice banner. Rendered only while a 409 conflict is unresolved.
 * One job: let the author pick which revision survives. Neither revision is
 * discarded until a button is pressed — the local backup stays in
 * localStorage throughout.
 */
export function ConflictResolve({ serverUpdatedAt, onKeepMine, onTakeServer }: ConflictResolveProps) {
  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-2xs"
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-900">
            This document changed elsewhere
          </p>
          <p className="mt-0.5 text-xs text-amber-800">
            Your unsaved edits are preserved below and in this browser. Choose
            which version to keep.
            {serverUpdatedAt ? ` Server revision: ${serverUpdatedAt}.` : ""}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={onKeepMine}
              className="rounded-full bg-[#2C7E86] text-white hover:bg-[#256b72] h-8 px-3.5 text-xs font-semibold"
            >
              Keep my version
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onTakeServer}
              className="rounded-full h-8 px-3.5 text-xs font-semibold"
            >
              Use server version
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
