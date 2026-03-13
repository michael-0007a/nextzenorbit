import type { Variants, Transition } from "framer-motion";

/**
 * JobSearch AI — Framer Motion Animation Presets
 *
 * Easing curves per Guidelines:
 * - Enter: cubic-bezier(0.16, 1, 0.3, 1) — spring-like overshoot
 * - Exit: cubic-bezier(0.4, 0, 1, 1) — fast exit
 * - Hover: cubic-bezier(0.4, 0, 0.2, 1) — smooth
 *
 * Duration scale: 100ms (micro) → 500ms (page transitions)
 */

type CubicBezier = [number, number, number, number];

// === Easing Curves ===
export const easings = {
  enter: [0.16, 1, 0.3, 1] as CubicBezier,
  exit: [0.4, 0, 1, 1] as CubicBezier,
  hover: [0.4, 0, 0.2, 1] as CubicBezier,
  spring: { type: "spring", stiffness: 400, damping: 30 } as const,
  springGentle: { type: "spring", stiffness: 300, damping: 25 } as const,
};

// === Duration Scale ===
export const durations = {
  micro: 0.1,
  fast: 0.15,
  normal: 0.3,
  slow: 0.4,
  page: 0.5,
};

// === Transition Presets ===
export const transitions: Record<string, Transition> = {
  enter: {
    duration: durations.normal,
    ease: easings.enter,
  },
  exit: {
    duration: durations.fast,
    ease: easings.exit,
  },
  spring: easings.spring,
  springGentle: easings.springGentle,
};

// === Variant Presets ===

/** Fade in from transparent */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.enter,
  },
  exit: {
    opacity: 0,
    transition: transitions.exit,
  },
};

/** Slide up from below with fade */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.enter,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: transitions.exit,
  },
};

/** Slide down from above with fade */
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.enter,
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: transitions.exit,
  },
};

/** Slide in from right with fade */
export const slideRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.enter,
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: transitions.exit,
  },
};

/** Slide in from left with fade */
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: transitions.enter,
  },
  exit: {
    opacity: 0,
    x: -24,
    transition: transitions.exit,
  },
};

/** Scale in from slightly smaller */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.enter,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.exit,
  },
};

/** Stagger children animations */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

/** Stagger item — use as child of staggerContainer */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.enter,
  },
};

/** Page transition wrapper */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: durations.page,
      ease: easings.enter,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: durations.fast,
      ease: easings.exit,
    },
  },
};

/** Modal overlay backdrop */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: durations.fast },
  },
  exit: {
    opacity: 0,
    transition: { duration: durations.fast },
  },
};

/** Modal content */
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: transitions.exit,
  },
};

/** Sheet from right (desktop) */
export const sheetRightVariants: Variants = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: transitions.spring,
  },
  exit: {
    x: "100%",
    transition: transitions.exit,
  },
};

/** Sheet from bottom (mobile) */
export const sheetBottomVariants: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: transitions.spring,
  },
  exit: {
    y: "100%",
    transition: transitions.exit,
  },
};

// === Hover/Tap Presets ===
export const hoverScale = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: easings.spring,
};

export const hoverLift = {
  whileHover: { y: -2 },
  whileTap: { y: 0 },
  transition: easings.spring,
};

export const tapScale = {
  whileTap: { scale: 0.97 },
  transition: easings.spring,
};




