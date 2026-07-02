#!/usr/bin/env node
// Motify.uk static site generator — zero dependencies.
//
// Authoring model (like Android string resources):
//   i18n/<lang>/common.json   shared UI strings (nav, footer, a11y)
//   i18n/<lang>/<page>.json    per-page strings (+ optional `_meta`, `sections`, `faq`)
//   templates/partials/*.html  reusable chrome (head, nav, footer)
//   templates/pages/*.html     page bodies (nav + main + footer, no <head>)
//
// Output: one static HTML file per page at a SINGLE flat URL (no /he/, no /en/).
//   Each file contains BOTH languages, wrapped in .lang-block divs. English is the
//   baked default (crawlers / no-JS). A synchronous <head> script picks the language
//   from `?lang=` → saved choice → browser language, before first paint, and CSS shows
//   only the active block. The app deep-links e.g. `privacy.html?lang=he`.
//
// Run:  node build.mjs

import { readFileSync, writeFileSync, rmSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const ORIGIN = 'https://motify.uk';
const LANGS = ['en', 'he'];

// One flat file per page. `tpl` picks the body shape; `i18n` is the catalog namespace.
const PAGES = [
  { i18n: 'home',          tpl: 'home',    out: 'index.html',         url: '/' },
  { i18n: 'privacy',       tpl: 'legal',   out: 'privacy.html',       url: '/privacy.html' },
  { i18n: 'terms',         tpl: 'legal',   out: 'terms.html',         url: '/terms.html' },
  { i18n: 'guidelines',    tpl: 'legal',   out: 'guidelines.html',    url: '/guidelines.html' },
  { i18n: 'support',       tpl: 'support', out: 'support.html',       url: '/support.html' },
];

const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

const partials = {
  head: read('templates/partials/head.html'),
  nav: read('templates/partials/nav.html'),
  footer: read('templates/partials/footer.html'),
};
const templates = Object.fromEntries(
  [...new Set(PAGES.map((p) => p.tpl))].map((t) => [t, read(`templates/pages/${t}.html`)])
);

function lookup(strings, path) {
  const val = path.split('.').reduce((o, k) => (o == null ? o : o[k]), strings);
  if (val == null) {
    console.warn(`  ! missing string: ${path}`);
    return '';
  }
  return val;
}

function renderSections(list) {
  if (!Array.isArray(list)) return '';
  return list
    .map((s) => {
      const id = s.id ? ` id="${s.id}"` : '';
      const h = s.heading ? `<h2${id}>${s.heading}</h2>` : '';
      return `<section class="prose__block">${h}${s.body || ''}</section>`;
    })
    .join('\n');
}

function renderFaq(list) {
  if (!Array.isArray(list)) return '';
  return list
    .map((f) => {
      const id = f.id ? ` id="${f.id}"` : '';
      return `<details class="faq"${id}><summary class="faq__q">${f.q}</summary><div class="faq__a">${f.a}</div></details>`;
    })
    .join('\n');
}

function render(tpl, ctx) {
  let out = tpl;
  out = out.replace(/\{\{partial:(\w+)\}\}/g, (_, n) => partials[n] ?? '');
  out = out.replace(/\{\{sections\}\}/g, () => renderSections(lookup(ctx.strings, `${ctx.page.i18n}.sections`)));
  out = out.replace(/\{\{faq\}\}/g, () => renderFaq(lookup(ctx.strings, `${ctx.page.i18n}.faq`)));
  out = out.replace(/\{\{t:([\w.]+)\}\}/g, (_, path) => lookup(ctx.strings, path));
  out = out.replace(/\{\{var:(\w+)\}\}/g, (_, n) => ctx.vars[n] ?? '');
  return out;
}

const BUILD_DATE = new Date().toISOString().slice(0, 10);

// Structured data (JSON-LD) for search engines + AI answer engines.
const stripTags = (html) => (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const jsonScript = (obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
function buildJsonLd(page, meta, pageStrings) {
  const graph = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'Motify', url: `${ORIGIN}/`, logo: `${ORIGIN}/assets/img/icon-512.png`, sameAs: ['https://play.google.com/store/apps/details?id=moti.motify'] },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Motify', url: `${ORIGIN}/` },
  ];
  if (page.i18n === 'home') {
    graph.push({ '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Motify', operatingSystem: 'iOS, Android', applicationCategory: 'SocialNetworkingApplication', description: meta.description || '', url: `${ORIGIN}/`, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } });
  }
  if (page.i18n === 'support' && Array.isArray(pageStrings.faq)) {
    graph.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: pageStrings.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: stripTags(f.a) } })) });
  }
  return graph.map(jsonScript).join('\n    ');
}

