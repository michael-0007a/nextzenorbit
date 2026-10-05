/** Timings contain stage names and durations only, never document or account data. */
export function createTimings() {
  const started = performance.now();
  const stages: { name: string; duration: number }[] = [];
  return {
    async measure<T>(name: string, run: () => PromiseLike<T>): Promise<T> {
      const start = performance.now();
      try { return await run(); }
      finally { stages.push({ name: name.replace(/[^a-zA-Z0-9_-]/g, ""), duration: performance.now() - start }); }
    },
    headers(): Record<string, string> {
      return { "Server-Timing": [...stages, { name: "total", duration: performance.now() - started }]
        .map(stage => `${stage.name};dur=${stage.duration.toFixed(1)}`).join(", ") };
    },
  };
}
