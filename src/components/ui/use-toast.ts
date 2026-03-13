import { toast as sonnerToast } from "sonner";

/**
 * Toast notification wrapper around Sonner.
 * Provides a consistent API: toast.success(), toast.error(), etc.
 *
 * @example
 * import { toast } from "@/components/ui/use-toast";
 *
 * toast.success("Resume saved successfully!");
 * toast.error("Failed to upload file. Please try again.");
 * toast.warning("Your trial expires in 3 days.");
 * toast.info("Processing your resume...");
 */
export const toast = {
  success: (message: string, options?: { description?: string }) =>
    sonnerToast.success(message, {
      description: options?.description,
      duration: 3000,
    }),

  error: (message: string, options?: { description?: string }) =>
    sonnerToast.error(message, {
      description: options?.description,
      duration: 5000, // Errors stay longer
    }),

  warning: (message: string, options?: { description?: string }) =>
    sonnerToast.warning(message, {
      description: options?.description,
      duration: 4000,
    }),

  info: (message: string, options?: { description?: string }) =>
    sonnerToast.info(message, {
      description: options?.description,
      duration: 3000,
    }),

  loading: (message: string) =>
    sonnerToast.loading(message),

  dismiss: (id?: string | number) =>
    sonnerToast.dismiss(id),

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) =>
    sonnerToast.promise(promise, messages),
};

