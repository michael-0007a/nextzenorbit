"use client";
import type { Intensity } from "@/lib/ai/prompts/writing-rules";

const OPTIONS: { id: Intensity; title: string; description: string }[] = [
  { id: "conservative", title: "Conservative", description: "Clearer wording and order. Nothing new is added." },
  { id: "moderate", title: "Moderate", description: "Tailored to the job: relevant work first, job terminology, implied skills added." },
  { id: "aggressive", title: "Aggressive", description: "Sells the candidate: strongest verbs, ownership and scope up front, bullets merged. Numbers, tools and titles stay exact." },
];

export function IntensitySelector({ value, onChange, disabled = false }: { value: Intensity; onChange: (value: Intensity) => void; disabled?: boolean }) {
  return <fieldset disabled={disabled} className="space-y-2"><legend className="text-sm font-semibold">Tailoring strength</legend>
    <div className="grid gap-2">{OPTIONS.map(option => <label key={option.id} className={`cursor-pointer rounded-xl border p-3 text-sm ${value === option.id ? "border-primary bg-primary/5" : "border-border"}`}>
      <input type="radio" name="tailoring-intensity" value={option.id} checked={value === option.id} onChange={() => onChange(option.id)} className="mr-2" />
      <strong>{option.title}</strong><span className="mt-1 block text-xs text-text-secondary">{option.description}</span>
    </label>)}</div>
  </fieldset>;
}
