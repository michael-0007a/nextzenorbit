import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  /** Actions slot (e.g., buttons) */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent page header with title, description, and action slots.
 * Server component — no client interactivity needed.
 *
 * @example
 * <PageHeader
 *   title="My Resumes"
 *   description="Create and manage your tailored resumes."
 *   actions={<Button>New Resume</Button>}
 * />
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}

