# Design system

**Purpose:** `assets/css/motify.css` is a single-file, token-driven design system themed from the app — azure brand + three-mode accents, dark by default with light support, RTL-ready, WCAG 2.0 AA (Israeli Standard IS 5568).

## Tokens (CSS custom properties)

All color, radius, shadow, and layout values are CSS variables on `:root`, so theming is a matter of swapping the variable set — no per-component overrides. Groups:

- **Surfaces/text:** `--bg`, `--bg-alt`, `--surface`, `--surface-2`, `--border`, `--border-strong`, `--text`, `--text-muted`
- **Brand:** `--brand`, `--brand-2`, `--brand-ink`, `--on-accent`
- **Mode accents:** `--social`, `--networking`, `--dating` (+ `--radar`, `--success`)
- **Gradient:** `--grad-from`, `--grad-to` (the hero `.grad` wordmark accent)
- **Focus/shadow:** `--focus`, `--shadow-1`, `--shadow-2`
- **Radii:** `--r-xs 4` · `--r-sm 8` · `--r-md 12` · `--r-lg 16` · `--r-xl 28` · `--r-pill 999` (Material-3-ish scale)
- **Layout:** `--container 1080px`, `--gutter clamp(20px,5vw,40px)`

## Theming — dark default, three ways to go light

Dark is the baseline (`:root`). Light is applied by whichever comes first:

1. **`[data-theme="light"]`** — explicit user toggle (persisted `localStorage('motify-theme')`), overrides everything.
2. **`@media (prefers-color-scheme: light)` + `:root:not([data-theme])`** — follows the OS when the user hasn't chosen.

The `<head>` bootstrap applies the saved `data-theme` before paint; `assets/js/motify.js` computes the effective theme, toggles it, and syncs `aria-pressed` on every `.nav__theme` button (sun/moon icons swap via CSS).

## Palette

| Token | Dark | Light |
|-------|------|-------|
| `--brand` | `#80AFE3` | `#2C6094` |
| `--social` | `#80AFE3` | `#2C6094` |
| `--networking` | `#9B86FF` | `#6A4BE0` |
| `--dating` | `#FF6B85` | `#D8365A` |
| `--radar` | `#19D3E6` | `#0E8FA0` |

Mode cards read their accent via a local `--accent` (`.mode--social { --accent: var(--social) }`), driving the top bar, badge, and hover border with one variable. `color-mix(in srgb, var(--accent) N%, …)` derives tints/borders so each mode needs no extra colors.

## RTL

Layout uses **logical properties** everywhere — `margin-inline`, `padding-inline`, `inset-inline`, `border-inline-start`, `padding-inline-start`, `text-align: start`. Setting `dir="rtl"` (done for Hebrew by the bootstrap + per-block, see [i18n.md](i18n.md)) mirrors the whole page with no language-specific CSS.

## Language-block visibility

Both languages are in every file; CSS shows only the active one:

```css
[data-lang-block="he"] { display: none; }            /* default = English */
html[data-lang="he"] [data-lang-block="en"] { display: none; }
html[data-lang="he"] [data-lang-block="he"] { display: block; }
```

## Wordmark

The brand mark is the glyph swapped for the leading "M": `logo-glyph.svg` + the text `otify` → renders as "[glyph]otify". `.brand` forces `direction: ltr` so the wordmark never mirrors under RTL. The glyph height is `em`-relative so it scales with the brand font size.

## Motion & responsive

- **`prefers-reduced-motion: reduce`** disables smooth scroll, near-zeroes all animations/transitions, and stops the radar sweep — a first-class path, not an afterthought.
- Breakpoints: `≤860px` stacks hero/mode/step/feature grids and hides the radar art; `≤720px` turns the nav into a toggled mobile menu.

## Accessibility

- **Skip link** (`.skip-link`) → `#main{idSuffix}`, visible on focus.
- **Landmarks:** `<header>`, `<nav aria-label>`, `<main>`, `<footer>` with a labelled footer `<nav>`.
- **One `<h1>` per language block** (hero / page header); headings descend in order.
- **Focus styles:** global `:focus-visible` = 3px `--focus` outline with offset (never removed).
- **Decorative vs meaningful:** illustrative SVGs/images use `aria-hidden` / empty `alt=""`; store badges carry real `alt` text (`common.badge_apple` / `badge_google`); icon-only controls (theme, nav toggle, lang) carry `aria-label`.
- Meets WCAG 2.0 AA / IS 5568 (per README).
