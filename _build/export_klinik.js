// Export the KlinikUM Laravel app to a self-contained static site.
//
// Laravel + Blade is server-rendered, so it cannot run on Vercel. This walks
// the real authenticated pages against the local Laravel dev server and saves
// each one as standalone HTML with its CSS inlined, its images copied, and its
// AJAX dependencies answered from captured JSON snapshots.
//
// Usage: node export_klinik.js <config.json>
//
// config.json = { base, out, site, password, routes:[{ name, path, role|null, title }] }

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const SITE = path.join(cfg.out, 'site');

// Logins used only against the local dev server; never part of the output.
const LOGINS = {
  admin:   { email: 'admin@klinikum.id',   password: cfg.password },
  doctor:  { email: 'dokter@klinikum.id',  password: cfg.password },
  patient: { email: 'mahasiswa@um.ac.id',  password: cfg.password },
};

// Inline SVG favicon so the pages never request a missing /favicon.ico.
const FAVICON = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
  '<circle cx="16" cy="16" r="15" fill="#0F172A" stroke="#22D3EE" stroke-width="2"/>' +
  '<path d="M16 8l2.4 5.2L24 16l-5.6 2.8L16 24l-2.4-5.2L8 16l5.6-2.8z" fill="#22D3EE"/></svg>');

/**
 * Recursively download every same-origin asset a page references, including
 * the images that stylesheets pull in through url(). Inlined CSS loses its
 * original base path, so those url() values are rewritten at inline time.
 */
