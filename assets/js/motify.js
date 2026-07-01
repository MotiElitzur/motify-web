// Motify.uk — progressive enhancement only. The site is fully readable without JS
// (English is the baked default; the <head> bootstrap already applied the language).
(function () {
    'use strict';
    var root = document.documentElement;

    /* Mobile navigation — one nav per language block, matched via aria-controls ----- */
    document.querySelectorAll('.nav__toggle').forEach(function (toggle) {
        var menu = document.getElementById(toggle.getAttribute('aria-controls'));
        if (!menu) return;
        toggle.addEventListener('click', function () {
            var open = menu.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
        menu.addEventListener('click', function (e) {
            if (e.target.closest('a') && menu.classList.contains('is-open')) {
                menu.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    /* Theme toggle (light / dark), persisted, applied to every theme button --------- */
    function effectiveTheme() {
        var explicit = root.getAttribute('data-theme');
        if (explicit) return explicit;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    function reflectTheme() {
        var pressed = effectiveTheme() === 'dark' ? 'true' : 'false';
        document.querySelectorAll('.nav__theme').forEach(function (b) { b.setAttribute('aria-pressed', pressed); });
    }
    reflectTheme();
    document.querySelectorAll('.nav__theme').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            try { localStorage.setItem('motify-theme', next); } catch (e) {}
            reflectTheme();
        });
    });

    /* Language switch — flips the visible block in place, no reload -------------------
       (The app can also just open the page with ?lang=he; the bootstrap handles that.) */
    var metaEl = document.getElementById('i18n-meta');
    var meta = {};
    try { meta = metaEl ? JSON.parse(metaEl.textContent) : {}; } catch (e) {}

    function applyLang(lang) {
        if (lang !== 'he' && lang !== 'en') return;
        root.setAttribute('data-lang', lang);
        root.setAttribute('lang', lang);
        root.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
        if (meta[lang] && meta[lang].title) document.title = meta[lang].title;
        try { localStorage.setItem('motify-lang', lang); } catch (e) {}
        // Language is kept in localStorage only — never written to the URL.
    }

    document.querySelectorAll('[data-lang-to]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            applyLang(link.getAttribute('data-lang-to'));
        });
    });
})();
