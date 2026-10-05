"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = ["light", "dark"] as const;
const themeLabels = { light: "Light mode", dark: "Dark mode" };

export interface ThemeToggleProps { className?: string; }

/**
 * Theme toggle button cycling through light and dark.
 * CSS transitions keep this shared control independent of an animation runtime.
 *
 * @example
 * <ThemeToggle />
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Required to avoid hydration mismatch with next-themes
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!theme || !themes.includes(theme as (typeof themes)[number])) {
      setTheme("light");
    }
  }, [theme, setTheme]);

  const btnClass = cn(
    "inline-flex h-10 w-10 items-center justify-center rounded-full",
    "border border-border bg-surface/70 text-text-secondary",
    "hover:text-foreground hover:border-primary/40 hover:bg-surface",
    "transition-all duration-200",
    className
  );

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <button className={btnClass} aria-label="Toggle theme">
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  const preferredTheme = (resolvedTheme ?? theme) as (typeof themes)[number] | undefined;
  const currentTheme = themes.includes(preferredTheme ?? "light")
    ? (preferredTheme as (typeof themes)[number])
    : "light";
  const currentIndex = themes.indexOf(currentTheme);
  const nextTheme = themes[(currentIndex + 1) % themes.length];

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className={btnClass}
      aria-label={`Current: ${themeLabels[currentTheme]}. Switch to ${themeLabels[nextTheme]}`}
      title={themeLabels[currentTheme]}
    >
      <span className="relative block h-4 w-4" aria-hidden="true">
        <Sun className={cn("absolute inset-0 h-4 w-4 transition-all duration-150 motion-reduce:transition-none", currentTheme === "light" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-50 opacity-0")} />
        <Moon className={cn("absolute inset-0 h-4 w-4 transition-all duration-150 motion-reduce:transition-none", currentTheme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0")} />
      </span>
    </button>
  );
}
