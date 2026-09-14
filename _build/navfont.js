
const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
  await p.goto('https://filesxins.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await new Promise(r => setTimeout(r, 6000));
  const R = await p.evaluate(() => {
    const info = (sel, label) => { const el = document.querySelector(sel); if (!el) return { label, found: false };
      const cs = getComputedStyle(el);
      return { label, text: (el.textContent||'').trim().replace(/\s+/g,' ').slice(0,42), fontFamily: cs.fontFamily, fontSize: cs.fontSize, fontWeight: cs.fontWeight, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform }; };
    return {
      cssVars: [getComputedStyle(document.documentElement).getPropertyValue('--font'), getComputedStyle(document.documentElement).getPropertyValue('--mono')],
      items: [ info('.topbar','topbar'), info('.brand__text b','brand name'), info('.brand__text span','brand sub'),
               info('.nav__link','nav link'), info('.nav__link .mono','nav number'), info('.lang-btn__code','lang code'),
               info('body','body'), info('.hero__title','hero title'), info('.hero__eyebrow','hero eyebrow') ],
      loadedFonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v,i,a)=>a.indexOf(v)===i),
    };
  });
  console.log('###QA###'); console.log(JSON.stringify(R, null, 1));
  await b.close();
})();
