import { cn } from "@/lib/utils";

// === Shape Definitions ===
const skeletonShapes = {
  text: "h-4 w-full rounded-sm",
  heading: "h-6 w-3/4 rounded-sm",
  circle: "rounded-full",
  rect: "rounded-sm",
  card: "h-48 w-full rounded-sm",
  avatar: "h-10 w-10 rounded-full",
  button: "h-10 w-24 rounded-sm",
};

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shape?: keyof typeof skeletonShapes;
  /** Width override (e.g., "w-32", "w-full") */
  width?: string;
  /** Height override (e.g., "h-8", "h-20") */
  height?: string;
}

/**
 * Skeleton loading placeholder with shimmer animation.
 * Server component — no "use client" needed.
 *
 * @example
 * <Skeleton shape="text" />
 * <Skeleton shape="avatar" />
 * <Skeleton shape="card" />
 * <Skeleton width="w-48" height="h-6" />
 */
export function Skeleton({
  shape = "text",
  width,
  height,
  className,
  ...props
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading..."
      className={cn(
        "animate-shimmer bg-linear-to-r from-muted via-border/20 to-muted bg-[length:200%_100%]",
        skeletonShapes[shape],
        width,
        height,
        className
      )}
      {...props}
    />
  );
}

/**
 * Pre-built skeleton group for common patterns.
 */
export function SkeletonCard() {
  return (
    <div className="rounded-sm border border-granite p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton shape="avatar" />
        <div className="flex-1 space-y-2">
          <Skeleton shape="heading" width="w-1/2" />
          <Skeleton shape="text" width="w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton shape="text" />
        <Skeleton shape="text" />
        <Skeleton shape="text" width="w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton shape="avatar" />
          <div className="flex-1 space-y-1.5">
            <Skeleton shape="text" width="w-3/4" />
            <Skeleton shape="text" width="w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
