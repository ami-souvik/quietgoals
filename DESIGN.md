---
name: Quiet Goals
description: "A single-list, keyboard-first, unapologetically minimal goals app inspired in feel by rows.gg."
version: "1.0.0"
platforms:
  - web: "Next.js 16 (App Router), Tailwind CSS v4, Framer Motion"
  - mobile: "React Native, Expo, React Native Reanimated"
tokens:
  colors:
    dark:
      bg: "#161518"
      surface: "#1e1d22"
      surface-hover: "#26242c"
      surface-active: "#2b2932"
      border: "rgba(255, 255, 255, 0.08)"
      border-subtle: "rgba(255, 255, 255, 0.04)"
      text-primary: "#f2f2f5"
      text-secondary: "#adaab8"
      text-muted: "#888694"
      gold: "#dfb15b"
      gold-muted: "rgba(223, 177, 91, 0.14)"
      ember: "#e25b39"
      ember-muted: "rgba(226, 91, 57, 0.14)"
    light:
      bg: "#f8f7f9"
      surface: "#ffffff"
      surface-hover: "#f1f0f4"
      surface-active: "#e8e7ec"
      border: "rgba(0, 0, 0, 0.08)"
      border-subtle: "rgba(0, 0, 0, 0.04)"
      text-primary: "#151417"
      text-secondary: "#585560"
      text-muted: "#666370"
      gold: "#a67215"
      gold-muted: "rgba(179, 130, 33, 0.12)"
      ember: "#c94625"
      ember-muted: "rgba(201, 70, 37, 0.12)"
  typography:
    fonts:
      sans: "Host Grotesk, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
      mono: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    weights:
      regular: 400
      medium: 500
      semibold: 600
    scale:
      xs: "11px / 1.2"
      sm: "13px / 1.3"
      base: "14px / 1.4"
      lg: "16px / 1.4"
      xl: "20px / 1.3"
  radii:
    sm: "4px"
    md: "6px"
    lg: "8px"
    full: "9999px"
  motion:
    spring:
      stiffness: 400
      damping: 30
      mass: 0.8
    fadeDuration: 150
---

# Quiet Goals Design System

> A single-list, keyboard-first, unapologetically minimal goals app, inspired in *feel* by rows.gg.

This document defines the formal design contract for **Quiet Goals**, serving both the Next.js Web application and the React Native Mobile application (`native/`). Both platforms share the exact same aesthetic, behavioral invariants, and interaction physics.

---

## 1. Product Philosophy & Design Tenets

1. **Unapologetic Minimalism:** One screen, one list. No dashboards, no analytics charts, no streaks, no notifications, and no AI chatbots.
2. **Physical Feel:** Interactions must feel tactile and responsive. Updates are optimistic (0ms perceived latency). Rows compress and spring open. Dragged items settle with spring overshoot.
3. **Keyboard & Touch Parity:** Every operation on Web is reachable without touching the mouse (`n`, `k`/`j`, `1`-`3`, `c`, `x`, `?`). On Mobile, natural touch gestures (drag handles, swipe actions, haptic ticks) provide equivalent speed.
4. **Soft Permanence:** Items are never destroyed without deliberate intent. Completing or killing a goal softly archives it. Permanent destruction requires an explicit two-step confirmation.

---

## 2. Color Palette & Semantic Roles

| Role | CSS Token | Dark Value | Light Value | Usage Rationale |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | `--color-bg` | `#161518` | `#f8f7f9` | Deep charcoal / warm off-white canvas preventing eye strain. |
| **Surface** | `--color-surface` | `#1e1d22` | `#ffffff` | Primary container background for rows, modals, and sheets. |
| **Surface Hover** | `--color-surface-hover` | `#26242c` | `#f1f0f4` | Subtle elevation on mouse hover or touch tap highlight. |
| **Surface Active** | `--color-surface-active` | `#2b2932` | `#e8e7ec` | Pressed button or focused row state. |
| **Border** | `--color-border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` | Structural hairline divider separating list items and panels. |
| **Subtle Border** | `--color-border-subtle` | `rgba(255,255,255,0.04)` | `rgba(0,0,0,0.04)` | Secondary dividers and non-critical element boundaries. |
| **Primary Text** | `--color-text-primary` | `#f2f2f5` | `#151417` | High-contrast readable copy for goal titles and headings. |
| **Secondary Text** | `--color-text-secondary` | `#adaab8` | `#585560` | Metadata, badges, and secondary affordances. |
| **Muted Text** | `--color-text-muted` | `#888694` | `#666370` | Timestamps, index numbers, placeholder copy, keyboard shortcuts. |
| **Accent Gold** | `--color-gold` | `#dfb15b` | `#a67215` | Achievement color: completed goals, active focus rings, celebration sparks. |
| **Gold Muted** | `--color-gold-muted` | `rgba(223,177,91,0.14)` | `rgba(179,130,33,0.12)` | Subtle highlight backgrounds and active focus glows. |
| **Accent Ember** | `--color-ember` | `#e25b39` | `#c94625` | Abandonment / danger color: killed goals, offline warning dots, destructive confirm. |
| **Ember Muted** | `--color-ember-muted` | `rgba(226,91,57,0.14)` | `rgba(201,70,37,0.12)` | Tinted background for killed goals and offline status pill. |

---

## 3. Typography System

The typography pairs an engineered, geometric sans-serif for content with a crisp monospace font for numbers, hotkeys, and data counters.

