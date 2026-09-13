const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'https://filesxins.vercel.app/';
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  const errors = [], failed = [];
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0,180)); });
  p.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0,180)));
  p.on('requestfailed', r => failed.push(r.url().split('/').pop()));
  p.on('response', r => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().split('/').pop()); });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 2500));
  const out = await p.evaluate(() => {
    const R = {};
    const projs = [...document.querySelectorAll('.project')];
    R.order = projs.map(x => (x.querySelector('.project__num')?.textContent.trim()||'?') + '|' + (x.querySelector('.project__title')?.textContent.replace(/\s+/g,' ').trim()||'').slice(0,52));
    R.gal = projs.map(x => {
      const shots = [...x.querySelectorAll('.shot')];
      const broken = shots.filter(s => { const im = s.querySelector('img'); return !im || !im.complete || im.naturalWidth === 0; }).length;
      const g = x.querySelector('.project__shots'); const b = x.getBoundingClientRect();
      return { n: shots.length, broken, gridH: g?Math.round(g.getBoundingClientRect().height):0, cardH: Math.round(b.height), hasRail: !!x.querySelector('.shots-scroll'), first: (x.querySelector('.shot img')?.getAttribute('src')||'').split('/').pop()||'-', gridW: g?Math.round(g.scrollWidth):0 };
    });
    const symbols = new Set([...document.querySelectorAll('symbol')].map(s => s.id));
    R.nSymbols = symbols.size;
    R.sampleSymbols = [...symbols].slice(0,10);
    const uses = [...document.querySelectorAll('use')].map(u => (u.getAttribute('href')||u.getAttribute('xlink:href')||''));
    R.missingUse = [...new Set(uses.filter(h => h.startsWith('#') && !symbols.has(h.slice(1))))];
    R.totalUses = uses.length;
    R.brokenImgs = [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')).slice(0,20);
    R.imgCount = document.images.length;
    R.canScrollX = document.documentElement.scrollWidth > window.innerWidth + 1;
    R.players = [...document.querySelectorAll('.custom-video-player')].map(v => {
      const r = v.getBoundingClientRect();
      return { ratio: +(r.width / r.height).toFixed(2), w: Math.round(r.width), btns: [...v.querySelectorAll('.v-btn')].map(b => b.className.replace('v-btn','').trim()).join(','), iconUses: [...v.querySelectorAll('use')].length };
    });
    R.yt = [...document.querySelectorAll('iframe')].map(f => f.src.split('/embed/')[1]||f.src);
    R.certCards = document.querySelectorAll('.cert-card').length;
    R.paginBar = !!document.querySelector('.certs-pagination-bar');
    R.paginBtns = [...document.querySelectorAll('.certs-page-btn')].map(b => b.textContent.trim());
    R.videoTags = [...document.querySelectorAll('video')].map(v => { const r=v.getBoundingClientRect(); return { ratio:+(r.width/r.height).toFixed(2), src:(v.getAttribute('src')||'').split('/').pop() }; });
    return R;
  });
  console.log(JSON.stringify({ errors: [...new Set(errors)].slice(0,8), failed: [...new Set(failed)].slice(0,15), ...out }, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
