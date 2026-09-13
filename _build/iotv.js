/* Measure the IoT container: rail box, arrow buttons, hint text, and the radar video player.
   Compare against the Video Editing & Media Production container as the reference.
   Usage: node _build/iotv.js <url> [W] [H] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'], defaultViewport: { width: W, height: H } });
  const p = await b.newPage();
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await p.evaluate(async () => {
    const s = window.innerHeight * 0.6;
    for (let y = 0; y < document.body.scrollHeight; y += s) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
  });
  await new Promise(r => setTimeout(r, 900));

  const R = await p.evaluate(() => {
    const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect();
      return { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right), bottom: Math.round(r.bottom) }; };
    const cs = (el, props) => { if (!el) return null; const c = getComputedStyle(el); const o = {};
      props.forEach((k) => o[k] = c[k]); return o; };

    const out = {};
    // --- IoT rail ---
    const iotTrack = document.querySelector('.rail__track[data-gallery="iot"]');
    const iotRail = iotTrack.closest('.rail');
    out.iotRail = { box: box(iotRail), cls: iotRail.className,
      prev: box(iotRail.querySelector('.rail__btn--prev')), next: box(iotRail.querySelector('.rail__btn--next')),
      trackBox: box(iotTrack), trackW: Math.round(iotTrack.getBoundingClientRect().width),
      scrollW: Math.round(iotTrack.scrollWidth), scrollLeft: Math.round(iotTrack.scrollLeft),
      hint: (() => { const h = iotRail.querySelector('.rail__hint'); return h ? { box: box(h), text: h.textContent.trim(), display: getComputedStyle(h).display } : null; })(),
      tiles: [...iotTrack.querySelectorAll('.shot')].map((t) => ({ box: box(t), src: (t.querySelector('img').getAttribute('src') || '').split('/').pop() })),
    };

    // --- reference rail (wsmedia = Video Editing container) ---
    const wmTrack = document.querySelector('.rail__track[data-gallery="wsmedia"]');
    const wmRail = wmTrack.closest('.rail');
    out.wsmediaRail = { box: box(wmRail), cls: wmRail.className,
      prev: box(wmRail.querySelector('.rail__btn--prev')), next: box(wmRail.querySelector('.rail__btn--next')),
      trackBox: box(wmTrack), trackW: Math.round(wmTrack.getBoundingClientRect().width),
      scrollW: Math.round(wmTrack.scrollWidth),
      tiles: [...wmTrack.querySelectorAll('.shot')].map((t) => box(t)),
    };

    // --- players ---
    out.players = [...document.querySelectorAll('.custom-video-player')].map((pl) => {
      const v = pl.querySelector('video');
      const host = pl.closest('.project');
      const t = host ? (host.querySelector('.project__title') || {}).textContent : '?';
      return { project: (t || '').trim().slice(0, 30), cls: pl.className, label: pl.dataset.label,
        box: box(pl), videoBox: box(v), videoNat: v ? { w: v.videoWidth, h: v.videoHeight } : null,
        controls: box(pl.querySelector('.video-controls')),
        controlsCS: cs(pl.querySelector('.video-controls'), ['position', 'bottom', 'left', 'right', 'opacity']),
        parentGrid: pl.parentElement.className,
        parentW: Math.round(pl.parentElement.getBoundingClientRect().width) };
    });

    // --- grid containers of the video blocks ---
    out.videoGrids = [...document.querySelectorAll('.project__videos-grid')].map((g) => ({
      host: (g.closest('.project')?.querySelector('.project__title') || {}).textContent?.trim().slice(0, 28),
      box: box(g), cols: getComputedStyle(g).gridTemplateColumns, cls: g.className }));
    return out;
  });
  console.log('###QA###');
  console.log(JSON.stringify(R));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
