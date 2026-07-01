# motify.uk

Static marketing + policy site for Motify, hosted on GitHub Pages. Bilingual
(English + Hebrew/RTL) at **one URL per page**, language chosen at runtime.
Built to Israeli Standard **IS 5568** (WCAG 2.0 AA).

## URLs and language

Every page has a single flat URL — no `/he/` or `/en/` prefix:

```
/                 /privacy.html   /terms.html
/guidelines.html  /support.html   /accessibility.html
```

Language is selected at runtime, in this priority order:

1. `?lang=he` or `?lang=en` — explicit override (**the app deep-links this way**,
   e.g. `https://motify.uk/privacy.html?lang=he`, to match the app's language)
2. the visitor's previously saved choice (`localStorage`)
3. the browser language (`navigator.language`)
4. English (default)

Each generated page ships **both languages** inside it. A synchronous `<head>`
script sets `data-lang` before first paint, and CSS shows only the active block —
so there is no flash, it works with the language baked in for crawlers, and the
in-nav toggle switches instantly without a reload.

## How it works — string resources, not hand-edited HTML

The `*.html` files GitHub Pages serves are **generated**. You never hand-edit them.

```
i18n/<lang>/common.json     shared UI strings (nav, footer, a11y labels)
i18n/<lang>/<page>.json      per-page strings — the "strings.xml" for each page
templates/partials/*.html    reusable chrome (head, nav, footer)
templates/pages/*.html       page bodies (home, legal, support) — no <head>
assets/css/motify.css        design system (light/dark, RTL, tokens from the app)
assets/js/motify.js          progressive enhancement (nav, theme, language toggle)
build.mjs                    the generator (Node, zero dependencies)
```

`build.mjs` renders each page in every language, wraps each in a `.lang-block`,
and writes one static file per page. You author in one keyed catalog per language
(like Android `values/` + `values-he/`).

## Build

```bash
node build.mjs        # regenerates every page
```

Commit the generated HTML together with your source change. GitHub Pages serves the
static files directly — there is **no build step in the hosting path**.

## Common edits

- **Change wording** → edit `i18n/en/<page>.json` and `i18n/he/<page>.json`, then `node build.mjs`.
- **Add a page** → add `templates/pages/<shape>.html` (or reuse `legal`), add `i18n/<lang>/<page>.json`, and register it in the `PAGES` array in `build.mjs`.
- **Add a language** → add `i18n/<code>/…` and the code to `LANGS` in `build.mjs`; extend the language priority list in `templates/partials/head.html` + `assets/js/motify.js`. RTL is automatic (`dir` is set from the block/`<html>`).

## Template tokens

- `{{t:home.hero_lead}}` — a translation from the merged catalog (`common` + page namespace).
- `{{partial:nav}}` — inline a partial.
- `{{sections}}` / `{{faq}}` — render the page catalog's `sections` / `faq` array.
- `{{var:h1}}`, `{{var:idSuffix}}`, `{{var:otherLang}}`, `{{var:otherLangParam}}`, `{{var:homeUrl}}` — computed per page/language. `idSuffix` (`-en`/`-he`) keeps element IDs unique across the two language blocks.

## Not generated (edit directly)

`promote.html`, `analytics.html`, `go/`, `i/`, `404.html`, `.well-known/`, `CNAME`,
`ic_motify.svg`. These are functional tools / deep-link infrastructure.
