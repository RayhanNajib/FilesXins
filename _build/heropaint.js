
const puppeteer = require('puppeteer-core');
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: 'new', args: ['--no-sandbox','--disable-lcd-text'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  const errs=[]; p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'load', timeout: 90000 });
  await p.evaluate(async () => { for (let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y); await new Promise(r=>setTimeout(r,60));} window.scrollTo(0,0); });
  await new Promise(r=>setTimeout(r,700));

  // verify the restored hero elements really paint (ink coverage on their own box)
  const shots = {};
  const boxes = await p.evaluate(() => {
    const out = {}; const r = e => { const b=e.getBoundingClientRect(); return {x:Math.max(0,Math.round(b.x)),y:Math.max(0,Math.round(b.y)),width:Math.round(b.width),height:Math.round(b.height)}; };
    const sel = { title:'.hero__title', neon:'.neon', stats:'.hero__stats', marquee:'.marquee',
                  holoFrame:'.holo__frame', ring:'.holo__ring', lbPrev:'.lightbox__nav--prev', lbNext:'.lightbox__nav--next', lbClose:'.lightbox__close' };
    for (const k in sel) { const e=document.querySelector(sel[k]); if(e) out[k]=r(e); }
    return out;
  });
  for (const k in boxes) {
    try { await p.screenshot({ path: `C:/Users/WA/AppData/Local/Temp/fx-shots/hero-${k}.png`, clip: boxes[k] }); shots[k]=boxes[k]; } catch(e) { shots[k]='ERR '+e.message; }
  }
  // does the lightbox actually open and show the right image?
  await p.evaluate(() => { const s=document.querySelector('.rail .shot'); s && s.click(); });
  await new Promise(r=>setTimeout(r,700));
  const lb = await p.evaluate(() => {
    const e=document.getElementById('lightbox');
    const im=document.getElementById('lightboxImg');
    return { hidden:e?e.hasAttribute('hidden'):null, img: im?im.getAttribute('src'):null,
             nat: im?[im.naturalWidth,im.naturalHeight]:null, cap:(document.getElementById('lightboxCap')||{}).textContent };
  });
  await p.evaluate(() => document.querySelector('.lightbox__close').click());
  await new Promise(r=>setTimeout(r,400));
  const closed = await p.evaluate(() => document.getElementById('lightbox').hasAttribute('hidden'));
  console.log('###QA###' + JSON.stringify({boxes:shots, lightbox:lb, lightboxClosed:closed, errors:errs}));
  await b.close();
})();
