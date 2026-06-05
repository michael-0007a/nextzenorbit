"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Career } from "@/types/domain";
import { careerCategoryBySlug } from "@/features/career/metadata";
import { getCareerIcon } from "@/features/career/icons";

export interface CareerCardProps {
  career: Career;
}

export function CareerCard({ career }: CareerCardProps) {
  const category = careerCategoryBySlug[career.slug] ?? "Other";
  const Icon = getCareerIcon(career.icon ?? undefined);

  return (
    <Card className="group relative border border-border/60 bg-surface/40 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40">
      <CardBody className="flex h-full flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <Badge variant="primary" size="sm">
            {category}
          </Badge>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {career.title}
          </h3>
          <p className="mt-2 text-sm text-text-secondary">
            {career.description ?? ""}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between text-sm text-primary">
          <span>Explore roadmap</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>

        <Link
          href={`/career/${career.slug}`}
          className="absolute inset-0"
          aria-label={`Open ${career.title} career page`}
        />
      </CardBody>
    </Card>
  );
}
