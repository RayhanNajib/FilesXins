/* Where exactly is the dead space in a stacked card? Usage: node _build/qa5.js <url> <W> <H> [num] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 390), H = Number(process.argv[4] || 844);
const NUM = process.argv[5] || '05';

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
    defaultViewport: { width: W, height: H } });
  const p = await b.newPage();
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(async () => {
    const s = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += s) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
    window.scrollTo(0, 0);
  });
  await new Promise(r => setTimeout(r, 700));

  const R = await p.evaluate((num) => {
    const card = [...document.querySelectorAll('article.project')].find((a) => a.querySelector('.project__index')?.textContent.trim() === num);
    if (!card) return { error: 'card not found' };
    const box = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return {
      tag: el.tagName.toLowerCase() + (el.className ? '.' + el.className.toString().split(' ').slice(0, 2).join('.') : ''),
      top: Math.round(r.top - card.getBoundingClientRect().top), bottom: Math.round(r.bottom - card.getBoundingClientRect().top),
      h: Math.round(r.height), w: Math.round(r.width),
      mt: cs.marginTop, mb: cs.marginBottom, pt: cs.paddingTop, pb: cs.paddingBottom,
      minH: cs.minHeight, alignSelf: cs.alignSelf, rowGap: cs.rowGap };
    };
    const body = card.querySelector('.project__body');
    return {
      num,
      card: box(card), body: box(body),
      children: [...body.children].map(box),
      deep: [...body.querySelectorAll(':scope > * > *')].map(box),
      videosGrid: (() => { const vg = card.querySelector('.project__videos-grid'); if (!vg) return null;
        return { self: box(vg), kids: [...vg.children].map(box) }; })(),
      railSection: (() => { const s = card.querySelector('.project__shots-container'); return s ? { self: box(s), kids: [...s.children].map(box) } : null; })(),
    };
  }, NUM);

  console.log('###QA###');
  console.log(JSON.stringify({ w: W, ...R }));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
