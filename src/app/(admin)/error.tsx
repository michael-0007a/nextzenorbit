"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-2xl border border-border p-6"><h1 className="text-lg font-semibold">This page couldn’t load</h1><p className="mt-2 text-text-secondary">Please retry. Your saved work is still available.</p><button onClick={reset} className="mt-4 rounded-lg border border-border px-4 py-2">Retry</button></div>;
}
