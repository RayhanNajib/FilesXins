/* Language round-trip check: does switching ID -> EN restore the original
   English exactly, and does the inline <b> markup survive?
   Usage: node lang.js <url>                                                      */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const EXPECT_EN_CARD04 = 'UM-MART - the e-commerce interface this portfolio deploys as a live demo';
const EXPECT_EN_CARD06 = 'PC build & cooling - component-accurate hard-surface models';
const EXPECT_EN_CARD08 = 'A working device and a registered intellectual-property certificate for the design.';

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('c: ' + m.text().slice(0, 140)); });
  await p.goto(process.argv[2], { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 900));

  const grab = () => p.evaluate(() => {
    const card = (n) => [...document.querySelectorAll('article[data-tags]')].find((a) => {
      const el = a.querySelector('.project__index');
      return el && el.textContent.trim() === n;
    });
    const txt = (n, sel) => { const c = card(n); return c ? (c.querySelector(sel) || {}).textContent || null : null; };
    const bCount = (n, sel) => { const c = card(n); const e = c && c.querySelector(sel); return e ? e.querySelectorAll('b').length : null; };
    return {
      lang: document.documentElement.lang,
      c04: txt('04', '.project__bullets li'),                  // first bullet of card 04
      c05sub: txt('05', '.project__sub'),
      c06: txt('06', '.project__bullets li'),                  // first bullet of card 06
      c07: txt('07', '.project__bullets li'),
      c08: txt('08', '.project__block:last-of-type p'),                     // first paragraph of card 08
      c01res: txt('01', '.project__block:last-of-type p'),
      b01: bCount('01', '.project__block:last-of-type p'),
      b04: bCount('04', '.project__bullets li'),
      b06: bCount('06', '.project__bullets li'),
      b08: bCount('08', '.project__block:last-of-type p'),
      leaked: document.body.innerText.includes('<span') || document.body.innerText.includes('data-en='),
      spans: document.querySelectorAll('[data-id]').length,
    };
  });

  const id = await grab();
  console.log('ID:', JSON.stringify(id, null, 1));
  await p.click('#langToggle');
  await new Promise((r) => setTimeout(r, 450));
  const en = await grab();
  console.log('EN:', JSON.stringify(en, null, 1));

  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  console.log('\n--- assertions (ID default, EN restores the original) ---');
  const checks = [
    ['c04 EN', norm(en.c04), 'UM-MART - the e-commerce interface this portfolio deploys as a live demo'],
    ['c06 EN', norm(en.c06), 'PC build & cooling - component-accurate hard-surface models'],
    ['c07 EN', norm(en.c07), 'Sate Meraja teaser - vertical 9:16 food trailer, fully cut, paced and graded'],
    ['c04 ID', norm(id.c04), 'UM-MART - antarmuka e-commerce yang portfolio ini tampilkan sebagai demo live'],
    ['c05 EN', norm(en.c05sub), 'A fantasy RPG built and released publicly, from models to script'],
    ['c05 ID', norm(id.c05sub), 'RPG fantasi yang dibangun dan dirilis publik, dari model sampai naskah'],
  ];
  for (const [name, got, want] of checks) console.log(`  ${want === got ? 'PASS' : 'FAIL'} ${name}: "${got}"`);
  const joined = (a, b) => !/[a-z][A-Z]|- [a-z]|\w-\w/.test((a || '') + (b || '')) && !/-\s\s|-\w/.test((a||''));
  console.log('  spaces intact :', !/\S-\s|\s-\S|[a-z]- [a-z]/.test(norm(en.c04)) ? 'ok' : 'check "' + norm(en.c04) + '"');
  console.log('  <b> preserved :', en.b04 === 1 && en.b06 === 1 && en.b08 === 1 && en.b01 === 1,
              `(b01=${en.b01} b04=${en.b04} b06=${en.b06} b08=${en.b08})`);
  console.log('  ID default    :', id.lang === 'id');
  console.log('  no leak       :', !en.leaked && !id.leaked);
  console.log('  spans         :', id.spans);
  console.log('  errors        :', errs.length ? errs : 'none');

  await p.click('#langToggle');
  await new Promise((r) => setTimeout(r, 450));
  const back = await grab();
  console.log('  back to ID    :', back.lang === 'id' && /antarmuka e-commerce/.test(back.c04 || ''));
  console.log('  persisted     :', await p.evaluate(() => localStorage.getItem('lang')));
  await b.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
