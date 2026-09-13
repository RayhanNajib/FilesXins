/* Screenshot each container so the result is judged by eye, not by source.
   Usage: node _build/shots3.js <url> <width> <height> <outdir> */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const OUT = process.argv[5] || 'C:/Users/WA/AppData/Local/Temp/fx-shots';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 600000,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'] });
  const p = await b.newPage();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });

  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight * 0.8) {
      window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90));
    }
    document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; });
    await Promise.race([
      Promise.all([...document.images].map(i => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()))),
      new Promise(r => setTimeout(r, 20000))
    ]);
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 700));
  });

  const targets = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('article.project').forEach((a) => {
      out.push({ id: 'card-' + (a.querySelector('.project__index')?.textContent.trim() || '?'), sel: a });
    });
    return out.map(o => o.id);
  });

  for (const id of targets) {
    const n = id.replace('card-', '');
    const box = await p.evaluate((idx) => {
      const a = [...document.querySelectorAll('article.project')]
        .find(x => (x.querySelector('.project__index')?.textContent.trim() || '') === idx);
      if (!a) return null;
      a.scrollIntoView({ block: 'start' });
      const r = a.getBoundingClientRect();
      return { x: 0, y: Math.max(0, r.top + window.scrollY), w: document.documentElement.clientWidth, h: Math.min(a.offsetHeight + 20, 4200) };
    }, n);
    if (!box) continue;
    await p.evaluate((y) => window.scrollTo(0, y), box.y);
    await new Promise(r => setTimeout(r, 400));
    await p.screenshot({ path: `${OUT}/card-${n}.png`, captureBeyondViewport: true,
      clip: { x: 0, y: box.y, width: box.w, height: box.h } });
  }

  await p.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 400));
  await p.screenshot({ path: `${OUT}/hero.png` });
  const certBox = await p.evaluate(() => {
    const s = [...document.querySelectorAll('section')].find(x => /Sertifikat/i.test(x.textContent || ''))
      || document.querySelector('#sertifikat, [id*=cert]');
    if (!s) return null;
    const r = s.getBoundingClientRect();
    return { y: Math.max(0, r.top + window.scrollY), h: Math.min(s.offsetHeight, 3000), w: document.documentElement.clientWidth };
  });
  if (certBox) {
    await p.evaluate((y) => window.scrollTo(0, y), certBox.y);
    await new Promise(r => setTimeout(r, 600));
    await p.screenshot({ path: `${OUT}/certs.png`, clip: { x: 0, y: certBox.y, width: certBox.w, height: certBox.h } });
  }
  console.log('shots written to', OUT);
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
