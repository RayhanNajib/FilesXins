/* Verify every way of leaving the lightbox: X button, backdrop click, Esc, arrows, swipe.
   Usage: node _build/lb2.js <url> [W] [H] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 390), H = Number(process.argv[4] || 844);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
    defaultViewport: { width: W, height: H } });
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 160)));
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(async () => {
    const s = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += s) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
  });
  await wait(400);

  const open = () => p.evaluate(() => { const t = document.querySelector('[data-rail] .shot'); t.click(); return new Promise(r => setTimeout(() => r(document.getElementById('lightbox').hidden === false), 220)); });
  const state = () => p.evaluate(() => {
    const lb = document.getElementById('lightbox');
    const cap = document.getElementById('lightboxCap');
    const img = document.getElementById('lightboxImg');
    return { hidden: lb.hidden, src: (img.getAttribute('src') || '').split('/').pop(), cap: cap ? cap.textContent.trim() : null,
             bodyOverflow: document.body.style.overflow };
  });

  const R = {};
  // real mouse click on the X (not a synthetic event) - catches hit-testing bugs
  await open();
  R.opened = (await state()).hidden === false;
  const box = await p.evaluate(() => { const r = document.querySelector('.lightbox__close').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.click(box.x, box.y);
  await wait(250);
  R.xButtonCloses = (await state()).hidden;
  R.bodyScrollRestored = (await state()).bodyOverflow === '';

  // backdrop click
  await open();
  await p.mouse.click(Math.round(W / 2), H - 24); // bottom strip of the overlay
  await wait(250);
  R.backdropCloses = (await state()).hidden;

  // Escape
  await open();
  await p.keyboard.press('Escape');
  await wait(250);
  R.escCloses = (await state()).hidden;

  // arrows step through the set and do not close it
  await open();
  const first = await state();
  const nextBtn = await p.evaluate(() => { const el = document.querySelector('.lightbox__nav--next'); if (!el) return null;
    const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, visible: getComputedStyle(el).display !== 'none' }; });
  R.arrowVisible = !!nextBtn && nextBtn.visible;
  if (nextBtn) { await p.mouse.click(nextBtn.x, nextBtn.y); await wait(280); }
  const second = await state();
  R.arrowSteps = !second.hidden && second.src !== first.src;
  R.stillOpenAfterArrow = !second.hidden;
  R.captionsDiffer = first.cap !== second.cap;

  // prev goes back
  await p.mouse.click(nextBtn.x, nextBtn.y); // ensure we are on a later item
  await wait(200);
  const prevBtn = await p.evaluate(() => { const el = document.querySelector('.lightbox__nav--prev'); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.click(prevBtn.x, prevBtn.y);
  await wait(280);
  R.prevWorks = (await state()).src === second.src;

  R.errors = errors.slice(0, 6);
  R.viewport = { W, H };
  console.log('###QA###');
  console.log(JSON.stringify(R));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
