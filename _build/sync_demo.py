"""Materialise the UM-MART static demo into the portfolio repo.

The real app is PHP + MySQL and cannot run on Vercel. This builds a faithful,
clickable front-end demo by:

  * copying the front end and keeping the original relative asset layout
    (demo/ sits one level deeper, exactly like the original pages/ folder),
  * converting the snapshot API responses in site/ummart/api/*.php into the
    data source (GET requests read them; writes are neutralised),
  * dropping assets no page references and downscaling the very large ones,
  * disabling the PHP-only paths (login redirects, checkout POSTs) so a
    visitor can walk the whole UI without hitting a dead end.

Run:  python _build/sync_demo.py   (after _build/export_fixtures.py)
"""
import os, re, shutil, json
from PIL import Image

SRC  = r"C:\laragon\www\ummart-test"
PROJ = r"C:\CODE\filesxins-portfolio"
DEST = os.path.join(PROJ, "site", "ummart")

PAGES = [
    ("home.html",           "Home"),
    ("filter.html",         "Shop"),
    ("about.html",          "About"),
    ("contact.html",        "Contact"),
    ("checkout.html",       "Checkout"),
    ("payment-ovo.html",    "OVO"),
    ("payment-gopay.html",  "GoPay"),
    ("payment-dana.html",   "DANA"),
    ("payment-card.html",   "Card"),
    ("order-complete.html", "Order complete"),
    ("location.html",       "Location"),
    ("login.html",          "Login"),
    ("signup.html",         "Sign up"),
    ("transactions.html",   "Transactions"),
    ("invoice.html",        "Invoice"),
    ("admin-dashboard.html","Admin dashboard"),
]

# seeded client state so the cart/checkout/invoice pages have something to show
SEED_STATE = {
    "cartItems": [
        {"id": 1, "name": "Yogurt Drink Strawberry", "price": 18000,
         "image": "../assets/images/Product/691593424a933-Produk1.png", "quantity": 2},
        {"id": 2, "name": "Mie Sedap Cup", "price": 6500,
         "image": "../assets/images/Product/69159a889199a-Produk2.png", "quantity": 3},
        {"id": 3, "name": "Ice Cream Lokarasa", "price": 12000,
         "image": "../assets/images/Product/Produk3.png", "quantity": 1},
    ],
}
SEED_STATE["lastOrder"] = {
    "orderCode": "UMMART-1763456789123",
    "orderDate": "12 Sep 2026",
    "orderTotal": 67500,
    "paymentMethod": "ovo",
    "products": SEED_STATE["cartItems"],
    "status": "Pending",
}
SEED_STATE["finalPaymentAmount"] = "67500"
SEED_STATE["paymentMethod"] = "ovo"

