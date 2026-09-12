# FilesXins

Personal portfolio of **Muhammad Rayhan Najib** — a dark, neon-modern single-page site with a
holographic hero portrait, a filterable project showcase, a certificate gallery and lightbox
navigation.

**Live:** https://filesxins.vercel.app

---

## What's in here

```
filesxins-portfolio/
├── index.html                  # the portfolio (single page)
├── vercel.json                 # caching + content-type headers
├── assets/
│   ├── css/styles.css          # theme, layout, animation
│   ├── js/main.js              # galleries, lightbox, nav, filters
│   ├── profile/                # avatar + favicon
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
python _build/export_fixtures.py   # snapshot the API responses (needs the app running locally)
python _build/sync_demo.py         # materialise site/ummart/ from the app + snapshots
```

`export_fixtures.py` expects the app on `http://ummart-test.test/`.

## Credits

Layout, palette and motion are original work. Typography follows the **Inter** / **JetBrains Mono**
pairing, and the general dark-neon direction takes inspiration from the developer-portfolio
aesthetic popularised by [bchiang7/v4](https://github.com/bchiang7/v4). No code was copied.
