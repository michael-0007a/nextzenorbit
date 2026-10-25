import type { LucideIcon } from "lucide-react";

export interface FeatureHeroProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** Shows the pulsing "AI Powered" pill used on the analyzer page. */
  ai?: boolean;
  children?: React.ReactNode;
}

/** Hero header in the style of the Resumes and Job Analyzer pages. */
export function FeatureHero({ title, description, icon: Icon, ai, children }: FeatureHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/80 p-6">
      <div className="absolute inset-0 bg-space opacity-50" />
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-5 w-1 rounded-full bg-primary sm:hidden" />
              <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
            </div>
            <p className="text-text-secondary max-w-xl">{description}</p>
          </div>
        </div>
        {(ai || children) && (
          <div className="flex flex-wrap items-center gap-2 sm:flex-none">
            {children}
            {ai && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">AI Powered</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