DEMO_RUNTIME = """  <!-- ============ FilesXins static demo runtime ============ -->
  <script>
  (function () {
    var NOTE = 'This is a static demo \\u2014 the PHP/MySQL backend is not part of this deployment.';

    /* ---- seed the client state the checkout flow expects ---- */
    try {
      var seed = %SEED%;
      Object.keys(seed).forEach(function (k) {
        if (!localStorage.getItem(k)) localStorage.setItem(k, typeof seed[k] === 'string' ? seed[k] : JSON.stringify(seed[k]));
      });
    } catch (e) {}

    /* ---- serve GET api/* from the snapshot, neutralise writes ---- */
    function fixtureName(url) {
      // ../api/public/get_products.php?x=1  ->  api/public/get_products.php
      var m = String(url).match(/api\\/[A-Za-z0-9_\\/.\\-]+\\.php/);
      return m ? m[0] : null;
    }
    var _fetch = window.fetch;
    window.fetch = function (url, opts) {
      var name = fixtureName(url);
      if (!name) return _fetch.apply(this, arguments);
      var method = ((opts && opts.method) || 'GET').toUpperCase();
      if (method !== 'GET') {
        console.info('[FilesXins demo] write call skipped:', name);
        return Promise.resolve(new Response(JSON.stringify({
          success: false, demo: true, message: NOTE
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      // GET -> the snapshot file (stored as .json, so parse it ourselves).
      // Keep the original ../ prefix so it resolves exactly like the .php call did.
      var target = String(url).replace(/\.php(\?[^#]*)?$/, '.json');
      return _fetch(target, { cache: 'force-cache' })
        .then(function (r) { return r.text(); })
        .then(function (t) { return new Response(t, { status: 200, headers: { 'Content-Type': 'application/json' } }); })
        .catch(function () {
          return new Response(JSON.stringify({ success: false, demo: true, message: NOTE }),
            { status: 200, headers: { 'Content-Type': 'application/json' } });
        });
    };

    /* ---- neutralise XHR writes too ---- */
    var _open = XMLHttpRequest.prototype.open, _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (m, u) {
      this.__fx = m && String(m).toUpperCase() !== 'GET' && String(u).indexOf('api/') !== -1;
      return _open.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () { if (this.__fx) return; return _send.apply(this, arguments); };

    /* ---- keep navigation inside the demo ---- */
    function notice(msg) {
      var old = document.getElementById('fx-note');
      if (old) old.remove();
      var d = document.createElement('div');
      d.id = 'fx-note';
      d.setAttribute('style', 'position:fixed;left:50%;top:3.4rem;transform:translateX(-50%);z-index:99999;' +
        'font:500 13px/1.45 Inter,system-ui,sans-serif;color:#e6ecff;background:rgba(14,18,32,.97);' +
        'border:1px solid #2a3350;border-radius:10px;padding:.7rem 1.1rem;max-width:92vw;text-align:center;' +
        'box-shadow:0 18px 50px -18px rgba(0,229,255,.55)');
      d.textContent = msg;
      document.body.appendChild(d);
      setTimeout(function () { d.remove(); }, 4500);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var h = a.getAttribute('href') || '';
      if (/^#|^https?:|^mailto:|^tel:|^\\//.test(h) || !h) return;
      if (/login\\.html|signup\\.html/i.test(h)) {
        e.preventDefault();
        notice('Sign-in is disabled here \\u2014 authentication needs the PHP backend (see the code on GitHub).');
      }
    }, true);

    /* ---- Google Identity is unavailable on a demo origin ---- */
    if (!window.google) {
      Object.defineProperty(window, 'google', { configurable: true, writable: true, value: {
        accounts: { id: {
          initialize: function () {}, renderButton: function () {}, prompt: function () {},
          disableAutoSelect: function () {}, cancel: function () {}
        } }
      } });
    }

    /* ---- let the demo work when opened straight from disk (file://) ---- */
    if (location.protocol === 'file:') {
      try { arch = null; } catch (e) {}
    }
    try {
      if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register((location.pathname.indexOf('/demo/') > -1 ? '../' : './') + 'sw.js')
          .catch(function () {});
      }
    } catch (e) {}

    /* ---- demo chrome ---- */
    document.addEventListener('DOMContentLoaded', function () {
      var s = document.createElement('style');
      s.textContent = 'body{padding-top:2.7rem!important}';
      document.head.appendChild(s);
      var bar = document.createElement('div');
      bar.setAttribute('style', 'position:fixed;left:0;right:0;top:0;z-index:99998;display:flex;align-items:center;' +
        'gap:.3rem;overflow-x:auto;padding:.5rem .8rem;background:rgba(7,8,13,.95);backdrop-filter:blur(10px);' +
        'border-bottom:1px solid #1c2338;font:500 12px/1 Inter,system-ui,sans-serif;white-space:nowrap');
      bar.innerHTML = %NAV%;
      document.body.appendChild(bar);
    });
  })();
  </script>
</head>"""


def read(p):
    return open(p, encoding="utf-8", errors="ignore").read()


def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(s)


