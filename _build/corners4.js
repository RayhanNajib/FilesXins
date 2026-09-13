/* Isolate WHY the bottom corners read square: hide the controls overlay, keep a red
   backdrop, and measure clipped rows per corner.
   Usage: node _build/corners4.js <url> [W] [H] <mode>
   mode: nocontrols | controls */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const MODE = process.argv[5] || 'nocontrols';

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

  const css = MODE === 'nocontrols' ? '.video-controls{display:none!important}'
    : MODE === 'nobackdrop' ? '.video-controls{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'
    : '';
  await p.addStyleTag({ content: css });
  await p.evaluate(() => {
    document.querySelectorAll('.custom-video-player').forEach((pl) => {
      pl.parentElement.style.background = '#FF0000';
    });
  });
  await new Promise(r => setTimeout(r, 300));

  const meta = await p.evaluate(() => [...document.querySelectorAll('.custom-video-player')].map((pl) => {
    const cs = getComputedStyle(pl);
    const v = pl.querySelector('video');
    return { cls: pl.className, radius: cs.borderRadius, overflow: cs.overflow, bg: cs.backgroundColor,
             h: Math.round(pl.getBoundingClientRect().height),
             vbH: v ? Math.round(v.getBoundingClientRect().height) : null,
             vBottom: v ? Math.round(v.getBoundingClientRect().bottom - pl.getBoundingClientRect().bottom) : null };
  }));

  const files = [];
  const els = await p.$$('.custom-video-player');
  for (let i = 0; i < els.length; i++) {
    const f = `${process.env.LOCALAPPDATA}/Temp/iso_${MODE}_${i}.png`.replace(/\\/g, '/');
    await els[i].screenshot({ path: f });
    files.push(f);
  }
  console.log('###QA###');
  console.log(JSON.stringify({ mode: MODE, meta, files }));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
