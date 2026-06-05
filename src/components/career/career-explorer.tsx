"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Career } from "@/types/domain";
import { CareerCard } from "@/components/career/career-card";
import { useCareerFilter } from "@/hooks/use-career-filter";
import { careerCategoryBySlug } from "@/features/career/metadata";

export interface CareerExplorerProps {
  careers: Career[];
  initialQuery?: string;
}

export function CareerExplorer({ careers, initialQuery = "" }: CareerExplorerProps) {
  const { query, setQuery, category, setCategory, filtered } = useCareerFilter(
    careers,
    initialQuery
  );

  const categories = [
    "All",
    ...Array.from(
      new Set(
        careers.map((career) => careerCategoryBySlug[career.slug] ?? "Other")
      )
    ),
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search careers, skills, or focus areas"
          leftAddon={<Search className="h-4 w-4" />}
        />
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={
                item === category
                  ? "rounded-full border border-primary/40 bg-primary/15 px-4 py-2 text-xs font-semibold text-primary"
                  : "rounded-full border border-border/70 bg-white/5 px-4 py-2 text-xs font-semibold text-text-secondary hover:border-primary/30 hover:text-foreground"
              }
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-text-secondary">
        <span>{filtered.length} career paths available</span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-white/5 p-10 text-center">
          <h3 className="text-lg font-semibold text-foreground">No careers found</h3>
          <p className="mt-2 text-sm text-text-secondary">
            Try another keyword or reset your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((career) => (
            <CareerCard key={career.id} career={career} />
          ))}
        </div>
      )}
    </div>
  );
}
