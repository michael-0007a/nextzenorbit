"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Toaster } from "sonner";
import { SessionLogout } from "@/components/layout/session-logout";

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
      defaultTheme="dark"
      themes={["light", "dark"]}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
      <SessionLogout />
      <Toaster
        position="bottom-right"
        offset={{ bottom: 88, right: 16 }}
        mobileOffset={{ bottom: 88, right: 16, left: 16 }}
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

