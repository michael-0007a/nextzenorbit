"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { tapScale } from "@/lib/animations";

// === Variant & Size Definitions ===
const buttonVariants = {
  primary:
    "bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-lg hover:shadow-primary/25 active:opacity-90",
  secondary:
    "bg-transparent border-2 border-border text-foreground hover:border-primary hover:text-primary active:opacity-80",
  ghost:
    "bg-transparent text-foreground hover:bg-muted active:opacity-80",
  destructive:
    "bg-error text-white hover:bg-error/90 hover:shadow-lg hover:shadow-error/25 active:opacity-90",
};

const buttonSizes = {
  sm: "h-9 px-4 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2.5 rounded-xl",
};

// === Types ===
export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Button component with gradient primary, loading states, and motion.
 *
 * @example
 * <Button variant="primary" size="md" isLoading={saving}>
 *   Save Resume
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? undefined : tapScale.whileTap}
        transition={tapScale.transition}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-medium",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-40",
          // Variant & size
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