async function pullAssets(page, base, outDir, keep) {
  const urls = await page.evaluate((origin) => {
    const found = new Set();
    const add = (u) => { if (u && u.startsWith(origin)) found.add(u.split('#')[0]); };
    document.querySelectorAll('img[src]').forEach((e) => add(e.src));
    document.querySelectorAll('link[rel=stylesheet][href]').forEach((e) => add(e.href));
    document.querySelectorAll('script[src]').forEach((e) => add(e.src));
    document.querySelectorAll('[style*="url("]').forEach((e) => {
      const m = e.getAttribute('style').matchAll(/url\((['"]?)([^'")]+)\1\)/g);
      for (const g of m) add(new URL(g[2], location.href).href);
    });
    return [...found];
  }, base);

  const relOf = (u) => decodeURIComponent(new URL(u).pathname).replace(/^\/+/, '');

  const getBytes = async (u) => {
    const arr = await page.evaluate(async (url) => {
      try {
        const r = await fetch(url, { credentials: 'include' });
        if (!r.ok) return null;
        return Array.from(new Uint8Array(await r.arrayBuffer()));
      } catch (e) { return null; }
    }, u);
    return arr ? Buffer.from(arr) : null;
  };

  const save = (u, buf) => {
    const dest = path.join(outDir, relOf(u));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    keep.add(u);
  };

  // ---- pass 1: the assets the DOM points at ------------------------------
  const map = {}, text = {};
  for (const u of urls) {
    const isCss = /\.css(\?|$)/.test(u);
    try {
      if (isCss) {
        if (text[u] === undefined) {
          text[u] = await page.evaluate(async (url) => {
            const r = await fetch(url, { credentials: 'include' });
            return r.ok ? await r.text() : null;
          }, u);
        }
        const buf = await getBytes(u);
        if (buf) { map[u] = relOf(u); if (!keep.has(u)) save(u, buf); }
      } else {
        if (!keep.has(u)) { const buf = await getBytes(u); if (buf) save(u, buf); }
        map[u] = relOf(u);
      }
    } catch (e) { /* skip */ }
  }

  // ---- pass 2: url(...) targets referenced from inside those stylesheets --
  // Keyed by "<cssUrl>|<raw ref>" so the inline step can rewrite each one.
  const cssUrls = {};
  for (const [cssUrl, cssText] of Object.entries(text)) {
    if (!cssText) continue;
    cssUrls[cssUrl] = {};
    for (const m of cssText.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
      const raw = m[2].trim();
      if (/^(data:|https?:|\/\/)/i.test(raw)) continue;
      const abs = new URL(raw, cssUrl).href.split('#')[0];
      if (!abs.startsWith(base)) continue;
      try {
        if (!keep.has(abs)) { const buf = await getBytes(abs); if (buf) save(abs, buf); }
        cssUrls[cssUrl][raw] = relOf(abs);
      } catch (e) { /* skip */ }
    }
  }

  return { map, text, cssUrls };
}

(async () => {
  fs.mkdirSync(SITE, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars'],
  });

  const keep = new Set();
  const manifest = [];
  const byRole = {};

  const signIn = async (page, role) => {
    await page.goto(`${cfg.base}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    // Clear only the credential fields. Never touch hidden inputs — the
    // Laravel CSRF token lives in one, and wiping it yields a 419 bounce.
    for (const sel of ['input[name=email]', 'input[name=password]']) {
      await page.evaluate((s) => { const el = document.querySelector(s); if (el) el.value = ''; }, sel);
    }
    await page.type('input[name=email]', LOGINS[role].email, { delay: 8 });
    await page.type('input[name=password]', LOGINS[role].password, { delay: 8 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}),
      page.click('button[type=submit]'),
    ]);
    const err = await page.evaluate(() => {
      const e = document.querySelector('.invalid-feedback, .alert-danger, .alert, .text-danger, [role=alert]');
      return e ? e.innerText.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
    });
    return err;
  };

  const login = async (role) => {
    const ctx = await browser.createBrowserContext();
    const page = await ctx.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    let landed = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      const err = await signIn(page, role);
      landed = page.url();
      if (!landed.includes('/login')) break;
      console.log(`  retry ${role} (attempt ${attempt})${err ? ': ' + err : ''}`);
      await new Promise((r) => setTimeout(r, 1500));
    }
    return { ctx, page, landed };
  };

  // one authenticated session per role, reused for its pages
  for (const role of ['admin', 'doctor', 'patient']) {
    if (cfg.routes.some((r) => r.role === role)) {
      byRole[role] = await login(role);
      console.log(`  login ${role} -> ${byRole[role].landed.replace(cfg.base, '')}`);
    }
  }

  // ---- AJAX snapshots: the dashboards chart their data client-side --------
  const ajax = {};
  if (byRole.admin) {
    const endpoint = `${cfg.base}/chart-data`;
    for (const range of ['7days', '30days', '1year']) {
      const data = await byRole.admin.page.evaluate(async (url) => {
        try {
          const r = await fetch(url, { credentials: 'include', headers: { 'Accept': 'application/json' } });
          if (!r.ok) return null;
          return await r.json();
        } catch (e) { return null; }
      }, `${endpoint}?range=${range}`);
      if (data) { ajax[range] = data; console.log(`  ajax chart-data?range=${range} captured`); }
    }
    ajax.default = ajax['7days'] || null;
    if (!ajax.default) console.log('  WARN: chart-data unavailable — the chart will render empty');
  }
  const ajaxJson = JSON.stringify(ajax).replace(/</g, '\\u003c');

  for (const route of cfg.routes) {
    const sess = route.role ? byRole[route.role] : null;
    const ctx = sess ? null : await browser.createBrowserContext();
    const page = sess ? sess.page : await ctx.newPage();
    if (!sess) await page.setViewport({ width: 1440, height: 900 });

    const url = cfg.base + route.path;
    const rec = { name: route.name, url, ok: false };
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1200));

      const { map: assetMap, text: textMap, cssUrls } = await pullAssets(page, cfg.base, cfg.out, keep);

      // Page lives at <out>/site/<route>/index.html (index sits at <site>/),
      // while assets land at <out>/<original path>/. So climbing out means one
      // '..' per route segment plus one more to leave the 'site' directory.
      const segs = route.name === 'index' ? 0 : route.name.split('/').length;
      const up = '../'.repeat(segs + 1);

      const html = await page.evaluate(({ assetMap, textMap, cssUrls, ajaxJson, up, base, favicon }) => {
        const clone = document.documentElement.cloneNode(true);
        const prefix = up.slice(0, -1);          // './..', '../../..', ...

        // --- inline stylesheets, rewriting their url() references ---------
        clone.querySelectorAll('link[rel=stylesheet][href]').forEach((link) => {
          const abs = link.href.split('#')[0];
          const rel = assetMap[abs];
          if (!rel) return;
          let css = textMap[abs] || '';
          const refs = cssUrls[abs] || {};
          // An inlined sheet resolves url() against the PAGE, not the sheet,
          // so repoint every relative reference at the copied asset.
          css = css.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, raw) => {
            const trimmed = raw.trim();
            const target = refs[trimmed];
            return target ? `url("${prefix}/${target}")` : m;
          });
          const st = document.createElement('style');
          st.textContent = `/* ${rel} */\n` + css;
          st.dataset.src = rel;
          link.replaceWith(st);
        });

        // --- inline same-origin scripts -----------------------------------
        clone.querySelectorAll('script[src]').forEach((s) => {
          const abs = s.src.split('#')[0];
          const rel = assetMap[abs];
          if (!rel) return;
          const n = document.createElement('script');
          n.dataset.src = rel;
          s.replaceWith(n);
        });

        // --- rewrite remaining local references ---------------------------
        clone.querySelectorAll('img[src]').forEach((e) => {
          const rel = assetMap[e.src.split('#')[0]];
          if (rel) e.setAttribute('src', prefix + '/' + rel);
        });
        clone.querySelectorAll('[style*="url("]').forEach((e) => {
          e.setAttribute('style', e.getAttribute('style').replace(
            /url\((['"]?)([^'")]+)\1\)/g,
            (m, q, u) => {
              const rel = assetMap[new URL(u, base).href.split('#')[0]];
              return rel ? `url(${q}${prefix}/${rel}${q})` : m;
            }));
        });
        clone.querySelectorAll('a[href]').forEach((a) => {
          const href = a.getAttribute('href');
          if (!href || href.startsWith('#')) return;
          if (href.startsWith(base)) a.setAttribute('href', up + 'index.html');
          else if (/^https?:/.test(href)) a.setAttribute('target', '_blank');
        });

        // --- neutralise the back end --------------------------------------
        clone.querySelectorAll('form').forEach((f) => {
          f.setAttribute('onsubmit', 'return false');
          f.setAttribute('action', 'javascript:void 0');
          f.querySelectorAll('button[type=submit],input[type=submit]').forEach((b) => {
            b.setAttribute('disabled', 'disabled');
            b.setAttribute('title', 'Disabled in the static demo — no PHP back end here');
          });
        });

        // --- favicon: inline, so no page ever 404s on /favicon.ico --------
        clone.querySelectorAll('link[rel~=icon]').forEach((l) => l.remove());
        const ico = document.createElement('link');
        ico.rel = 'icon'; ico.type = 'image/svg+xml'; ico.href = favicon;
        clone.querySelector('head').prepend(ico);

        // --- answer the chart's AJAX from the captured snapshot -----------
        const shim = document.createElement('script');
        shim.textContent =
          'window.__CHART__ = ' + ajaxJson + ';\n' +
          '(function(){ var f = window.fetch;\n' +
          '  window.fetch = function(u, o){ var s = String(u);\n' +
          '    if (s.indexOf("chart-data") !== -1) {\n' +
          '      var m = s.match(/range=([a-z0-9]+)/i), k = m ? m[1] : "default";\n' +
          '      var d = window.__CHART__[k] || window.__CHART__.default;\n' +
          '      return Promise.resolve(new Response(JSON.stringify(d), {status:200,\n' +
          '        headers:{"Content-Type":"application/json"}})); }\n' +
          '    return f.apply(this, arguments); };\n' +
          '  if (window.jQuery) { jQuery.ajaxPrefilter(function(opts, orig, jqXHR){\n' +
          '    if (String(opts.url).indexOf("chart-data") !== -1) {\n' +
          '      var m = String(opts.url).match(/range=([a-z0-9]+)/i), k = m ? m[1] : "default";\n' +
          '      opts.dataType = "json";\n' +
          '      opts.url = "data:application/json," + encodeURIComponent(JSON.stringify(\n' +
          '        window.__CHART__[k] || window.__CHART__.default)); } }); }\n' +
          '})();';
        clone.querySelector('head').prepend(shim);

        // --- banner explaining what this is -------------------------------
        const bar = document.createElement('div');
        bar.id = 'demo-banner';
        bar.innerHTML = '<b>Static demo</b> — the Laravel back end is not running here, so forms and data writes are disabled. Screens and layout are the real application.';
        clone.querySelector('body').prepend(bar);
        const st = document.createElement('style');
        st.textContent = `
          #demo-banner{position:fixed;left:0;right:0;bottom:0;z-index:99999;
            background:#0F172A;color:#A7B2CC;font:13px/1.5 Inter,system-ui,sans-serif;
            padding:9px 16px;text-align:center;border-top:1px solid rgba(34,211,238,.25)}
          #demo-banner b{color:#22D3EE}
          body{padding-bottom:44px}
          [disabled]{cursor:not-allowed!important;opacity:.6}`;
        clone.querySelector('head').appendChild(st);
        return '<!DOCTYPE html>\n' + clone.outerHTML;
      }, { assetMap, textMap, cssUrls, ajaxJson, up, base: cfg.base, favicon: FAVICON });

      const dir = route.name === 'index' ? SITE : path.join(SITE, route.name);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'index.html'), html);

      const meta = await page.evaluate(() => ({
        title: document.title,
        rows: document.querySelectorAll('table tbody tr').length,
        imgs: [...document.images].filter((i) => i.complete && i.naturalWidth > 0).length,
        broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length,
      }));
      rec.ok = true;
      rec.meta = meta;
      rec.bytes = fs.statSync(path.join(dir, 'index.html')).size;
      console.log(`  ok  ${route.name.padEnd(22)} ${String(rec.bytes).padStart(7)}b  rows=${meta.rows} imgs=${meta.imgs}/${meta.imgs + meta.broken}  ${meta.title.slice(0, 38)}`);
    } catch (e) {
      rec.error = String(e).slice(0, 160);
      console.log(`  FAIL ${route.name}: ${rec.error}`);
    }
    manifest.push(rec);
    if (ctx) await ctx.close();
  }

  for (const role of Object.keys(byRole)) await byRole[role].ctx.close();
  await browser.close();
  fs.writeFileSync(path.join(cfg.out, 'export-manifest.json'), JSON.stringify(manifest, null, 1));
  const ok = manifest.filter((m) => m.ok).length;
  const size = fs.readdirSync(cfg.out, { recursive: true })
    .map((f) => { try { return fs.statSync(path.join(cfg.out, f)).size; } catch { return 0; } })
    .reduce((a, b) => a + b, 0);
  console.log(`\nexported ${ok}/${manifest.length} pages, ${(size / 1048576).toFixed(1)} MB -> ${cfg.out}`);
})();
