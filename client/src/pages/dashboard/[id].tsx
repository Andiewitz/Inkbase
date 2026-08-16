"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { DocumentItem } from "@/components/documents/types";
import { EditorShell } from "@/components/editor/editor-shell";
import { Button } from "@/components/ui/button";

export default function DocumentEditorPage() {
  const router = useRouter();
  const { id } = router.query;

  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = useCallback(async (docId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch(`/api/documents/${docId}`);

      if (res.status === 401) {
        router.replace("/auth/login");
        return;
      }
      if (res.status === 404) {
        setError("Document not found");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to load document");
        return;
      }

      const data = await res.json();
      setDoc(data.document);
    } catch {
      setError("Network error while connecting to documents service");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (id && typeof id === "string") {
      fetchDocument(id);
    }
  }, [id, fetchDocument]);

  const handleExport = (docId: string, format: string) => {
    window.open(`/api/documents/${docId}/export?format=${format}`, "_blank");
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#E3EDF6]">
        <Loader2 className="h-8 w-8 animate-spin text-[#2C7E86] mb-3" />
        <p className="text-xs font-semibold text-slate-500">Loading manuscript...</p>
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#E3EDF6] p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-sm text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 mx-auto mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-850 mb-2">
            {error || "Document unavailable"}
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            The manuscript you requested could not be found or has been removed.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="rounded-full bg-[#2C7E86] hover:bg-[#22676E] text-white gap-2 font-semibold text-xs px-5 shadow-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Dashboard</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{doc.title ? `${doc.title} — Inkbase Studio` : "Inkbase Manuscript"}</title>
      </Head>
      <EditorShell doc={doc} onExport={handleExport} />
    </>
  );
}
