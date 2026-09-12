/* Verify the portfolio in a real browser: reveals, images, JS errors, the
   filter chips and every lightbox gallery. Prints a JSON report.

   Usage: node verify.js <url> [viewportW viewportH label]                 */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const URL_ = process.argv[2];
const VW = Number(process.argv[3] || 1440);
const VH = Number(process.argv[4] || 900);
const LABEL = process.argv[5] || `${VW}x${VH}`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.setViewport({ width: VW, height: VH, deviceScaleFactor: 1 });

  const errors = [], failed = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });
  page.on('requestfailed', (r) => failed.push(r.url().slice(-90) + ' :: ' + (r.failure() || {}).errorText));
  page.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().slice(-90)); });

  await page.goto(URL_, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 800));

  // walk the page so every IntersectionObserver reveal fires
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 400) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await new Promise((r) => setTimeout(r, 60));
  }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 900));

  const report = await page.evaluate(() => {
    const reveals = document.querySelectorAll('.reveal');
    const inView = document.querySelectorAll('.reveal.is-in');
    const imgs = [...document.images];
    const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0)
      .map((i) => i.getAttribute('src')).filter((s) => s && !s.startsWith('data:'));
    // real overflow only: content past the viewport with NOTHING clipping it.
    // Decorative layers (marquee track, grain, rings) are clipped on purpose,
    // so scrollWidth > clientWidth alone is not evidence of a bug.
    const wide = [...document.querySelectorAll('*')].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= document.documentElement.clientWidth + 1.5) return false;
      let a = el.parentElement;
      while (a) {
        if (['hidden', 'clip', 'auto', 'scroll'].includes(getComputedStyle(a).overflowX)) return false;
        a = a.parentElement;
      }
      return true;
    }).map((el) => el.tagName + '.' + (el.className || '').toString().split(' ')[0]);
    return {
      reveals: reveals.length,
      revealsIn: inView.length,
      missingAlt: [...document.images].filter((i) => !i.alt && i.getAttribute('src'))
        .map((i) => i.getAttribute('src')),
      brokenImgs: broken,
      overflow: [...new Set(wide)].slice(0, 8),
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
      canScrollX: (() => { window.scrollTo(9999, window.scrollY); const x = window.scrollX;
        window.scrollTo(0, window.scrollY); return x > 0; })(),
      cards: document.querySelectorAll('[data-tags]').length,
      videos: document.querySelectorAll('video').length,
      galleryTriggers: document.querySelectorAll('[data-gallery]').length,
    };
  });

  // every filter chip must leave at least one card visible
  const chips = await page.$$('.chip[data-filter]');
  const filters = {};
  for (const chip of chips) {
    const f = await chip.evaluate((c) => c.dataset.filter);
    await chip.click();
    await new Promise((r) => setTimeout(r, 250));
    filters[f] = await page.evaluate(() => {
      const cards = [...document.querySelectorAll('[data-tags]')];
      return cards.filter((c) => c.style.display !== 'none').length;
    });
  }
  await page.evaluate(() => document.querySelector('.chip[data-filter="all"]').click());

  // open each lightbox and confirm its image really loads
  const galleries = [...new Set(await page.evaluate(() =>
    [...document.querySelectorAll('[data-gallery]')].map((e) => e.dataset.gallery)))];
  const lightbox = {};
  for (const g of galleries) {
    lightbox[g] = await page.evaluate(async (name) => {
      const t = document.querySelector(`[data-gallery="${name}"]`);
      t.click();
      await new Promise((r) => setTimeout(r, 450));
      const lb = document.querySelector('.lightbox');
      const open = !!(lb && !lb.hidden && getComputedStyle(lb).display !== 'none');
      const img = lb && lb.querySelector('img');
      const ok = !!(img && img.complete && img.naturalWidth > 0);
      const lbImg = lb ? lb.querySelectorAll('img').length : 0;
      // count how many entries that gallery has by stepping once
      lb && lb.querySelector('.lightbox__close') && lb.querySelector('.lightbox__close').click();
      return { open, imgLoaded: ok, imgs: lbImg };
    }, g);
  }

  // step through one entry of every gallery to prove the whole set loads
  report.galleryDepth = await page.evaluate(async () => {
    const out = {};
    const names = [...new Set([...document.querySelectorAll('[data-gallery]')].map((e) => e.dataset.gallery))];
    for (const n of names) {
      document.querySelector(`[data-gallery="${n}"]`).click();
      await new Promise((r) => setTimeout(r, 200));
      const lb = document.querySelector('.lightbox');
      let frames = 0, bad = 0, guard = 0;
      const seen = new Set();
      for (;;) {
        if (guard++ > 120) break;
        const img = document.getElementById('lightboxImg');
        const key = img.getAttribute('src');
        if (!key || seen.has(key)) break;
        seen.add(key);
        frames++;
        await new Promise((r) => { if (img.complete) r(); else img.onload = img.onerror = r; setTimeout(r, 3000); });
        if (!img.naturalWidth) bad++;
        lb.querySelector('.lightbox__nav--next').click();
        await new Promise((r) => setTimeout(r, 90));
      }
      out[n] = { frames, failed: bad };
      lb.querySelector('.lightbox__close').click();
      await new Promise((r) => setTimeout(r, 120));
    }
    return out;
  });

  report.filters = filters;
  report.lightbox = lightbox;
  report.errors = errors;
  report.failedRequests = failed;
  console.log(LABEL + ' ' + JSON.stringify(report, null, 1));
  await browser.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
