/* Whole-page contrast audit, done properly.
   - composites semi-transparent backgrounds over their ancestors
   - extracts gradient stops from background-image and scores the WORST stop
   (an auditor that reports a dark-text-on-cyan pill as 1:1 is useless)      */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(process.argv[2], { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise((r) => setTimeout(r, 900));
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h + 600; y += 400) { await p.evaluate((v) => window.scrollTo(0, v), y); await new Promise((r) => setTimeout(r, 60)); }
  await new Promise((r) => setTimeout(r, 700));

  const data = await p.evaluate(() => {
    const parseRGB = (s) => { const n = (s.match(/[\d.]+/g) || []).map(Number); return { r: n[0] || 0, g: n[1] || 0, b: n[2] || 0, a: n.length > 3 ? n[3] : 1 }; };
    const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
    const stops = (img) => {
      if (!img || img === 'none') return [];
      const m = img.match(/rgba?\([^)]*\)/g) || [];
      return m.map(parseRGB).filter((c) => c.a > 0.05);
    };
    const out = [];
    document.querySelectorAll('body *').forEach((el) => {
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!hasText) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.1) return;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;

      // composite ancestors bottom-up: surface -> element
      const chain = [];
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) chain.push(n);
      let base = { r: 255, g: 255, b: 255, a: 1 };
      const bs = getComputedStyle(document.body);
      base = over(parseRGB(bs.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'rgb(255,255,255)' : bs.backgroundColor), base);
      const layers = [];
      for (const n of chain.reverse()) {
        const st = getComputedStyle(n);
        layers.push({ bg: parseRGB(st.backgroundColor), stops: stops(st.backgroundImage) });
      }
      // bottom-up: a layer only shows through where the ones above it are not
      // opaque, so a gradient must be scored over what is *under it*, and the
      // body surface must not be scored when something opaque covers it.
      let cands = [base];
      for (const L of layers) {
        const next = [];
        if (L.stops.length) { for (const g of L.stops) for (const c of cands) next.push(over(g, c)); }
        else if (L.bg.a > 0.001) { for (const c of cands) next.push(over(L.bg, c)); }
        else { next.push(...cands); }
        cands = next;
      }
      const bgs = cands;
      const fg = parseRGB(cs.color);
      const text = el.textContent.trim().slice(0, 40);
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
      const lumOf = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
      const relOf = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      const lf = lumOf(fg);
      let worst = Infinity, worstBg = null;
      for (const bg of bgs) {
        const ratio = relOf(lf, lumOf(bg));
        if (ratio < worst) { worst = ratio; worstBg = bg; }
      }
      const sec = el.closest('section');
      out.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 30), color: cs.color,
                 bg: worstBg ? `rgb(${Math.round(worstBg.r)}, ${Math.round(worstBg.g)}, ${Math.round(worstBg.b)})` : '?',
                 ratio: Math.round(worst * 100) / 100, size: parseFloat(cs.fontSize), weight: cs.fontWeight,
                 sec: sec ? (sec.id || '?') : '-', text });
    });
    return out;
  });

  // WCAG: 3.0 for large/bold >=18.66px, else 4.5
  const flagged = data.filter((d) => {
    const large = d.size >= 18.66 || (d.size >= 14 && Number(d.weight) >= 700);
    return d.ratio < (large ? 3.0 : 4.5);
  }).sort((a, b2) => a.ratio - b2.ratio);

  console.log('text nodes:', data.length, '| below WCAG AA:', flagged.length);
  flagged.slice(0, 12).forEach((f) => console.log(`  ${f.ratio}:1  <${f.tag}> ${f.color} on ${f.bg}  ${f.size}px/${f.weight}  [${f.sec}]  "${f.text}"`));
  if (flagged.length) process.exitCode = 1;   // non-zero so CI/scripts notice
  await b.close();
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
