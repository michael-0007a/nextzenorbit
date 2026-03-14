"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { overlayVariants, modalVariants } from "@/lib/animations";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  /** Max width class (default: max-w-lg) */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Whether clicking the overlay closes the modal */
  closeOnOverlayClick?: boolean;
  className?: string;
}

const modalSizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-3xl",
};

/**
 * Modal dialog with backdrop blur, focus trap, and Escape key handling.
 *
 * @example
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
 *   <p>Are you sure?</p>
 * </Modal>
 */
export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  size = "lg",
  closeOnOverlayClick = true,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Store previous focus & restore on close
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus the modal after animation
      const timer = setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [open]);

  // Escape key handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-surface-overlay backdrop-blur-sm"
            onClick={closeOnOverlayClick ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Modal content */}
          <motion.div
            ref={modalRef}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            aria-describedby={description ? "modal-description" : undefined}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
            className={cn(
              "relative z-10 w-full rounded-sm border border-granite bg-surface-elevated",
              "focus:outline-none",
              "max-h-[90vh] flex flex-col",
              modalSizes[size],
              className
            )}
          >
            {/* Header */}
            {(title || true) && (
              <div className="flex items-center justify-between border-b border-granite p-6 pb-4 shrink-0">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-foreground">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p
                      id="modal-description"
                      className="mt-1 text-sm text-text-secondary"
                    >
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
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

