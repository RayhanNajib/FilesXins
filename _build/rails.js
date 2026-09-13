/* For every rail: is the .rail box taller than its track + hint? If yes, the rail is
   swallowing the content that follows it and its absolutely-positioned arrows land there.
   Also measure every video player. Usage: node _build/rails.js <url> [W] [H] */
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
    for (let y = 0; y < document.body.scrollHeight; y += s) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
  });
  await new Promise(r => setTimeout(r, 800));

  const R = await p.evaluate(() => {
    const h = (el) => el ? Math.round(el.getBoundingClientRect().height) : null;
    const rel = (el, base) => { if (!el || !base) return null; return Math.round(el.getBoundingClientRect().top - base.getBoundingClientRect().top); };

    const rails = [...document.querySelectorAll('.rail[data-rail]')].map((rail) => {
      const track = rail.querySelector('.rail__track');
      const hint = rail.querySelector('.rail__hint');
      const cs = getComputedStyle(rail);
      const kids = [...rail.children].map((c) => ({ tag: c.tagName.toLowerCase(), cls: (c.className || '').toString().slice(0, 34), h: h(c) }));
      const prev = rail.querySelector('.rail__btn--prev');
      return {
        gallery: track ? track.dataset.gallery : null, cls: rail.className,
        railH: h(rail), trackH: h(track), hintH: h(hint),
        contentAfterTrack: kids.slice(kids.findIndex((k) => k.cls.includes('rail__track')) + 1),
        railPos: cs.position, btnPos: getComputedStyle(prev).position, btnTop: getComputedStyle(prev).top,
        prevOffsetFromRailTop: rel(prev, rail), trackOffsetFromRailTop: rel(track, rail),
        prevCenterVsTrackCenter: Math.round((prev.getBoundingClientRect().top + prev.getBoundingClientRect().height / 2) - (track.getBoundingClientRect().top + track.getBoundingClientRect().height / 2)),
      };
    });

    const players = [...document.querySelectorAll('.custom-video-player')].map((pl) => ({
      label: pl.dataset.label || '(none)', cls: pl.className,
      w: Math.round(pl.getBoundingClientRect().width), h: Math.round(pl.getBoundingClientRect().height),
      ratio: +(pl.getBoundingClientRect().width / pl.getBoundingClientRect().height).toFixed(2),
      vNat: (() => { const v = pl.querySelector('video'); return v ? v.videoWidth + 'x' + v.videoHeight : null; })(),
      gridCls: pl.parentElement.className, gridCols: getComputedStyle(pl.parentElement).gridTemplateColumns,
      gridW: Math.round(pl.parentElement.getBoundingClientRect().width),
      cols: getComputedStyle(pl.parentElement).gridTemplateColumns.split(' ').length,
    }));
    return { rails, players };
  });
  console.log('###QA###');
  console.log(JSON.stringify(R));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
