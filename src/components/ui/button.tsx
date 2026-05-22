"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { tapScale } from "@/lib/animations";

// === Variant & Size Definitions ===
const buttonVariants = {
  primary:
    "bg-gradient-to-r from-primary to-primary-light text-white shadow-[0_20px_45px_rgba(255,0,61,0.35)] hover:shadow-[0_25px_55px_rgba(255,0,61,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:opacity-95",
  secondary:
    "bg-white/5 border border-border text-foreground hover:border-primary/40 hover:text-white hover:bg-white/10 active:opacity-90",
  ghost:
    "bg-transparent text-text-secondary hover:text-foreground hover:bg-white/5 active:opacity-90",
  destructive:
    "bg-error text-white hover:bg-error/90 hover:shadow-[0_18px_35px_rgba(239,68,68,0.3)] active:opacity-95",
};

const buttonSizes = {
  sm: "h-9 px-4 text-xs gap-1.5 rounded-xl",
  md: "h-11 px-6 text-sm gap-2 rounded-full",
  lg: "h-12 px-7 text-base gap-2.5 rounded-full",
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
          "inline-flex items-center justify-center font-semibold",
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

