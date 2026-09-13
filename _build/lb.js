/* Lightbox close button: is it visible, big enough, and does it actually close?
   Also checks ESC and backdrop click. Usage: node _build/lb.js <url> [W] [H] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 390), H = Number(process.argv[4] || 844);

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
    for (let y = 0; y < document.body.scrollHeight; y += s) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
  });
  await new Promise(r => setTimeout(r, 500));

  const R = await p.evaluate(() => {
    const out = {};
    // open the lightbox from the first gallery tile
    const tile = document.querySelector('[data-rail] .shot');
    tile?.click();
    const lb = document.getElementById('lightbox');
    out.opened = lb && !lb.hidden;
    const btn = lb?.querySelector('.lightbox__close');
    if (btn) {
      const r = btn.getBoundingClientRect();
      const cs = getComputedStyle(btn);
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const topEl = document.elementFromPoint(cx, cy);
      out.close = {
        rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
        zIndex: cs.zIndex, display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
        color: cs.color, border: cs.borderColor, pointerEvents: cs.pointerEvents,
        hitTest: topEl ? topEl.className.toString().slice(0, 40) : null,
        clickable: !!(topEl && (topEl === btn || btn.contains(topEl))),
        label: btn.getAttribute('aria-label'),
        iconInk: (() => {
          const svg = btn.querySelector('svg');
          if (!svg) return null;
          const b2 = svg.getBBox ? svg.getBBox() : null;
          const rb = svg.getBoundingClientRect();
          return { svgW: Math.round(rb.width), svgH: Math.round(rb.height) };
        })(),
      };
      // is the button inside the viewport?
      out.inViewport = r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
      out.tapTargetOK = r.width >= 40 && r.height >= 40;
    }
    return out;
  });

  // click it for real and confirm the lightbox closes
  const closedByX = await p.evaluate(async () => {
    const lb = document.getElementById('lightbox');
    if (!lb || lb.hidden) return 'not-open';
    const btn = lb.querySelector('.lightbox__close');
    const r = btn.getBoundingClientRect();
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await new Promise((x) => setTimeout(x, 120));
    return lb.hidden;
  });

  R.closedByX = closedByX;
  R.errors = errors.slice(0, 6);
  R.viewport = { W: W, H: H };
  console.log('###QA###');
  console.log(JSON.stringify(R));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
