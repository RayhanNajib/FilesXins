/* Capture the revised sections so the result can be reviewed without guessing.
   Usage: node shots.js <url> <outDir> <w> <h>                                  */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const [url, out, W, H] = [process.argv[2], process.argv[3], Number(process.argv[4]), Number(process.argv[5])];
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 1200));

  // reveal everything, then let lazy media settle
  const total = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total + 800; y += 300) { await p.evaluate((v) => window.scrollTo(0, v), y); await new Promise((r) => setTimeout(r, 70)); }
  await new Promise((r) => setTimeout(r, 1200));
  const total2 = await p.evaluate(() => document.body.scrollHeight);
  for (let y = total; y < total2 + 800; y += 300) { await p.evaluate((v) => window.scrollTo(0, v), y); await new Promise((r) => setTimeout(r, 70)); }
  await p.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 800));

  const shots = [
    ['hero', '.hero'],
    ['card06-blender', 'article:nth-of-type(6)'],
    ['card07-video', 'article:nth-of-type(7)'],
    ['card07-rail', '.shots-scroll'],
    ['card08-iot', 'article:nth-of-type(8)'],
    ['certs', '#certs'],
  ];
  for (const [name, sel] of shots) {
    const el = await p.$(sel);
    if (!el) { console.log('missing', name, sel); continue; }
    await el.screenshot({ path: `${out}/${name}.png` }).catch((e) => console.log('ERR', name, e.message));
    console.log('shot', name, sel);
  }
  // footprint of the rail arrows: are they visible and inside the card?
  console.log(JSON.stringify(await p.evaluate(() => {
    const wrap = document.querySelector('.shots-scroll');
    if (!wrap) return null;
    const prev = wrap.querySelector('.shots-scroll__btn--prev'), next = wrap.querySelector('.shots-scroll__btn--next');
    const card = wrap.closest('article').getBoundingClientRect();
    const box = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), vis: getComputedStyle(e).visibility, op: getComputedStyle(e).opacity }; };
    return { card: { x: Math.round(card.x), right: Math.round(card.right) }, prev: box(prev), next: box(next),
             prevInsideCard: prev.getBoundingClientRect().left >= card.left - 1,
             nextInsideCard: next.getBoundingClientRect().right <= card.right + 1 };
  }), null, 1));
  await b.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
