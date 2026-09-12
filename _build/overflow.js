/* Find what actually overflows horizontally, and whether the page can be
   scrolled sideways at all. Usage: node overflow.js <url> <w> <h>          */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const [url, w, h] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4])];
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise((r) => setTimeout(r, 1200));

  const out = await p.evaluate(() => {
    const de = document.documentElement;
    const before = window.scrollX;
    window.scrollTo(9999, window.scrollY);
    const after = window.scrollX;
    window.scrollTo(before, window.scrollY);

    const offenders = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (r.right > de.clientWidth + 1.5) {
        const cs = getComputedStyle(el);
        // is any ancestor clipping it?
        let clipped = false, a = el.parentElement;
        while (a) {
          const s = getComputedStyle(a);
          if (['hidden', 'clip', 'auto', 'scroll'].includes(s.overflowX)) { clipped = true; break; }
          a = a.parentElement;
        }
        offenders.push({
          sel: el.tagName + '.' + String(el.className || '').split(' ').slice(0, 2).join('.'),
          right: Math.round(r.right), w: Math.round(r.width),
          ox: cs.overflowX, clippedByAncestor: clipped,
        });
      }
    });
    return {
      viewport: window.innerWidth,
      clientWidth: de.clientWidth,
      scrollWidth: de.scrollWidth,
      canScrollX: after > 0,
      becameScrollX: after,
      bodyOverflowX: getComputedStyle(document.body).overflowX,
      htmlOverflowX: getComputedStyle(de).overflowX,
      offenders: offenders.slice(0, 25),
    };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
