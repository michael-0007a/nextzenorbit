export function PageLoading() {
  return <div role="status" aria-label="Loading page" className="mx-auto w-full max-w-6xl space-y-6 p-6">
    <span className="sr-only">Loading page…</span>
    <div className="h-9 w-56 animate-pulse rounded-xl bg-muted" />
    <div className="h-5 w-80 max-w-full animate-pulse rounded-lg bg-muted" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0,1,2].map(i => <div key={i} className="h-40 animate-pulse rounded-2xl border border-border bg-surface" />)}</div>
  </div>;
}
