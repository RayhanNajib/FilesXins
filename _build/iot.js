/* Verify the IoT gallery after the two tiles were removed: the lightbox cursor must
   still map index -> image/caption correctly, with no reference to the deleted files.
   Usage: node _build/iot.js <url> [W] [H] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const DROPPED = ['iot-device-photo', 'ws-fritzing-rakaat'];

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'], defaultViewport: { width: W, height: H } });
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  const reqs = [];
  p.on('request', (r) => reqs.push(r.url()));
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(async () => {
    const s = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += s) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
  });
  await wait(500);

  const R = {};
  // the rail itself
  R.rail = await p.evaluate(() => {
    const t = document.querySelector('.rail__track[data-gallery="iot"]');
    const tiles = [...t.querySelectorAll('.shot')];
    const r = t.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(t).gap) || 0;
    const w = tiles.map((x) => x.getBoundingClientRect().width);
    const content = w.reduce((a, c) => a + c, 0) + gap * Math.max(0, tiles.length - 1);
    return {
      count: tiles.length,
      srcs: tiles.map((x) => (x.querySelector('img').getAttribute('src') || '').split('/').pop()),
      captions: tiles.map((x) => x.querySelector('figcaption').textContent.trim().replace(/\s+/g, ' ')),
      idx: tiles.map((x) => x.dataset.i),
      railW: Math.round(r.width), contentW: Math.round(content),
      fillPct: Math.round(content / r.width * 100),
      distinctHeights: [...new Set(tiles.map((x) => Math.round(x.getBoundingClientRect().height)))],
    };
  });

  // the gallery array the lightbox actually reads (built from the DOM)
  R.gallery = await p.evaluate(() => (window.GALLERIES && window.GALLERIES.iot) || null);

  // open the last tile via click -> the lightbox must show that same image, not a stale one
  await p.evaluate(() => {
    const t = document.querySelector('.rail__track[data-gallery="iot"]');
    const tiles = [...t.querySelectorAll('.shot')];
    tiles[tiles.length - 1].click();
  });
  await wait(400);
  R.lastTileOpens = await p.evaluate(() => {
    const lb = document.getElementById('lightbox');
    return { hidden: lb.hidden, src: (document.getElementById('lightboxImg').getAttribute('src') || '').split('/').pop(),
             cap: document.getElementById('lightboxCap').textContent.trim() };
  });
  // stepping past the end must wrap, not blank out
  await p.evaluate(() => { const el = document.querySelector('.lightbox__nav--next'); const r = el.getBoundingClientRect(); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await wait(350);
  R.wrapsToFirst = await p.evaluate(() => ({ hidden: document.getElementById('lightbox').hidden,
    src: (document.getElementById('lightboxImg').getAttribute('src') || '').split('/').pop() }));

  R.droppedStillReferenced = await p.evaluate((names) => {
    const html = document.documentElement.outerHTML;
    return names.filter((n) => html.includes(n));
  }, DROPPED);
  R.droppedRequested = reqs.filter((u) => DROPPED.some((n) => u.includes(n)));
  R.brokenImgs = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')));
  R.errors = errors.slice(0, 6);
  R.viewport = { W, H };
  console.log('###QA###');
  console.log(JSON.stringify(R));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
