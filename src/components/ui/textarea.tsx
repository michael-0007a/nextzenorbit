import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Textarea component with label, error state, and helper text.
 *
 * @example
 * <Textarea
 *   label="Summary"
 *   placeholder="Write a brief professional summary..."
 *   error={errors.summary?.message}
 *   rows={4}
 * />
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const errorId = error ? `${textareaId}-error` : undefined;
    const helperId = helperText ? `${textareaId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "flex min-h-[100px] w-full rounded-2xl border bg-white/5 px-4 py-3 text-sm",
            "text-foreground placeholder:text-text-secondary",
            "transition-colors duration-150 resize-y",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 focus:bg-white/10",
            "disabled:cursor-not-allowed disabled:opacity-40",
            error
              ? "border-error focus:ring-error/40"
              : "border-border hover:border-border-hover",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-error" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-text-secondary">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

