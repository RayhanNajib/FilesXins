
const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
    args: ['--no-sandbox'], defaultViewport: { width: 1440, height: 900 } });
  const p = await b.newPage();
  await p.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle2' });
  await p.evaluate(async () => { const s = innerHeight*0.6; for (let y=0;y<document.body.scrollHeight;y+=s){scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} });
  await new Promise(r=>setTimeout(r,900));
  const el = await p.$('.rail__track[data-gallery="iot"]');
  const box = await p.evaluate(() => {
    const t = document.querySelector('.rail__track[data-gallery="iot"]');
    const rail = t.closest('.rail');
    const grid = rail.closest('.project__shots-container').querySelector('.project__videos-grid');
    const a = rail.getBoundingClientRect(), c = grid.getBoundingClientRect();
    return { top: Math.max(0, a.top + scrollY - 60), bottom: c.bottom + scrollY + 60 };
  });
  await p.screenshot({ path: process.env.LOCALAPPDATA + '/Temp/iot_fixed.png',
    clip: { x: 0, y: box.top, width: 1440, height: Math.min(2200, box.bottom - box.top) } });
  console.log('###QA### ok', Math.round(box.bottom - box.top));
  await b.close();
})();