- **Primary Font:** `Host Grotesk`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`
- **Monospace Font:** `Geist Mono`, `ui-monospace`, `monospace` (used with `font-variant-numeric: tabular-nums`)

### Type Scale

| Name | Size | Line Height | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Heading** | `20px` (`text-xl`) | `1.3` | Medium (500) | `-0.02em` | Wordmark / title in header |
| **Body (Goal Title)**| `14px` (`text-sm`) | `1.4` | Regular (400) | `normal` | Goal titles and input fields |
| **Mono Index** | `12px` (`text-xs`) | `1.0` | Regular (400) | `tabular-nums` | `01`, `02` row position numbers |
| **Label / Badge** | `11px` (`text-[11px]`) | `1.2` | Medium (500) | `+0.04em` | Category badges, shortcuts, timestamps |
| **Hotkeys (`<kbd>`)**| `10px` (`text-[10px]`) | `1.0` | Regular (400) | `mono` | Keyboard shortcut tags (`↵`, `esc`, `?`) |

---

## 4. Spacing, Radii & Layout Architecture

### Single-Column Center Layout
- **Max Width:** `580px` (`max-w-[580px]`)
- **Horizontal Padding:** `px-4` (Mobile: `16px`, Desktop: `16px`)
- **Vertical Spacing:** Generous whitespace around the header and list (`py-12` Desktop, `py-8` Mobile)

### Radii Scale
- **`rounded-sm` (4px):** Shortcut keys (`<kbd>`), priority dots.
- **`rounded-md` (6px):** Action icon buttons (Complete, Kill, Restore).
- **`rounded-lg` (8px):** Goal rows, inputs, modal dialogs.
- **`rounded-full` (9999px):** Status badges, avatar pills, offline status dots.

---

## 5. Motion, Physics & Micro-Interactions

Interactions must mimic real-world mass and tension. No linear or robotic easing curves.

### Spring Parameters (Framer Motion / Reanimated)
```ts
export const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};
```

### Exit Animations
1. **Complete:**
   - A bright golden "fuse" line sweeps left $\rightarrow$ right across the row (~400ms).
   - Upon reaching the right edge, the row emits a burst of 16–24 small golden particles (`#dfb15b`).
   - The row softly collapses its height to 0 with spring overshoot while neighbors close the gap.
2. **Kill:**
   - Row immediately tints into carbon/ember (`#e25b39`).
   - Row shakes subtly horizontally ($\pm 3\text{px}$) once, drops $4\text{px}$, fades opacity, and collapses to 0.

### Reduced Motion Support
When `prefers-reduced-motion: reduce` is active, particle bursts and sweeps are bypassed in favor of a clean 150ms opacity fade and height collapse.

---

## 6. Component Specifications

### 1. GoalRow
- **Height:** `52px` fixed row height.
- **Left Slot:** Two-digit tabular index number (`01`, `02`, `03` in `--color-text-muted`).
- **Center Slot:** Goal title. Click or press `Enter`/`e` switches into inline `<input>`. `Enter` saves, `Escape` reverts without layout shift.
- **Right Slot:** Priority Indicator + subtle Complete (`c`) & Kill (`x`) action icons. On desktop, hover reveals action buttons; on touch/mobile, actions stay accessible at low opacity.
- **Focus Ring:** When active via keyboard navigation, displays a crisp `ring-1.5 ring-gold/70` with soft elevation glow.

### 2. PriorityIndicator
- Clicking cycles: `none` $\rightarrow$ `low` $\rightarrow$ `medium` $\rightarrow$ `high` $\rightarrow$ `none`.
- **None:** Subtle muted circle.
- **Low:** 1 vertical bar (muted accent).
- **Medium:** 2 vertical bars (warm gold).
- **High:** 3 vertical bars (vibrant gold).

### 3. Archive System
- Header displays `Active N · Archive M`.
- Clicking Archive swaps the view in-place with a soft cross-fade (`duration: 0.15s`).
- Archive rows feature a **Restore** button (`r`) and a **Delete Forever** button with an inline 2-second confirmation window (`"press again to confirm"`), avoiding jarring modal popups.

### 4. Sound Feedback (Procedural Web Audio)
- Zero asset files or network requests: generated procedurally via oscillators and white-noise gain envelopes.
- Defaults to **Off**. Remembers preference via both `localStorage` and a server cookie.
- Sounds: `create`, `keyTick`, `save`, `priority`, `complete` (rising chime), `kill` (low thud), `restore`.

---

## 7. Multi-Platform Sync (Web & Mobile)

The codebase at `/` (Next.js) and `/native` (React Native / Expo) represent the **exact same product**:
- **Design Tokens:** Hex codes and semantic color names in `src/app/globals.css` and `native/lib/theme.ts` must match byte-for-byte.
- **Data Model:** `Goal` attributes (`id`, `title`, `status`, `priority`, `position`, `updatedAt`, `archivedAt`) are identical.
- **Ordering Algorithm:** Both platforms use `fractional-indexing` with ASCII binary collation (`a < b ? -1 : 1`).
- **Gesture Equivalents:** Keyboard shortcuts on Web map to intuitive touch gestures on Mobile (swipe right to complete, swipe left to kill, drag to reorder).

---

## 8. AI Agent Directives

When generating or modifying UI components for Quiet Goals:
1. **Never introduce dashboards, charts, streaks, or gamification.**
2. **Never add third-party icon libraries.** Use minimal, inline SVG icons with `strokeWidth={2}`.
3. **Always use semantic color tokens** (`--color-surface`, `--color-gold`, etc.) rather than ad-hoc hex values or generic Tailwind colors (like `blue-500` or `red-500`).
4. **Ensure optimistic updates** for all user actions; never show loading spinners on goal actions.
5. **Always respect `prefers-reduced-motion`** and the user's sound preference.
