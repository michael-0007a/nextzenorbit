"use client";

export function ResumeLengthSelector({ value, onChange }: { value: number | null; onChange: (pages: number | null) => void }) {
  return <div className="space-y-1">
    <label className="flex flex-wrap items-center gap-2 text-sm font-medium">
      Resume length
      <select aria-label="Resume length" className="rounded-md border border-border bg-surface px-3 py-2" value={value === null ? "auto" : value > 2 ? "custom" : String(value)}
        onChange={e => onChange(e.target.value === "auto" ? null : e.target.value === "custom" ? 3 : Number(e.target.value))}>
        <option value="auto">Auto — keep all details</option><option value="1">1 page</option><option value="2">2 pages</option><option value="custom">Custom length</option>
      </select>
      {value !== null && value > 2 && <input aria-label="Custom page count" type="number" min={3} max={10} value={value}
        className="w-20 rounded-md border border-border bg-surface px-2 py-2" onChange={e => {
          const pages = Number(e.target.value); if (Number.isInteger(pages) && pages >= 3 && pages <= 10) onChange(pages);
        }} />}
    </label>
    <p className="text-xs text-text-secondary">AI generation tailors detail to this length. Changing it alone adjusts layout; it never deletes content. Review the preview before exporting.</p>
  </div>;
}
