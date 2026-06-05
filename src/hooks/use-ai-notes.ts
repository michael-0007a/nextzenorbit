"use client";

import { useCallback, useEffect, useState } from "react";
import type { AiNote } from "@/types/domain";
import { fetchAiNotes } from "@/lib/api";

export function useAiNotes(role?: string, enabled = true) {
  const [notes, setNotes] = useState<AiNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAiNotes(role ? { role } : undefined);
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    void loadNotes();
  }, [enabled, loadNotes]);

  return {
    notes,
    loading,
    error,
    refetch: loadNotes,
  };
}
