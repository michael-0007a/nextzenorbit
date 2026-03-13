import { cn } from "@/lib/utils";

// === Variant & Size Definitions ===
const badgeVariants = {
  default: "border-border text-stone bg-muted/50",
  success: "border-success/30 text-success bg-success/10",
  warning: "border-warning/30 text-warning bg-warning/10",
  error: "border-error/30 text-error bg-error/10",
  info: "border-info/30 text-info bg-info/10",
  primary: "border-primary/30 text-primary bg-primary/10",
};

const badgeSizes = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-1 text-xs",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
  size?: keyof typeof badgeSizes;
}

/**
 * Badge component for status indicators and labels.
 */
export function Badge({
  variant = "default",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full border",
        "transition-colors duration-150",
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
