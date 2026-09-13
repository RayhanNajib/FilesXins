/* Focused checks: modern pagination, card-05 empty tail, 9:16 player frame.
   Usage: node _build/qa3.js <url> [W] [H] [LABEL] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const LABEL = process.argv[5] || 'DESK';

(async () => {
  const b = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-device-scale-factor=1'],
    defaultViewport: { width: W, height: H },
  });
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  p.on('requestfailed', (r) => errors.push('REQFAIL ' + r.url().slice(-60)));
  await p.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // walk the document so lazy images load
  await p.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await new Promise((r) => setTimeout(r, 600));

  const R = await p.evaluate(() => {
    const out = {};

    // pagination: numeric chips, right aligned
    const bar = document.querySelector('.certs-pagination-bar');
    const nums = [...document.querySelectorAll('.certs-num')].map((n) => n.textContent.trim());
    const active = document.querySelector('.certs-num.is-active')?.textContent.trim();
    const barBox = bar?.getBoundingClientRect();
    const parent = bar?.parentElement?.getBoundingClientRect();
    out.pager = {
      nums,
      active,
      prevIcon: !!document.querySelector('.certs-prev use'),
      nextIcon: !!document.querySelector('.certs-next use'),
      rightAligned: barBox && parent ? (parent.right - barBox.right) < 80 : null,
      gapRight: barBox && parent ? Math.round(parent.right - barBox.right) : null,
      btnSize: Math.round(document.querySelector('.certs-page-btn')?.getBoundingClientRect().width || 0),
    };
    // click page 3 through the numeric chip
    document.querySelectorAll('.certs-num')[2]?.click();
    out.pagerAfterClick = {
      active: document.querySelector('.certs-num.is-active')?.textContent.trim(),
      count: document.getElementById('certCount')?.textContent.trim(),
      firstTitle: document.querySelector('.cert-card h3')?.textContent.trim(),
    };
    document.querySelectorAll('.certs-num')[0]?.click();

    // card 05 empty tail: media column vs its content
    const cards = [...document.querySelectorAll('article.project')];
    out.tails = cards.map((a) => {
      const media = a.querySelector('.project__media') || a.querySelector('.project__shots-container')?.parentElement;
      const kids = [...(a.querySelector('.project__shots-container')?.children || [])];
      const last = kids.length ? kids[kids.length - 1].getBoundingClientRect() : null;
      const mb = media?.getBoundingClientRect();
      return {
        n: a.querySelector('.project__index')?.textContent.trim(),
        mediaH: mb ? Math.round(mb.height) : null,
        contentBottomGap: last && mb ? Math.round(mb.bottom - last.bottom) : null,
        kids: kids.map((k) => k.tagName.toLowerCase() + '.' + (k.className || '').split(' ')[0]),
      };
    });

    // 9:16 player
    out.players = [...document.querySelectorAll('.custom-video-player')].map((pl) => {
      const v = pl.querySelector('video');
      const c = pl.querySelector('.video-controls');
      const fs = pl.querySelector('.v-fullscreen');
      const prog = pl.querySelector('.v-progress');
      if (!v || !c || !prog) return { cls: (pl.className.match(/video-\w+/) || [''])[0], embed: true, label: pl.dataset.label || '' };
      const vb = v.getBoundingClientRect(), pb = pl.getBoundingClientRect(), cb = c.getBoundingClientRect();
      const pr = prog.getBoundingClientRect();
      return {
        cls: (pl.className.match(/video-\w+/) || [''])[0],
        label: pl.dataset.label || '',
        ratio: +(vb.width / vb.height).toFixed(2),
        frameBorder: getComputedStyle(pl).borderRadius,
        videoRadius: getComputedStyle(v).borderRadius,
        controlsFit: cb.width <= pb.width + 1 && cb.bottom <= pb.bottom + 1,
        controlsH: Math.round(cb.height),
        progressH: Math.round(pr.height),
        progressW: Math.round(pr.width),
        fullscreen: !!fs,
        fsVisible: fs ? getComputedStyle(fs).display !== 'none' : null,
        overflow: cb.right > pb.right + 1 || cb.bottom > pb.bottom + 1,
      };
    });

    // footer + brand
    const fb = document.querySelector('.footer__brand')?.getBoundingClientRect();
    out.footer = {
      logo: !!document.querySelector('.footer__logo'),
      logoRadius: document.querySelector('.footer__logo') ? getComputedStyle(document.querySelector('.footer__logo')).borderRadius : null,
      hasActions: !!document.querySelector('.footer__actions'),
      icons: document.querySelectorAll('.footer svg.ico, .footer img').length,
      h: fb ? Math.round(fb.height) : null,
    };
    const bl = document.querySelector('.brand__logo');
    out.brand = {
      isImg: bl ? bl.tagName.toLowerCase() === 'img' : false,
      src: bl?.getAttribute('src') || null,
      radius: bl ? getComputedStyle(bl).borderRadius : null,
      w: bl ? Math.round(bl.getBoundingClientRect().width) : null,
    };

    // skills section: 4 groups, each with icon + title + items
    out.skills = [...document.querySelectorAll('.skills__group')].map((g) => ({
      group: g.querySelector('h3')?.textContent.trim().slice(0, 34),
      hasIcon: !!g.querySelector('h3 svg, h3 img'),
      rows: g.querySelectorAll('li').length,
      pairs: g.querySelectorAll('li b').length,
    }));

    // every icon actually painted? measure ink of a sample
    out.paint = [...document.querySelectorAll('.skills__group h3 svg, .certs-prev svg, .certs-next svg, .v-fullscreen svg, .footer__logo, .brand__logo')]
      .map((el) => {
        const bb = el.getBoundingClientRect();
        return { t: el.tagName.toLowerCase() + (el.getAttribute('class') ? '.' + el.getAttribute('class').split(' ')[0] : ''), w: Math.round(bb.width), h: Math.round(bb.height) };
      }).slice(0, 22);

    return out;
  });

  R.label = LABEL;
  R.errors = errors.slice(0, 10);
  R.width = W;
  console.log('###QA###');
  console.log(JSON.stringify(R));
  await b.close();
})().catch((e) => { console.log('###QA###'); console.log(JSON.stringify({ fatal: String(e).slice(0, 400) })); process.exit(1); });
