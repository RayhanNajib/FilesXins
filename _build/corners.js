/* Are the video container corners rounded on all four sites? DOM + pixels.
   Usage: node _build/corners.js <url> [W] [H] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const fs = require('fs');

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1', '--autoplay-policy=no-user-gesture-required'],
    defaultViewport: { width: W, height: H } });
  const p = await b.newPage();
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(async () => {
    const s = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += s) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  });
  await new Promise(r => setTimeout(r, 800));

  const R = await p.evaluate(() => {
    const players = [...document.querySelectorAll('.custom-video-player')];
    return players.map((pl, i) => {
      const v = pl.querySelector('video');
      const pb = pl.getBoundingClientRect();
      const vb = v ? v.getBoundingClientRect() : null;
      const cs = getComputedStyle(pl), vs = v ? getComputedStyle(v) : null;
      return {
        i,
        cls: pl.className,
        parentRadius: cs.borderRadius,
        parentOverflow: cs.overflow,
        parentBg: cs.backgroundColor,
        parentH: Math.round(pb.height), parentW: Math.round(pb.width),
        videoRadius: vs ? vs.borderRadius : null,
        videoH: vb ? Math.round(vb.height) : null,
        videoBottomVsParent: vb ? Math.round(vb.bottom - pb.bottom) : null,
        videoTopVsParent: vb ? Math.round(vb.top - pb.top) : null,
        hasControls: !!pl.querySelector('.video-controls'),
        controlsRadius: pl.querySelector('.video-controls') ? getComputedStyle(pl.querySelector('.video-controls')).borderRadius : null,
        // is the video clipped by the parent at the bottom?
        videoOverflowsParent: vb ? (vb.bottom > pb.bottom + 0.5 || vb.right > pb.right + 0.5) : null,
      };
    });
  });

  // element screenshots for pixel checks
  const handles = await p.$$('.custom-video-player');
  const shots = [];
  for (let i = 0; i < handles.length; i++) {
    const file = `${process.env.LOCALAPPDATA}/Temp/player_${i}.png`.replace(/\\/g, '/');
    try { await handles[i].screenshot({ path: file }); shots.push(file); } catch (e) { shots.push('ERR ' + e.message.slice(0, 60)); }
  }

  console.log('###QA###');
  console.log(JSON.stringify({ label: 'CORNERS', w: W, players: R, shots }));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
