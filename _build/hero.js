
const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox','--force-device-scale-factor=1'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 90000 });
  await p.evaluate(async () => { window.scrollTo(0, document.body.scrollHeight); await new Promise(r=>setTimeout(r,600)); window.scrollTo(0,0); });
  await new Promise(r=>setTimeout(r,900));
  const out = await p.evaluate(() => {
    const q = s => document.querySelector(s);
    const r = e => { if(!e) return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}; };
    const cs = (e,pr) => e ? getComputedStyle(e)[pr] : null;
    const hero = q('.hero'), grid = q('.hero__grid'), holo = q('.holo'), frame = q('.holo__frame');
    const img = q('.holo__img');
    const stats = [...document.querySelectorAll('.hero__stats dd')].map(e=>e.textContent.trim());
    const dt = [...document.querySelectorAll('.hero__stats dt')].map(e=>e.textContent.trim());
    const facts = [...document.querySelectorAll('.hero__facts li')].map(e=>e.textContent.trim().replace(/\s+/g,' '));
    const marq = q('.marquee');
    const next = document.querySelector('#projects');
    return {
      heroId: hero && hero.id,
      heroPadTop: cs(hero,'paddingTop'),
      gridCols: cs(grid,'gridTemplateColumns'),
      holo: r(holo), holoAspect: cs(holo,'aspectRatio'),
      frame: r(frame), imgRect: r(img),
      imgSrc: img && img.getAttribute('src'), imgNatural: img && [img.naturalWidth, img.naturalHeight],
      imgComplete: img && img.complete,
      stats, dt, facts,
      marqueeRect: r(marq), marqueeSpans: document.querySelectorAll('.marquee__track span').length,
      marqueeAnim: cs(q('.marquee__track'),'animationName'),
      heroBottomToNext: next ? Math.round(next.getBoundingClientRect().top - hero.getBoundingClientRect().bottom) : null,
      rings: document.querySelectorAll('.holo__ring').length,
      chips: [...document.querySelectorAll('.holo__chip')].map(e=>e.textContent.trim()),
      caption: (q('.holo__caption')||{}).textContent,
      copyLeft: r(q('.hero__copy')), avatarRight: r(q('.hero__avatar')),
      lightboxCaptionColor: cs(q('.lightbox__caption'),'color'),
      lbImgRule: cs(q('.lightbox__img'),'maxWidth'),
    };
  });
  out.errors = errs;
  console.log('###QA###' + JSON.stringify(out));
  await b.close();
})();
