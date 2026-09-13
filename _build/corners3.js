/* Decisive: put a pure-red backdrop immediately BEHIND each video player (its own
   parent), screenshot, and check at which corners red shows through the radius.
   Usage: node _build/corners3.js <url> [W] [H] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
    defaultViewport: { width: W, height: H } });
  const p = await b.newPage();
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(async () => {
    const s = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += s) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  });
  await new Promise(r => setTimeout(r, 700));

  const meta = await p.evaluate(() => {
    const players = [...document.querySelectorAll('.custom-video-player')];
    return players.map((pl, i) => {
      // paint the immediate backdrop red so the corner shape is unambiguous
      pl.parentElement.style.background = '#FF0000';
      pl.parentElement.style.paddingTop = '0px';
      const cs = getComputedStyle(pl);
      const v = pl.querySelector('video');
      return {
        i,
        cls: pl.className,
        radius: cs.borderRadius,
        overflow: cs.overflow,
        h: Math.round(pl.getBoundingClientRect().height),
        w: Math.round(pl.getBoundingClientRect().width),
        videoRadius: v ? getComputedStyle(v).borderRadius : null,
      };
    });
  });
  await new Promise(r => setTimeout(r, 300));

  const files = [];
  const els = await p.$$('.custom-video-player');
  for (let i = 0; i < els.length; i++) {
    const f = `${process.env.LOCALAPPDATA}/Temp/red_${i}.png`.replace(/\\/g, '/');
    await els[i].screenshot({ path: f });
    files.push(f);
  }
  console.log('###QA###');
  console.log(JSON.stringify({ meta, files, w: W }));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
