/* Decisive corner test: paint the page background magenta, screenshot each video
   player, and see at which corners the magenta shows through (i.e. is clipped
   by the radius). Calibration divs with known radii are included.
   Usage: node _build/corners2.js <url> [W] [H] */
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

  // magenta beneath everything, and make sure nothing is transparent-but-page-coloured
  await p.addStyleTag({ content: `
    html, body { background: #FF00FF !important; }
    main, section, article, .project, .project__body, .project__info, .project__shots-container,
    .video-block, .rail, .rail__track, .shot, .container, .wrap { background: transparent !important; }
  ` });
  await new Promise(r => setTimeout(r, 400));

  // calibration: three boxes with known radii, same structure as a player
  await p.evaluate(() => {
    const mk = (r) => {
      const d = document.createElement('div');
      d.className = 'custom-video-player CALIB-' + r;
      d.style.cssText = `position:fixed;left:-9999px;top:0;width:200px;height:120px;border-radius:${r};overflow:hidden;background:#000;`;
      const inner = document.createElement('div');
      inner.style.cssText = 'width:100%;height:100%;background:#000;';
      d.appendChild(inner);
      document.body.appendChild(d);
      return d;
    };
    ['0px', '12px', '18px'].forEach(mk);
  });
  await new Promise(r => setTimeout(r, 200));

  const shots = [];
  const sel = ['.custom-video-player:not([class*="CALIB"])', '.CALIB-0px', '.CALIB-12px', '.CALIB-18px'];
  for (const s of sel) {
    for (const el of await p.$$(s)) {
      const name = (await el.evaluate((n) => (n.className.match(/CALIB-\S+/) || ['player'])[0] + '_' + Math.random().toString(36).slice(2, 6))) ;
      const file = `${process.env.LOCALAPPDATA}/Temp/cc_${name}.png`.replace(/\\/g, '/');
      await el.screenshot({ path: file });
      shots.push(file);
    }
  }

  console.log('###QA###');
  console.log(JSON.stringify({ shots }));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
