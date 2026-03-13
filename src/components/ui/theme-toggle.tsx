"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = ["light", "dark", "system"] as const;
const themeIcons = { light: Sun, dark: Moon, system: Monitor };
const themeLabels = { light: "Light mode", dark: "Dark mode", system: "System preference" };

export interface ThemeToggleProps { className?: string; }

/**
 * Theme toggle button cycling through light → dark → system.
 * Animated icon swap with Framer Motion.
 *
 * @example
 * <ThemeToggle />
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Required to avoid hydration mismatch with next-themes
  useEffect(() => { setMounted(true); }, []);

  const btnClass = cn(
    "inline-flex h-10 w-10 items-center justify-center rounded-xl",
    "border border-border bg-muted/50 text-stone",
    "hover:text-primary hover:border-primary/50 hover:bg-primary/5",
    "transition-all duration-200",
    className
  );

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <button className={btnClass} aria-label="Toggle theme">
        <Monitor className="h-4 w-4" />
      </button>
    );
  }

  const currentTheme = (theme as (typeof themes)[number]) || "system";
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
