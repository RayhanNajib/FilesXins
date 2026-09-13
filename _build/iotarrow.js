/* Do the IoT rail arrows actually scroll the track, exactly like the other rails?
   Also: hint removed, no empty space, lightbox still maps the 2 tiles.
   Usage: node _build/iotarrow.js <url> [W] [H] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'], defaultViewport: { width: W, height: H } });
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(async () => {
    const s = window.innerHeight * 0.6;
    for (let y = 0; y < document.body.scrollHeight; y += s) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
  });
  // stop the auto-scroll so manual stepping is measurable
  await p.evaluate(() => { const t = document.querySelector('.rail__track[data-gallery="iot"]');
    t.style.scrollBehavior = 'auto'; t.dataset.autoscroll = 'off'; });
  await wait(700);

  const R = {};
  R.hintRemoved = await p.evaluate(() => {
    const track = document.querySelector('.rail__track[data-gallery="iot"]');
    const rail = track.closest('.rail');
    return { hintsInIotRail: rail.querySelectorAll('.rail__hint').length,
             hintsOnPage: document.querySelectorAll('.rail__hint').length,
             hintVisibleAnywhere: [...document.querySelectorAll('.rail__hint')].some((h) => h.offsetParent !== null) };
  });

  // make the IoT rail scrollable enough to test? it has 2 tiles, scrollW 764 > 547 on desktop
  const before = await p.evaluate(() => +document.querySelector('.rail__track[data-gallery="iot"]').scrollLeft);
  await p.evaluate(() => {
    const track = document.querySelector('.rail__track[data-gallery="iot"]');
    const btn = track.closest('.rail').querySelector('.rail__btn--next');
    btn.scrollIntoView({ block: 'center' });
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await wait(600);
  const afterNext = await p.evaluate(() => +document.querySelector('.rail__track[data-gallery="iot"]').scrollLeft);
  await p.evaluate(() => {
    const track = document.querySelector('.rail__track[data-gallery="iot"]');
    const btn = track.closest('.rail').querySelector('.rail__btn--prev');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await wait(600);
  const afterPrev = await p.evaluate(() => +document.querySelector('.rail__track[data-gallery="iot"]').scrollLeft);
  R.arrowsScroll = { start: before, afterNext, afterPrev, nextMoved: afterNext > before, prevMovedBack: afterPrev < afterNext };

  // each rail must be scrollable by button: measure every rail
  R.allRailsScrollable = await p.evaluate(() => [...document.querySelectorAll('.rail[data-rail]')].map((rail) => {
    const t = rail.querySelector('.rail__track');
    const gap = parseFloat(getComputedStyle(t).gap) || 0;
    const n = t.querySelectorAll('.shot').length;
    const content = [...t.querySelectorAll('.shot')].reduce((a, x) => a + x.getBoundingClientRect().width, 0) + gap * Math.max(0, n - 1);
    return { gallery: t.dataset.gallery, tiles: n, scrollW: Math.round(t.scrollWidth), clientW: Math.round(t.clientWidth),
             contentW: Math.round(content), canScroll: t.scrollWidth > t.clientWidth + 2,
             fillsViewport: content >= t.clientWidth };
  }));

  // lightbox mapping after the earlier removal
  await p.evaluate(() => { const t = document.querySelectorAll('.rail__track[data-gallery="iot"] .shot'); t[t.length - 1].click(); });
  await wait(400);
  R.lightbox = await p.evaluate(() => ({ hidden: document.getElementById('lightbox').hidden,
    src: (document.getElementById('lightboxImg').getAttribute('src') || '').split('/').pop(),
    cap: document.getElementById('lightboxCap').textContent.trim().slice(0, 60) }));
  await p.keyboard.press('Escape');
  await wait(200);

  R.brokenImgs = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')));
  R.errors = errors.slice(0, 6);
  R.viewport = { W, H };
  console.log('###QA###');
  console.log(JSON.stringify(R));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
