/* Screenshot the contact section and the footer as elements, for a visual check.
   Usage: node _build/footshot2.js <url> [W] [H] */
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
    for (let y = 0; y < document.body.scrollHeight; y += s) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)); }
  });
  await new Promise(r => setTimeout(r, 800));
  const out = {};
  for (const [key, sel] of [['contact', '#contact'], ['footer', '.footer']]) {
    const el = await p.$(sel);
    const f = `${process.env.LOCALAPPDATA}/Temp/view_${key}.png`.replace(/\\/g, '/');
    await el.screenshot({ path: f });
    out[key] = f;
  }
  console.log('###QA###');
  console.log(JSON.stringify(out));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
