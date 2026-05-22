"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = ["light", "dark"] as const;
const themeIcons = { light: Sun, dark: Moon };
const themeLabels = { light: "Light mode", dark: "Dark mode" };

export interface ThemeToggleProps { className?: string; }

/**
 * Theme toggle button cycling through light → dark → system.
 * Animated icon swap with Framer Motion.
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
  const Icon = themeIcons[currentTheme];

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className={btnClass}
      aria-label={`Current: ${themeLabels[currentTheme]}. Switch to ${themeLabels[nextTheme]}`}
      title={themeLabels[currentTheme]}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={currentTheme}
          initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.15 }}
        >
          <Icon className="h-4 w-4" />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
