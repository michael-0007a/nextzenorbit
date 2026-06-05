"use client";

import { useMemo, useState } from "react";
import type { Career } from "@/types/domain";
import { careerCategoryBySlug } from "@/features/career/metadata";

export type CareerFilterState = {
  query: string;
  category: string;
};

export function useCareerFilter(careers: Career[], initialQuery = "") {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return careers.filter((career) => {
      const matchesQuery = normalizedQuery
        ? career.title.toLowerCase().includes(normalizedQuery) ||
          career.description?.toLowerCase().includes(normalizedQuery)
        : true;

      const categoryLabel = careerCategoryBySlug[career.slug] ?? "Other";
      const matchesCategory = category === "All" || categoryLabel === category;

      return matchesQuery && matchesCategory;
    });
  }, [careers, category, query]);

  return {
    query,
    setQuery,
    category,
    setCategory,
    filtered,
  };
}
