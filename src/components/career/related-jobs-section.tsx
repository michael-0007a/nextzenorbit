import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { SectionHeader } from "@/components/career/section-header";
import type { Job } from "@/types/domain/jobs";

export interface RelatedJobsSectionProps {
  jobs: Job[];
}

export function RelatedJobsSection({ jobs }: RelatedJobsSectionProps) {
  return (
    <section id="jobs" className="space-y-6">
      <SectionHeader
        title="Related jobs"
        description="Live opportunities aggregated from job sources."
        action={
          <Link
            href="/job-search"
            className="text-sm font-semibold text-primary"
          >
            Open job search
          </Link>
        }
      />

      {jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-white/5 p-10 text-center">
          <p className="text-sm text-text-secondary">
            No related jobs yet. Try job search to find live openings.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id} className="border border-border/60 bg-surface/40">
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{job.title}</p>
                    <p className="text-xs text-text-secondary">{job.company}</p>
                  </div>
                  <Badge variant="info" size="sm">
                    {job.source}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary">{job.location || "Remote"}</p>
                {job.apply_url ? (
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                  >
                    View role
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ) : (
                  <p className="text-xs text-text-secondary">
                    Apply link not available.
                  </p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
