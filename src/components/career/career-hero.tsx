"use client";

import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Career } from "@/types/domain";
import { getCareerIcon } from "@/features/career/icons";

export interface CareerHeroProps {
  career: Career;
  stats?: {
    steps: number;
    questions: number;
    resources: number;
  };
}

export function CareerHero({ career, stats }: CareerHeroProps) {
  const Icon = getCareerIcon(career.icon ?? undefined);
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-surface/40 p-8 sm:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,0,61,0.12),transparent_60%)]" />
      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <Badge variant="primary">Career Track</Badge>
        </div>

        <div>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            {career.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary sm:text-base">
            {career.description ?? ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
          <div className="rounded-full border border-border/60 bg-white/5 px-4 py-2">
            {stats?.steps ?? 0} roadmap steps
          </div>
          <div className="rounded-full border border-border/60 bg-white/5 px-4 py-2">
            {stats?.questions ?? 0} interview questions
          </div>
          <div className="rounded-full border border-border/60 bg-white/5 px-4 py-2">
            {stats?.resources ?? 0} learning resources
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button size="md" onClick={() => scrollTo("roadmap")}
          >
            View roadmap
          </Button>
          <Button
            variant="secondary"
            size="md"
            rightIcon={<ArrowUpRight className="h-4 w-4" />}
            onClick={() => scrollTo("resources")}
          >
            Explore resources
          </Button>
        </div>
      </div>
    </section>
  );
}
