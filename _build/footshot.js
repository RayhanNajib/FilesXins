/* Render the bottom of the page (contact + footer) and print an ASCII map to eyeball balance.
   Usage: node _build/footshot.js <url> [W] [H] */
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
    window.scrollTo(0, document.body.scrollHeight);
  });
  await new Promise(r => setTimeout(r, 800));
  const file = `${process.env.LOCALAPPDATA}/Temp/foot_view.png`.replace(/\\/g, '/');
  await p.screenshot({ path: file });
  const box = await p.evaluate(() => {
    const f = document.querySelector('.footer');
    const s = document.getElementById('contact');
    const r1 = s.getBoundingClientRect(), r2 = f.getBoundingClientRect();
    return { top: Math.max(0, Math.round(r1.top + window.scrollY)), bottom: Math.round(r2.bottom + window.scrollY) };
  });
  console.log('###QA###');
  console.log(JSON.stringify({ file, box }));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
