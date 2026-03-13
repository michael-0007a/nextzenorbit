"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers wrapper.
 * Wraps the app with theme provider and toast notifications.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          className:
            "!bg-background !text-foreground !border !border-granite !shadow-md",
        }}
        richColors
        closeButton
      />
    </NextThemesProvider>
  );
}