def main():
    # Clear the previous build. A process can hold the top directory itself
    # (e.g. a shell whose cwd is inside it) - then rmtree fails on that one
    # entry, which is harmless, so empty the directory instead.
    if os.path.isdir(DEST):
        for entry in os.listdir(DEST):
            p_ = os.path.join(DEST, entry)
            if os.path.isdir(p_):
                shutil.rmtree(p_, ignore_errors=True)
            else:
                try:
                    os.remove(p_)
                except OSError:
                    pass
    os.makedirs(DEST, exist_ok=True)

    # ---------- 1. copy the front end, preserving relative layout ----------
    for sub, dst in (("styles", "styles"), ("scripts", "scripts")):
        shutil.copytree(os.path.join(SRC, sub), os.path.join(DEST, dst))
    for sub in ("images", "fonts", "icon"):
        s = os.path.join(SRC, "assets", sub)
        if os.path.isdir(s):
            shutil.copytree(s, os.path.join(DEST, "assets", sub))
    demo = os.path.join(DEST, "demo")
    os.makedirs(demo, exist_ok=True)
    for f, _l in PAGES:
        src = os.path.join(SRC, "pages", f)
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(demo, f))
        else:
            print("  ! source page missing:", f)

    # ---------- 2. snapshot the API responses as static .json ----------
    src_fix = os.path.join(PROJ, "_build", "_api-fixtures")
    api_dir = os.path.join(DEST, "api")
    n_fix = 0
    if os.path.isdir(src_fix):
        for root, _d, files in os.walk(src_fix):
            for f in files:
                if not f.endswith(".php"):
                    continue
                rel = os.path.relpath(os.path.join(root, f), src_fix)
                dst = os.path.join(api_dir, rel[:-4] + ".json")
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(os.path.join(root, f), dst)
                n_fix += 1
        print(f"api fixtures copied: {n_fix}")
    else:
        print("  ! no fixtures - run _build/export_fixtures.py first")

    # ---------- 3. page-level fixes + runtime injection ----------
    nav = "".join(
        f'<a href="./{f}" style="color:#8b96b8;text-decoration:none;padding:.3rem .55rem;border-radius:6px">{lbl}</a>'
        for f, lbl in PAGES)
    nav_html = ('<a href="/" style="color:#00e5ff;text-decoration:none;font-weight:700;margin-right:.4rem">FILESXINS</a>'
                '<span style="color:#2a3350">|</span>'
                '<span style="color:#5b6488;margin:0 .3rem">UM-MART demo</span>'
                '<span style="color:#2a3350">|</span>' + nav)
    runtime = (DEMO_RUNTIME
               .replace("%SEED%", json.dumps(SEED_STATE))
               .replace("%NAV%", json.dumps(nav_html)))
    fixed = 0
    for f, _l in PAGES:
        p = os.path.join(demo, f)
        if not os.path.exists(p):
            continue
        h = read(p)
        # pages/ is gone: every page now sits beside the others in demo/
        h = h.replace("../pages/", "./")
        if "</head>" in h and "FilesXins static demo runtime" not in h:
            h = h.replace("</head>", runtime, 1)
        write(p, h)
        fixed += 1

    # the same ../pages/ prefix appears inside the JavaScript and CSS
    for sub in ("styles", "scripts"):
        for f in os.listdir(os.path.join(DEST, sub)):
            p = os.path.join(DEST, sub, f)
            if not os.path.isfile(p):
                continue
            t = read(p)
            if "../pages/" in t:
                write(p, t.replace("../pages/", "./"))
                fixed += 1
    print(f"pages prepared: {fixed}")

    # ---------- 4. prune unused assets ----------
    refs = set()
    for root, _d, files in os.walk(DEST):
        for f in files:
            if os.path.splitext(f)[1].lower() not in (".html", ".css", ".js", ".json", ".webmanifest"):
                continue
            t = read(os.path.join(root, f))
            for m in re.finditer(r"([A-Za-z0-9_@.()\- ]+\.(?:png|jpg|jpeg|gif|svg|otf|ico|webp|mp4|mp3|webmanifest))", t, re.I):
                refs.add(m.group(1).strip().lower())
    removed = 0
    for root, _d, files in os.walk(os.path.join(DEST, "assets")):
        for f in files:
            if f.lower() not in refs:
                os.remove(os.path.join(root, f)); removed += 1
    print(f"unreferenced assets removed: {removed}")

    # ---------- 5. shrink oversized images (keep filenames) ----------
    shrunk = saved = 0
    for root, _d, files in os.walk(DEST):
        for f in files:
            if os.path.splitext(f)[1].lower() not in (".png", ".jpg", ".jpeg"):
                continue
            p = os.path.join(root, f)
            before = os.path.getsize(p)
            if before < 200 * 1024:
                continue
            try:
                im = Image.open(p)
                fmt = im.format
                if im.width > 1600:
                    im = im.resize((1600, int(im.height * 1600 / im.width)), Image.LANCZOS)
                if fmt == "JPEG":
                    im.convert("RGB").save(p, "JPEG", quality=82, optimize=True, progressive=True)
                elif im.mode in ("RGBA", "LA", "P"):
                    im.convert("RGBA").save(p, "PNG", optimize=True)
                else:
                    im.convert("RGB").save(p, "PNG", optimize=True)
                after = os.path.getsize(p)
                if after < before:
                    shrunk += 1; saved += before - after
            except Exception as e:
                print("  ! image:", f, e)
    print(f"images shrunk: {shrunk}  saved {saved/1024/1024:.1f} MB")

    # ---------- 5b. service worker: serve api/*.json for the file:// case ----------
    write(os.path.join(DEST, "sw.js"), '''/* FilesXins demo: lets the demo run straight from disk (file://).
   Every request for an api/*.php path is answered with the matching snapshot. */
const CACHE = 'fx-demo-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.indexOf('/api/') === -1) return;
  const json = url.pathname.replace(/\.php$/, '.json');
  event.respondWith(
    caches.open(CACHE).then((cache) =>
      fetch(json).then((r) => r.ok ? r : new Response(
        JSON.stringify({ success: false, demo: true, message: 'Snapshot not found.' }),
        { headers: { 'Content-Type': 'application/json' } }))
    ).catch(() => new Response(
      JSON.stringify({ success: false, demo: true, message: 'Offline.' }),
      { headers: { 'Content-Type': 'application/json' } }))
  );
});
''')

    # ---------- 6. landing redirect ----------
    write(os.path.join(DEST, "index.html"), """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>UM-MART \u2014 static demo \u00b7 FilesXins</title>
<meta http-equiv="refresh" content="0; url=./demo/home.html">
<style>body{margin:0;background:#07080d;color:#e6ecff;font:400 15px/1.6 Inter,system-ui,sans-serif;
display:grid;place-items:center;height:100vh;text-align:center}a{color:#00e5ff}</style>
</head><body><div><p>Redirecting to the UM-MART demo\u2026</p>
<p><a href="./demo/home.html">Open the demo \u2192</a></p></div></body></html>""")

    tot = sum(os.path.getsize(os.path.join(r, f))
              for r, _d, fs in os.walk(DEST) for f in fs)
    files = sum(len(fs) for _r, _d, fs in os.walk(DEST))
    print(f"\ndemo ready: {files} files, {tot/1024/1024:.1f} MB -> {DEST}")


if __name__ == "__main__":
    main()
