
const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
    args: ['--no-sandbox'], defaultViewport: { width: 390, height: 844 } });
  const p = await b.newPage();
  await p.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 500));
  await p.evaluate(() => document.querySelector('[data-rail] .shot')?.click());
  await new Promise(r => setTimeout(r, 900));
  await p.screenshot({ path: process.env.LOCALAPPDATA + '/Temp/lb_mobile.png' });
  await p.setViewport({ width: 1440, height: 900 });
  await new Promise(r => setTimeout(r, 700));
  await p.screenshot({ path: process.env.LOCALAPPDATA + '/Temp/lb_desktop.png' });
  console.log('ok');
  await b.close();
})();
