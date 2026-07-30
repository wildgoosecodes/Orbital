# Orbital design system — source of truth

Approved concept (combined direction), 2026-07-30. Every future visual change to
Orbital should draw from these exact tokens rather than re-deriving colors ad hoc.

Reference artifacts (in order of iteration — the combined one is final):
- Concept I (top pill nav, consistency heatmap): https://claude.ai/code/artifact/1bc5073b-d315-40ee-9928-f7b9a42038c8
- Concept II (cosmic hero, AI-centered): https://claude.ai/code/artifact/ad862e44-0a0e-463a-b1b6-080776889f7e
- **Combined (approved)**: https://claude.ai/code/artifact/12a62999-3728-4bd2-92cb-83a4ad12120e

## Color tokens

| Token | Hex | Use |
|---|---|---|
| `bg` | `#07070c` | Page background |
| `surface` | `#0e0f18` | Frame / outer card background |
| `surface-2` | `#14151f` | Nested card background (nav pills, stat cards) |
| `surface-3` | `#191a26` | Track backgrounds (bars, heatmap "off" cells) |
| `border` | `#22232f` | Card borders |
| `border-soft` | `#1a1b26` | Divider lines within cards |
| `text` | `#f3f4f8` | Primary text |
| `text-muted` | `#9497ac` | Secondary text, labels |
| `text-faint` | `#5b5d70` | Tertiary text, axis labels, captions |
| `accent-1` | `#6366f1` | Primary accent (indigo) — tasks, primary buttons, active nav |
| `accent-2` | `#22d3ee` | Secondary accent (cyan) — habits, gradient pairing with accent-1 |
| `violet` | `#a78bfa` | Tertiary accent — hero gradient layering only |
| `success` | `#34d399` | Positive semantic state (habit completions, positive deltas) |
| `warning` | `#fbbf24` | Caution semantic state (goals, in-progress) |
| `danger` | `#fb7185` | Negative semantic state |

Semantic colors (`success`/`warning`/`danger`) are separate from the two-color
`accent-1`/`accent-2` brand gradient and never substitute for it.

## Typography

- **Display** (`font-display`): `"Avenir Next", "Segoe UI Semibold", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif` — headings, greeting text, big stat numbers. Weight 700, tight tracking (`-0.01` to `-0.02em`).
- **Body** (`font-body`): `-apple-system, "Segoe UI", "Helvetica Neue", ui-sans-serif, system-ui, sans-serif` — everything else.
- **Mono** (`font-mono`): `ui-monospace, "Cascadia Code", "SF Mono", "Roboto Mono", monospace` — all numeric data (stats, dates, chart axis labels), set with `font-variant-numeric: tabular-nums`.

## Layout patterns

1. **Top pill nav** — brand mark left, pill-shaped nav group centered/left-of-center (active tab gets the `accent-2`→`accent-1` gradient fill, `#04040a` text), icon buttons + avatar right. Replaces the current left sidebar rail entirely.
2. **Cosmic hero** — the page's focal point, sits where the plain text greeting used to be. Layered radial gradients (`accent-1`/`accent-2`/`violet` at low opacity) over a near-black base, a faint dot-pattern starfield, one thin decorative orbit-ring arc. Centered inside it: a short greeting line, then a large glass "Just ask me anything" bar (blurred translucent background, mic icon) as the single most prominent element on the page — the AI assistant is the primary interaction, not a side panel. Below the ask bar, a row of small translucent glass pills surfaces key stats (weekly progress, streak, today's breakdown) without competing with the ask bar for attention. Action buttons (Add Task / New Goal) sit at the bottom of the hero.
3. **Card grid below the hero** — three cards: a weekly activity area chart (two-series, tasks vs. habits, gradient fill under each line, dashed average line), a consistency heatmap (GitHub-style grid, 4 weeks × 7 days, intensity via `accent-1` opacity steps, with a labeled Less→More legend), and a recent-activity list (icon + name + relative time + colored semantic tag per row).
4. **Card shell**: `surface-2` background, `1px solid border`, `1.25rem` border-radius, `1.25rem` padding throughout — consistent across all card types.

## Not yet decided

- Whether this fully replaces the current sidebar-based layout across *every* tab (Tasks/Calendar/Habits/etc.) or only Overview.
- Mobile/narrow-viewport behavior for the pill nav (likely collapses to a hamburger, unspecified so far).
- Whether the cosmic hero's starfield/orbit-ring should be static or subtly animated in the real implementation.
