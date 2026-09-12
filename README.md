# FilesXins

Personal portfolio of **Muhammad Rayhan Najib** — a dark, neon-modern single-page site with a
holographic hero portrait, a filterable project showcase, a certificate gallery and lightbox
navigation.

**Live:** https://filesxins.vercel.app

---

## What's in here

```
filesxins-portfolio/
├── index.template.html         # source with {{icon:...}} placeholders
├── index.html                  # built page (icons inlined)
├── vercel.json                 # caching + content-type headers
├── assets/
│   ├── css/styles.css          # theme, layout, animation
│   ├── js/main.js              # galleries, lightbox, nav, filters
│   ├── profile/                # portrait, hologram portrait, favicon
│   ├── logo/                   # logo mark, extracted from the brand splash
│   ├── shots/                  # project screenshots (WebP)
│   ├── certs/                  # certificate first pages (WebP)
│   └── thirdparty/             # screenshots of the live village portal
├── site/ummart/                # static demo of the UM-MART e-commerce app
│   ├── demo/                   # the pages (front end, path-rewritten)
│   ├── api/                    # snapshot JSON the demo reads as its "backend"
│   ├── assets/  styles/  scripts/
│   └── sw.js                   # serves the snapshots when opened from disk
└── _build/                     # reproducible build scripts
```

## The UM-MART demo

UM-MART is a PHP 8.3 + MySQL application, which **cannot run on Vercel**. The demo under
`site/ummart/` is the real front end with its API calls served from committed snapshots:

* **GET** `api/**/*.php` reads the matching `*.json` snapshot (captured from the live app),
* **POST/PUT/DELETE** is neutralised with an explanatory JSON response,
* pages that redirect to sign-in when unauthenticated turn that into a notice, so the whole UI
  stays walkable,
* the cart, checkout and invoice pages are seeded from `localStorage`.

The full backend (catalog, cart, four payment flows, Google OAuth, admin dashboard with
statistics and Excel export) lives in [RayhanNajib/UM-MART](https://github.com/RayhanNajib/UM-MART).

## Rebuilding the assets

```bash
python _build/make_assets.py       # screenshots + certificates -> optimised WebP
python _build/icons.py fetch       # cache official icons (Lucide / Simple Icons / Iconify)
python _build/icons.py build       # index.template.html -> index.html
python _build/export_fixtures.py   # snapshot the API responses (needs the app running locally)
python _build/sync_demo.py         # materialise site/ummart/ from the app + snapshots
```

`export_fixtures.py` expects the app on `http://ummart-test.test/`.

## Design notes

* **Palette** — three hues only, per the accessibility guidance: surface `#0A0E1A`,
  primary `#22D3EE` (neon cyan), secondary `#7C5CFF` (violet), plus amber `#FFB020` reserved for
  intellectual-property badges and green `#7CE38B` for the in-production state. Every text/background
  pair measures 4.5:1 or better; body copy is 9:1+.
* **Typography** — Inter for prose, JetBrains Mono for labels and metadata.
* **Icons** — official open-source sets only, resolved at build time from
  [Iconify](https://iconify.design): [Lucide](https://lucide.dev) (ISC) for interface icons,
  [Simple Icons](https://simpleicons.org) (CC0) for technology marks. No emoji anywhere.
* **Content shape** — built for skimming and for ATS parsing: a profile summary, then each project
  as *problem → what I built → result*, then certificates that state the capability they evidence,
  then skills grouped by discipline with a proficiency word instead of a percentage bar.

Layout, palette and motion are original work. The dark-neon direction and the hologram treatment
of the hero portrait take inspiration from the developer-portfolio aesthetic popularised by
[bchiang7/v4](https://github.com/bchiang7/v4) — a different palette and a different layout,
same typographic pairing. No code was copied.

Deployments are wired to GitHub: pushing to `main` builds automatically.
