
const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
    args: ['--no-sandbox'], defaultViewport: { width: 390, height: 844 } });
  const p = await b.newPage();
  await p.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 400));
  const R = await p.evaluate(() => {
    document.querySelector('[data-rail] .shot')?.click();
    const q = (s) => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) }; };
    const lb = document.getElementById('lightbox');
    const navs = [...lb.querySelectorAll('.lightbox__nav')].map(n => ({ cls: n.className, box: (() => { const r = n.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; })(),
      cs: getComputedStyle(n).position }));
    return { lb: q('#lightbox'), fig: q('.lightbox__fig'), img: q('.lightbox__img'), navs,
             lbCS: getComputedStyle(lb).gridTemplateColumns, lbFlow: getComputedStyle(lb).gridAutoFlow,
             vh: window.innerHeight };
  });
  console.log('###QA###'); console.log(JSON.stringify(R));
  await b.close();
})();
