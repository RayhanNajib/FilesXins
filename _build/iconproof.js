
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args:['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle2' });
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise(r=>setTimeout(r,60)); }
  });
  const out = {};
  const shots = { play: '.v-play', mute: '.v-mute', fs: '.v-fullscreen', prev: '.certs-page-btn', railprev: '.rail__btn--prev' };
  for (const [k, sel] of Object.entries(shots)) {
    const el = await p.$(sel);
    if (!el) { out[k] = 'MISSING'; continue; }
    await p.evaluate(s => document.querySelector(s).scrollIntoView({block:'center'}), sel);
    await new Promise(r => setTimeout(r, 250));
    const path = 'C:/Users/WA/AppData/Local/Temp/fx-shots/icon-' + k + '.png';
    await el.screenshot({ path });
    out[k] = path;
  }
  console.log(JSON.stringify(out));
  await b.close();
})();
