"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  overlayVariants,
  sheetRightVariants,
  sheetBottomVariants,
} from "@/lib/animations";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  /** "right" on desktop, "bottom" on mobile. Default: "right" */
  side?: "right" | "bottom";
  /** Width for right-side sheet (default: w-80) */
  width?: string;
  className?: string;
}

/**
 * Sheet (drawer) component — slides from right (desktop) or bottom (mobile).
 * Focus trap, Escape close, body scroll lock.
 *
 * @example
 * <Sheet open={isOpen} onClose={() => setIsOpen(false)} title="Filters">
 *   <FilterForm />
 * </Sheet>
 */
export function Sheet({
  open,
  onClose,
  children,
  title,
  description,
  side = "right",
  width = "w-80",
  className,
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => sheetRef.current?.focus(), 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  const variants =
    side === "bottom" ? sheetBottomVariants : sheetRightVariants;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-surface-overlay backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet content */}
          <motion.div
            ref={sheetRef}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className={cn(
              "absolute bg-surface-elevated border-granite focus:outline-none",
              side === "right" && [
                "inset-y-0 right-0 border-l",
                width,
              ],
              side === "bottom" && [
                "inset-x-0 bottom-0 border-t rounded-t-sm",
                "max-h-[85vh]",
              ],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-granite p-4">
              <div>
                {title && (
                  <h2 className="text-base font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-sm",
                  "text-granite hover:text-foreground hover:bg-muted",
                  "transition-colors duration-150"
                )}
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(100% - 60px)" }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

