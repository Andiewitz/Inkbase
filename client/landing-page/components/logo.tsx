import { Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className="text-2xl font-bold tracking-tight text-slate-900"
        style={{ fontFamily: "var(--font-lobster), cursive" }}
      >
        Inkbase
      </span>
      <Sparkles className="h-4 w-4 text-indigo-600 fill-indigo-200" />
    </div>
  );
}
