import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { SectionHeader } from "@/components/career/section-header";
import type { YoutubeResource } from "@/types/domain";

export interface ResourcesSectionProps {
  resources: YoutubeResource[];
}

export function ResourcesSection({ resources }: ResourcesSectionProps) {
  return (
    <section id="resources" className="space-y-6">
      <SectionHeader
        title="YouTube resources"
        description="Curated videos and channels to accelerate learning."
      />

      {resources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-white/5 p-10 text-center">
          <p className="text-sm text-text-secondary">
            Resources will appear here once curated.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((resource) => (
            <Card
              key={resource.id}
              className="group border border-border/60 bg-surface/40"
            >
              <CardBody className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-white/5">
                  <img
                    src={resource.thumbnail || "https://placehold.co/640x360?text=Resource"}
                    alt={resource.title}
                    className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {resource.topic && (
                      <Badge variant="info" size="sm">
                        {resource.topic}
                      </Badge>
                    )}
                    {resource.difficulty && (
                      <Badge variant="primary" size="sm">
                        {resource.difficulty}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {resource.title}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {resource.channel}
                  </p>
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  Watch now
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
