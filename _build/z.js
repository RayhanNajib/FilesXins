/* Why does the topbar sit above the lightbox? Dump stacking info.
   Usage: node _build/z.js <url> [W] [H] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 390), H = Number(process.argv[4] || 844);

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
    defaultViewport: { width: W, height: H } });
  const p = await b.newPage();
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 400));
  await p.evaluate(() => document.querySelector('[data-rail] .shot')?.click());
  await new Promise(r => setTimeout(r, 250));

  const R = await p.evaluate(() => {
    const info = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      return { sel, zIndex: cs.zIndex, position: cs.position, transform: cs.transform === 'none' ? 'none' : 'set',
               filter: cs.filter, backdrop: cs.backdropFilter, opacity: cs.opacity, isolation: cs.isolation,
               parent: el.parentElement ? el.parentElement.tagName.toLowerCase() + '.' + (el.parentElement.className || '').toString().split(' ')[0] : null,
               parentZ: el.parentElement ? getComputedStyle(el.parentElement).zIndex : null,
               parentPos: el.parentElement ? getComputedStyle(el.parentElement).position : null };
    };
    const chain = (el) => { const out = []; let n = el; while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.position !== 'static' || cs.zIndex !== 'auto' || cs.transform !== 'none' || cs.filter !== 'none' || cs.backdropFilter !== 'none' || cs.isolation !== 'auto')
        out.push({ el: n.tagName.toLowerCase() + '.' + (n.className || '').toString().split(' ').slice(0,2).join('.'), pos: cs.position, z: cs.zIndex, tf: cs.transform !== 'none', bf: cs.backdropFilter !== 'none', iso: cs.isolation });
      n = n.parentElement; } return out; };
    const lb = document.getElementById('lightbox');
    const btn = lb.querySelector('.lightbox__close');
    const c = btn.getBoundingClientRect();
    const top = document.elementFromPoint(c.left + c.width/2, c.top + c.height/2);
    return {
      lightbox: info('#lightbox'), close: info('.lightbox__close'), topbar: info('.topbar'),
      lightboxChain: chain(lb), topbarChain: chain(document.querySelector('.topbar')),
      hit: top ? top.tagName.toLowerCase() + '.' + (top.className || '').toString().slice(0, 40) : null,
      hitChain: top ? chain(top).slice(0) : null,
      bodyOverflow: getComputedStyle(document.body).overflow,
      lbHidden: lb.hidden,
      zRules: (() => { const out = []; for (const s of document.styleSheets) { try { for (const r of s.cssRules) {
        if (r.selectorText && /lightbox|topbar|\.nav\b/.test(r.selectorText) && r.style && r.style.zIndex) out.push(r.selectorText + ' -> z=' + r.style.zIndex);
        if (r.cssRules) for (const rr of r.cssRules) if (rr.selectorText && /lightbox|topbar/.test(rr.selectorText) && rr.style && rr.style.zIndex) out.push('@media ' + rr.selectorText + ' -> z=' + rr.style.zIndex);
      } } catch (e) {} } return out; })(),
    };
  });
  console.log('###QA###');
  console.log(JSON.stringify({ vp: W, ...R }));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
