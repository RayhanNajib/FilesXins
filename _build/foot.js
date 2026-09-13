/* Measure the contact block and the footer: alignment, symmetry, duplication.
   Usage: node _build/foot.js <url> [W] [H] */
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
  await new Promise(r => setTimeout(r, 600));

  const R = await p.evaluate(() => {
    const b = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return {
      x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
      right: Math.round(r.right), cx: Math.round(r.left + r.width/2), bottomGap: null }; };
    const docW = document.documentElement.clientWidth;
    const sec = document.getElementById('contact');
    const out = { docW, section: b(sec) };

    const title = sec.querySelector('.contact__title');
    const lede = sec.querySelector('.contact__lede');
    const actions = sec.querySelector('.contact__actions');
    const cards = sec.querySelector('.contact__cards');
    const loc = sec.querySelector('.contact__loc');
    out.contact = {
      title: b(title), lede: b(lede), actions: b(actions), cards: b(cards), loc: b(loc),
      contactBox: b(sec.querySelector('.contact')),
      contactCS: (() => { const el = sec.querySelector('.contact'); const cs = getComputedStyle(el); return {
        display: cs.display, gridCols: cs.gridTemplateColumns, justifyItems: cs.justifyItems, textAlign: cs.textAlign }; })(),
    };
    // each card: width + left edge -> asymmetry shows as uneven widths/edges
    out.cards = [...sec.querySelectorAll('.contact__card')].map((c, i) => {
      const r = b(c);
      return { i, x: r.x, w: r.w, right: r.right, label: c.querySelector('.mono')?.textContent.trim() };
    });
    // are card rows balanced?
    out.cardRows = (() => {
      const byTop = {};
      [...sec.querySelectorAll('.contact__card')].forEach((c) => { const t = Math.round(c.getBoundingClientRect().top); (byTop[t] = byTop[t] || []).push(Math.round(c.getBoundingClientRect().width)); });
      return Object.entries(byTop).map(([t, ws]) => ({ top: +t, count: ws.length, widths: ws, sum: ws.reduce((a, x) => a + x, 0) }));
    })();

    const f = document.querySelector('.footer');
    out.footer = { box: b(f), bg: getComputedStyle(f).backgroundColor, borderTop: getComputedStyle(f).borderTopWidth };
    out.footerKids = [...f.querySelectorAll(':scope > * > *')].map((el) => ({ cls: el.className.toString().slice(0, 44), ...b(el) }));
    const ft = f.querySelector('.footer__top');
    out.top3 = ft ? [...ft.children].map((el) => ({ cls: el.className.toString().slice(0, 30), ...b(el) })) : [];
    const fb = f.querySelector('.footer__bottom');
    out.bottom2 = fb ? [...fb.children].map((el) => ({ cls: el.className.toString().slice(0, 30), text: el.textContent.trim().slice(0, 30), ...b(el) })) : [];
    out.navLinks = [...f.querySelectorAll('.footer__nav a')].map((a) => ({ t: a.textContent.trim(), x: Math.round(a.getBoundingClientRect().left), w: Math.round(a.getBoundingClientRect().width) }));
    out.footerButtons = [...f.querySelectorAll('a.btn')].map((a) => ({ text: a.textContent.trim(), ...b(a) }));
    out.contactButtons = [...sec.querySelectorAll('a.btn')].map((a) => ({ text: a.textContent.trim() }));
    // duplicated actions between contact and footer?
    out.dupActions = out.contactButtons.length && out.footerButtons.length;
    return out;
  });

  console.log('###QA###');
  console.log(JSON.stringify({ w: W, ...R }));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 300) })); process.exit(1); });
