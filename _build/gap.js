
const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args:['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844 });
  await p.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle2' });
  await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,50));} window.scrollTo(0,0); });
  const out = await p.evaluate(() => {
    const a = document.getElementById('proj-05');
    const box = a.getBoundingClientRect();
    const kids = [...a.querySelectorAll('*')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && Math.abs(r.bottom - box.bottom) < 200 && getComputedStyle(el).marginBottom !== '0px';
    }).map(el => ({ tag: el.tagName.toLowerCase() + '.' + (el.className||'').toString().split(' ').slice(0,2).join('.'),
                    mb: getComputedStyle(el).marginBottom, pb: getComputedStyle(el).paddingBottom, h: Math.round(el.getBoundingClientRect().height) }));
    const body = a.querySelector('.project__body');
    const last = a.lastElementChild;
    return { cardBottom: Math.round(box.bottom), kids: kids.slice(-8), bodyMB: getComputedStyle(body).marginBottom,
             bodyPB: getComputedStyle(body).paddingBottom, lastTag: last.tagName + '.' + last.className,
             lastMB: getComputedStyle(last).marginBottom, lastPB: getComputedStyle(last).paddingBottom };
  });
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
