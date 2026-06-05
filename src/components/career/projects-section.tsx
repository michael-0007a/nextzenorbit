import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { SectionHeader } from "@/components/career/section-header";
import type { Project } from "@/types/domain";

export interface ProjectsSectionProps {
  projects: Project[];
  isAuthenticated: boolean;
}

export function ProjectsSection({ projects, isAuthenticated }: ProjectsSectionProps) {
  return (
    <section id="projects" className="space-y-6">
      <SectionHeader
        title="Recommended projects"
        description="Showcase hands-on work that aligns with this career track."
        action={
          isAuthenticated ? (
            <Link href="/profile" className="text-sm font-semibold text-primary">
              Add a project
            </Link>
          ) : undefined
        }
      />

      {!isAuthenticated ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-white/5 p-10 text-center">
          <p className="text-sm text-text-secondary">
            Sign in to attach projects and get recommendations.
          </p>
          <Link href="/login" className="mt-3 inline-flex text-sm font-semibold text-primary">
            Sign in
          </Link>
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-white/5 p-10 text-center">
          <p className="text-sm text-text-secondary">
            Add projects to surface personalized recommendations.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id} className="border border-border/60 bg-surface/40">
              <CardBody className="space-y-2">
                <h3 className="text-base font-semibold text-foreground">
                  {project.title}
                </h3>
                <p className="text-sm text-text-secondary">
                  {project.description || "No description provided."}
                </p>
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-primary"
                  >
                    View repository
                  </a>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
