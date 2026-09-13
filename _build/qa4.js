/* Why do some rails overflow the page on narrow screens? Measure geometry.
   Usage: node _build/qa4.js <url> <W> <H> <LABEL> */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 390), H = Number(process.argv[4] || 844);
const LABEL = process.argv[5] || 'MOB';

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
    defaultViewport: { width: W, height: H },
  });
  const p = await b.newPage();
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 700));

  const R = await p.evaluate((vw) => {
    const rect = (el) => { const r = el.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; };
    const docW = document.documentElement.clientWidth;
    const out = { vw, docW, scrollW: document.documentElement.scrollWidth, rails: [] };
    out.rails = [...document.querySelectorAll('[data-rail]')].map((rail) => {
      const track = rail.querySelector('.rail__track');
      const g = track?.dataset.gallery || '?';
      const card = rail.closest('article.project');
      const info = card?.querySelector('.project__info');
      const media = card?.querySelector('.project__media');
      const cont = rail.closest('.project__shots-container');
      const cr = rect(rail), tr = track ? rect(track) : null;
      const ov = [...rail.querySelectorAll('*')].filter((el) => el.getBoundingClientRect().right > docW + 1)
        .map((el) => el.tagName.toLowerCase() + '.' + (el.className || '').toString().split(' ')[0]).slice(0, 6);
      return {
        g,
        rail: cr, track: tr,
        trackScrollW: track?.scrollWidth, trackClientW: track?.clientWidth,
        contRect: cont ? rect(cont) : null,
        mediaRect: media ? rect(media) : null,
        infoRect: info ? rect(info) : null,
        gridCols: media ? getComputedStyle(card).gridTemplateColumns : null,
        overflowing: ov,
        railBeyond: cr.r - docW,
        tileH: getComputedStyle(track).getPropertyValue('--tile-h').trim(),
        firstTileW: Math.round(track?.querySelector('.shot')?.getBoundingClientRect().width || 0),
      };
    });
    return out;
  }, W);

  console.log('###QA###');
  console.log(JSON.stringify({ label: LABEL, ...R }));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