// Fresh output: drop any legacy per-language directory from the previous scheme.
rmSync(join(ROOT, 'he'), { recursive: true, force: true });

let written = 0;
for (const page of PAGES) {
  const blocks = [];
  const metaByLang = {};

  for (const lang of LANGS) {
    const common = readJson(`i18n/${lang}/common.json`);
    const pageStrings = readJson(`i18n/${lang}/${page.i18n}.json`);
    const strings = { common, [page.i18n]: pageStrings };
    const m = pageStrings._meta || {};
    const dir = lang === 'he' ? 'rtl' : 'ltr';
    const other = lang === 'en' ? 'he' : 'en';

    const vars = {
      lang,
      dir,
      idSuffix: `-${lang}`,
      h1: m.h1 || m.title || '',
      updated: m.updated || '',
      intro: pageStrings.intro || '',
      homeUrl: '/',
      otherLang: other,
      otherLangLabel: common.lang_switch,
      otherLangParam: `?lang=${other}`,
      year: '2026',
    };

    const inner = render(templates[page.tpl], { strings, page, vars });
    blocks.push(`<div class="lang-block" data-lang-block="${lang}" lang="${lang}" dir="${dir}">\n${inner}\n</div>`);
    metaByLang[lang] = { title: m.title || common.brand, dir };
  }

  // Shared <head>: English is the baked default for crawlers / no-JS.
  const enCommon = readJson('i18n/en/common.json');
  const enPage = readJson(`i18n/en/${page.i18n}.json`);
  const enMeta = enPage._meta || {};
  const canonical = `${ORIGIN}${page.url}`;
  const hreflang = [
    `<link rel="alternate" hreflang="en" href="${canonical}?lang=en">`,
    `<link rel="alternate" hreflang="he" href="${canonical}?lang=he">`,
    `<link rel="alternate" hreflang="x-default" href="${canonical}">`,
  ].join('\n    ');
  const headVars = {
    lang: 'en',
    title: enMeta.title || enCommon.brand,
    description: enMeta.description || '',
    canonical,
    ogUrl: canonical,
    hreflang,
    jsonld: buildJsonLd(page, enMeta, enPage),
    i18nMeta: `<script type="application/json" id="i18n-meta">${JSON.stringify(metaByLang)}</script>`,
  };
  const head = render(partials.head, { strings: { common: enCommon }, page, vars: headVars });

  const doc =
    `<!DOCTYPE html>\n<html lang="en" dir="ltr">\n<head>\n${head}\n</head>\n<body>\n` +
    blocks.join('\n') +
    `\n    <script src="/assets/js/motify.js" defer></script>\n</body>\n</html>\n`;

  writeFileSync(join(ROOT, page.out), doc);
  written++;
  console.log(`  ✓ ${page.out}  (en + he)`);
}
// sitemap.xml — flat URLs with hreflang alternates for the ?lang= variants.
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
  PAGES.map((p) => {
    const loc = `${ORIGIN}${p.url}`;
    return (
      `  <url>\n    <loc>${loc}</loc>\n` +
      `    <xhtml:link rel="alternate" hreflang="en" href="${loc}?lang=en"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="he" href="${loc}?lang=he"/>\n` +
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>\n` +
      `    <lastmod>${BUILD_DATE}</lastmod>\n  </url>`
    );
  }).join('\n') +
  `\n</urlset>\n`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

console.log(`\nBuilt ${written} pages + sitemap.xml — flat URLs, language via ?lang=.`);
