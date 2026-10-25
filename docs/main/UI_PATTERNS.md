# UI Patterns — Nextzen Orbit Design System

> **Version:** 0.3.0 (Phase 0 — Yeldra Aesthetic Locked)
> **Last Updated:** March 2, 2026
> **Aesthetic Reference:** yeldra.com — pure negative space, architectural precision

---

## Design Philosophy

**Pure black & white. Five accent colors. Negative space does the work.**

- ZERO gradient backgrounds — pure white (#ffffff) or near-black (#1B1B1B)
- Architectural 1px solid borders using Granite (#5b6c5d) for structure
- Sharp corners: `rounded-sm` or `rounded-none` — no bubbly shapes
- Maximum contrast typography — Midnight Violet on white, pure white on black
- Tropical Mint (#56e39f) as the sole electric accent

---

## The 5-Color Palette (MANDATORY — No Deviations)

| Name | Hex | Light Mode Usage | Dark Mode Usage |
|------|-----|-------------------|-----------------|
| **Tropical Mint** | `#56e39f` | Accent, success states | Primary button bg, active states |
| **Mint Leaf** | `#59c9a5` | Hover states | Button hover, link hover |
| **Granite** | `#5b6c5d` | Borders, muted text | Borders, muted text |
| **Shadow Grey** | `#3b2c35` | — | Subdued elements |
| **Midnight Violet** | `#2a1f2d` | Primary text, button bg | Elevated surfaces (cards, modals, sheets) |

### Surface Rules

| Surface | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Page background | `#ffffff` | `#1B1B1B` (near-black) |
| Card / surface | `transparent` | `transparent` |
| Elevated surface | `#ffffff` | `#2a1f2d` (Midnight Violet) |
| Overlay | `rgba(0,0,0,0.5)` | `rgba(0,0,0,0.7)` |

### Typography Colors

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Headings | `#2a1f2d` (Midnight Violet) | `#ffffff` (White) |
| Body text | `#5b6c5d` (Granite) | `#a0a0a0` (Light gray) |
| Muted/helper | `#5b6c5d` (Granite) | `#5b6c5d` (Granite) |
| Accent/code | `#56e39f` (Mint) | `#56e39f` (Mint) |

---

## Structural Rules

### Borders
- Always 1px solid `#5b6c5d` (Granite)
- Hover: border darkens to foreground in light, to Mint Leaf in dark
- No colored borders except Mint for active/focus states

### Border Radius
- `rounded-sm` (4px) — **default for everything**: buttons, cards, inputs, badges
- `rounded-none` — when extra sharpness is needed
- `rounded-full` — avatars only

### Shadows
- Minimal. Prefer border-based separation over shadow-based
- `shadow-md` only on elevated cards
- `shadow-glow` (mint) only on primary buttons in dark mode

---

## Components

### Button (Light → Dark)

| Variant | Light | Dark |
|---------|-------|------|
| Primary | `bg-midnight text-white` | `bg-mint text-midnight` hover: `bg-leaf` |
| Secondary | `border-granite text-foreground` | `border-granite text-foreground` hover: `border-leaf` |
| Ghost | `transparent` hover: `bg-muted` | `transparent` hover: `bg-white/5` |
| Destructive | `bg-error text-white` | `bg-error text-white` |

### Card
- Default: `bg-surface` (transparent) + `border border-granite` + `rounded-sm`
- Elevated: `bg-surface-elevated` (white / Midnight Violet) + `shadow-md`

### Input / Textarea
- `bg-transparent` + `border-granite` + `rounded-sm`
- Focus: `ring-2 ring-ring` (mint glow)
- Placeholder: `text-granite`
- Label: `text-foreground font-medium`

### Badge
- Border-only style: `border-{color} text-{color} rounded-sm`
- No background fills — just border + text color

### Modal / Sheet
- Surface: `bg-background` light / `bg-surface-elevated` dark (Midnight Violet #2a1f2d)
- Border: `border-granite`
- Title: `text-foreground font-semibold`
- Close: `text-granite hover:text-foreground`

### Skeleton
- Shimmer: `from-muted via-border/20 to-muted`
- Shape: `rounded-sm` (avatars get `rounded-full`)

---

## Layout

### Sidebar
- `bg-background` + `border-r border-granite`
- Logo: `bg-midnight` light / `bg-mint` dark
- Active: `text-mint` + `bg-mint-muted border-mint-border`
- Inactive: `text-text-secondary hover:text-foreground`

### TopNav
- `bg-background/80 backdrop-blur-md` + `border-b border-granite`
- Actions: `border-granite text-granite hover:text-foreground`

---

## Animation

| Duration | Use |
|----------|-----|
| 100ms | Hover color changes |
| 150ms | Button press, focus transitions |
| 200ms | Dropdowns, modals entering |
| 300ms | Page transitions, complex state changes |

---

## Accessibility

- Focus ring: `2px solid rgba(86,227,159,0.4)` (mint)
- Selection: `rgba(86,227,159,0.2)`
- All WCAG 2.1 AA contrast ratios met
- Keyboard navigation on all interactive elements

---

*This document is the single source of truth for JobSearch AI's visual identity.*
