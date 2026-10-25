# UI patterns: Nextzen Orbit design system (main)

Last reviewed from code: 2026-10-16. Source of truth: `src/app/globals.css` (tokens), `src/components/ui/*` (primitives) and `src/components/providers/providers.tsx` (theme).

The early "Yeldra" black-and-white system with five mint/granite colors (March 2026) has been **replaced**. The current system is a dark-first glass UI with a red primary and a cyan accent.

## Theme

- `next-themes` with `defaultTheme="dark"` and `enableSystem={false}`. Users switch with `theme-toggle.tsx`.
- Tailwind v4 reads `.dark` through `@custom-variant dark (&:where(.dark, .dark *))`.
- Fonts (`next/font/google`): **Sora** for body (`--font-sans`) and **Space Grotesk** for display (`--font-display`).

## Color tokens

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#F7F8FB` | `#0A0A0F` | Page |
| `--foreground` | `#10121A` | `#F5F7FA` | Text |
| `--surface` | `#FFFFFF` | `#111118` | Cards, panels |
| `--surface-elevated` | `#F1F3F8` | `#171721` | Modals, popovers |
| `--card` / `--card-hover` | `#FFFFFF` / `#F5F7FB` | `#171721` / `#1D1D2A` | Card states |
| `--border` / `--border-hover` | slate 12% / 20% | white 8% / 16% | Hairlines |
| `--muted-foreground`, `--text-secondary` | `#5B667A` | `#A7B0C0` | Secondary text |
| `--ring` | red 25% | pink 35% | Focus ring |

Brand colors (theme-independent, in `@theme`):

| Token | Value |
| --- | --- |
| `--color-primary` | `#FF003D` (hover `#E00035`, light `#FF2B6A`) |
| `--color-primary-muted` / `-border` | red at 12% / 35% |
| `--color-accent` | `#00D1FF` (hover `#00B6E0`, muted 16%) |
| Glows `--glow-1..3` | Red, violet `#7C3AED` and cyan, at low alpha, for background glows |

Use tokens (`bg-surface`, `text-muted-foreground`, `border-border`, `text-primary`), never raw hex in components.

## Surfaces

- `.glass-card`: on main a translucent `--glass-strong` fill with an 18px `backdrop-filter` blur, a 1px `--border` and `--glass-card-shadow`. Beta replaces the blur with a solid 96% surface because the blur made scrolling janky.
- Corners are generous: cards use `rounded-3xl`, buttons `rounded-xl`, and avatars and pills `rounded-full`.

## Primitives (`src/components/ui`)

| Component | Notes |
| --- | --- |
| `button.tsx` | Variants `primary` (red), `secondary`, `ghost`, `destructive`; sizes; `isLoading` state |
| `card.tsx` | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardBody`, `CardFooter` |
| `input.tsx`, `textarea.tsx` | Label, error and helper text |
| `badge.tsx` | Status pills |
| `modal.tsx`, `sheet.tsx` | Dialog and side sheet |
| `skeleton.tsx` | Loading placeholders, used by the `loading.tsx` boundaries |
| `pagination.tsx` | Table paging |
| `avatar.tsx` | Google avatar or initials |
| `notification-banner.tsx`, `profile-completion-banner.tsx` | In-app banners |
| `ai-progress.tsx` | Stage-aware AI progress bar with an estimated time left (`src/lib/ai/progress.ts`) |
| `theme-toggle.tsx`, `use-toast.ts` | Theme switch; `sonner` toasts are preferred |

`cn()` (`src/lib/utils.ts`, clsx + tailwind-merge) composes class names. Icons come from `lucide-react`. Motion presets are in `src/lib/animations/presets.ts` (Framer Motion).

## Layout

- **Client app:** `src/app/(dashboard)/layout.tsx` with `sidebar.tsx` and `top-nav.tsx` (notifications, theme, avatar menu; the search box is a UI shell). `page-header.tsx` provides page titles.
- **Admin:** `src/app/(admin)/layout.tsx` with `admin-shell.tsx` and `admin-sidebar.tsx`. The sidebar items depend on the role.
- **Loading:** `loading.tsx` boundaries at the root, dashboard and admin levels, plus `page-loading.tsx`. Beta turns on hover prefetch (`dynamicOnHover`).

## Motion

| Duration | Use |
| --- | --- |
| 100–150 ms | Hover and press |
| 200 ms | Dropdowns, modals |
| 300 ms | Page-level transitions |

## Accessibility

- Visible focus ring (`--ring`) on every interactive element.
- Sufficient contrast for body text in both themes. Check new colors against `--background` and `--surface`.
- Keyboard-operable menus, modals and the Kanban board (with a table fallback).
