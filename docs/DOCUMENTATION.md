# Documentation map

Every doc for the motify.uk site. Start at the [README](../README.md) for the quick tour; come here for the details.

| Doc | What it covers |
|-----|----------------|
| [architecture.md](architecture.md) | The `build.mjs` generator — how JSON catalogs + partials + page templates become static HTML, the page registry, the template token system, and the single-URL / both-languages-in-one-file model. |
| [i18n.md](i18n.md) | The translation-catalog model (Android-style `values/` + `values-he/`): editing strings, adding a page, adding a language, and the runtime `?lang=` language selection. |
| [design.md](design.md) | The design system in `motify.css` — tokens, light/dark, the app azure + three-mode palette, RTL via logical properties, reduced-motion, and the glyph wordmark. Plus accessibility features. |
| [seo.md](seo.md) | SEO + AI-search setup: robots, auto-generated sitemap + JSON-LD, favicons/OG, `llms.txt`, the i18n↔SEO tradeoff, and Search Console steps. |
| [deployment.md](deployment.md) | GitHub Pages hosting from `main`, the build → commit → push flow, `CNAME`/`.nojekyll`, and the deep-link infrastructure (`.well-known/`, `go/`, `i/`). |

## Conventions

- **Source of truth is the code.** These docs are a guide; when they disagree with `build.mjs` / the templates, the code wins.
- Keep each doc concise (≤ ~140 lines), lead with a one-line purpose, prefer tables and short bullets.
- Update the relevant doc in the same change as the code it describes.
