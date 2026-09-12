/* Full check across viewports: revisions + the original invariants.
   Usage: node final.js <url> <w> <h> <label>                              */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const [url, w, h, label] = [process.argv[2], Number(process.argv[3]), Number(process.argv[4]), process.argv[5] || 'vp'];
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h });
  const errors = [], failed = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 130)); });
  p.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().slice(-70)); });

  await p.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 700));
  const total = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 400) { await p.evaluate((v) => window.scrollTo(0, v), y); await new Promise((r) => setTimeout(r, 40)); }
  await new Promise((r) => setTimeout(r, 800));

  const r = await p.evaluate(() => {
    const rail = document.querySelector('.shots-scroll');
    const strip = rail && rail.querySelector('.project__shots');
    const reveals = document.querySelectorAll('.reveal');
    return {
      emDash: (document.body.innerText.match(/\u2014/g) || []).length,
      reveals: reveals.length, revealsIn: document.querySelectorAll('.reveal.is-in').length,
      broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length,
      canScrollX: (() => { window.scrollTo(9999, window.scrollY); const x = window.scrollX; window.scrollTo(0, window.scrollY); return x > 0; })(),
      cards: document.querySelectorAll('[data-tags]').length,
      videos: document.querySelectorAll('video').length,
      yt: !!document.querySelector('iframe.edit__v--yt'),
      wideRatio: [...document.querySelectorAll('.edit--wide video, .edit__v--yt')].map((v) => Math.round(v.getBoundingClientRect().width / v.getBoundingClientRect().height * 100) / 100),
      portraitRatio: [...document.querySelectorAll('.edits:not(.edits--wide) video')].map((v) => Math.round(v.getBoundingClientRect().width / v.getBoundingClientRect().height * 100) / 100),
      rail: strip ? { tiles: strip.querySelectorAll('.shot').length, scrollW: strip.scrollWidth, clientW: strip.clientWidth,
                      scrollable: strip.scrollWidth > strip.clientWidth + 4, static: rail.classList.contains('is-static') } : null,
      editsWideCols: (() => { const e = document.querySelector('.edits--wide'); return e ? getComputedStyle(e).gridTemplateColumns : null; })(),
      certColors: (() => { const h3 = document.querySelector('.cert-card__meta h3'); const pp = document.querySelector('.cert-card__meta p');
        return h3 ? { h3: getComputedStyle(h3).color, p: getComputedStyle(pp).color, bg: getComputedStyle(document.querySelector('.cert-card')).backgroundColor } : null; })(),
      lang: document.documentElement.lang,
      notRevealed: [...document.querySelectorAll('.reveal')].filter((e) => !e.classList.contains('is-in'))
        .map((e) => e.tagName + '.' + String(e.className).replace('reveal','').trim().split(' ')[0]),
    };
  });

  await p.click('#langToggle'); await new Promise((x) => setTimeout(x, 350));
  r.afterToggle = await p.evaluate(() => ({ lang: document.documentElement.lang, btn: document.getElementById('langToggle').textContent.trim(),
    emDash: (document.body.innerText.match(/\u2014/g) || []).length, nav1: document.querySelector('.nav__links a').textContent.trim() }));
  r.errors = errors; r.failedRequests = failed;
  console.log(label + ' ' + JSON.stringify(r));
  await b.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
