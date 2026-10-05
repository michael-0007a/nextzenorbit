"use client";
import type { PaginationMeta } from "@/types/api";
export function Pagination({ meta, onPage, loading = false }: { meta: PaginationMeta; onPage: (page: number) => void; loading?: boolean }) {
  if (meta.totalPages <= 1) return null;
  return <nav aria-label="Pagination" className="flex items-center justify-between gap-4 py-4 text-sm">
    <button disabled={loading || meta.page <= 1} onClick={() => onPage(meta.page - 1)} className="rounded-lg border border-border px-3 py-2 disabled:opacity-40">Previous</button>
    <span>Page {meta.page} of {meta.totalPages} · {meta.total} total</span>
    <button disabled={loading || meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)} className="rounded-lg border border-border px-3 py-2 disabled:opacity-40">Next</button>
  </nav>;
}
