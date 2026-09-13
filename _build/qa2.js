/* Full-page QA: scrolls the whole document (lazy-load completes), then measures.
   Usage: node _build/qa2.js <url> [width] [height] [label] */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const url = process.argv[2] || 'http://127.0.0.1:8123/index.html';
const W = Number(process.argv[3] || 1440), H = Number(process.argv[4] || 900);
const LABEL = process.argv[5] || 'DESKTOP';

(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 600000, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const p = await b.newPage();
  await p.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const errors = [], bad = [];
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  p.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));
  p.on('response', r => {
    const s = r.status(), u = r.url();
    if (s >= 400 && !u.endsWith('.map')) bad.push(s + ' ' + u.split('/').pop().slice(0, 46));
  });

  await p.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
  // full scroll so every lazy image loads and every reveal fires
  await p.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 90));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise(r => setTimeout(r, 1400));
    window.scrollTo(0, 0);
    await new Promise(r => setTimeout(r, 500));
  });
  await p.evaluate(() => {
    const wait = [...document.images]
      .filter(i => i.getAttribute('src') && !i.complete)
      .map(i => new Promise(res => { i.onload = i.onerror = res; }));
    return Promise.race([Promise.all(wait), new Promise(res => setTimeout(res, 8000))]);
  });

  await p.evaluate(async () => {
    for (const rail of document.querySelectorAll('[data-rail]')) {
      rail.scrollIntoView({ block: 'center' });
      await new Promise(r => setTimeout(r, 260));
      const track = rail.querySelector('.rail__track');
      const max = track.scrollWidth - track.clientWidth;
      for (let x = 0; x <= max; x += 240) {
        track.scrollLeft = x;
        await new Promise(r => setTimeout(r, 120));
      }
      track.scrollLeft = 0;
    }
    document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; });
    await new Promise(r => setTimeout(r, 1500));
    await Promise.race([
      Promise.all([...document.images].filter(i => i.getAttribute('src'))
        .map(i => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()))),
      new Promise(res => setTimeout(res, 20000))
    ]);
    await new Promise(r => setTimeout(r, 1200));
  });

  const autoScroll = await p.evaluate(async () => {
    const rail = document.querySelector('[data-rail]');
    rail.scrollIntoView({ block: 'center' });
    const track = rail.querySelector('.rail__track');
    const before = track.scrollLeft;
    await new Promise(r => setTimeout(r, 6500));
    return { before: Math.round(before), after: Math.round(track.scrollLeft), maxScroll: Math.round(track.scrollWidth - track.clientWidth) };
  });

  const out = await p.evaluate(() => {
    const R = {};
    const cards = [...document.querySelectorAll('.project')];
    R.order = cards.map(c => (c.querySelector('.project__index')?.textContent.trim() || '?') + ' ' +
      (c.querySelector('.project__title')?.textContent.replace(/\s+/g, ' ').trim() || '').slice(0, 46));
    R.cardCount = cards.length;

    const symbols = new Set([...document.querySelectorAll('symbol')].map(s => s.id));
    R.symbols = symbols.size;
    const uses = [...document.querySelectorAll('use')].map(u => u.getAttribute('href') || u.getAttribute('xlink:href') || '');
    R.missingUse = [...new Set(uses.filter(h => h.startsWith('#') && !symbols.has(h.slice(1))))];
    R.totalUses = uses.length;

    R.reveal = { total: document.querySelectorAll('.reveal').length, shown: document.querySelectorAll('.reveal.is-in').length };
    R.broken = [...document.images].filter(i => i.getAttribute('src') && (!i.complete || i.naturalWidth === 0)).map(i => i.getAttribute('src')).slice(0, 12);
    R.imgCount = document.images.length;
    R.canScrollX = document.documentElement.scrollWidth > window.innerWidth + 1;

    // rails: full, uncropped, scrollable, auto-advancing
    R.rails = [...document.querySelectorAll('[data-rail]')].map(rail => {
      const track = rail.querySelector('.rail__track');
      const shots = [...track.querySelectorAll('.shot')];
      const first = shots[0];
      const im = first?.querySelector('img');
      const r = (first?.querySelector('img') || first)?.getBoundingClientRect();
      // how much of each image frame is empty space (letterbox band)
      const bands = [...track.querySelectorAll('img')].map(img => {
        const b = img.getBoundingClientRect();
        const nat = img.naturalWidth / img.naturalHeight;
        if (!b.width || !b.height || !isFinite(nat)) return 0;
        const shown = Math.min(b.width, b.height * nat);
        return Math.round((1 - shown / b.width) * 100);
      });
      const heights = shots.map(t => Math.round(t.getBoundingClientRect().height));
      return {
        gallery: track.dataset.gallery,
        tiles: shots.length,
        cropped: track.scrollWidth > track.clientWidth + 2 ? 'scrolls' : 'fits',
        tileRatio: r && r.height ? +(r.width / r.height).toFixed(2) : 0,
        imgRatio: im && im.naturalWidth ? +(im.naturalWidth / im.naturalHeight).toFixed(2) : 0,
        /* measure the RAIL, not the individual tiles: tiles legitimately extend
           past the viewport inside a scrolling track. */
        overflowingPage: (() => { const rb = rail.getBoundingClientRect(); return rb.right > window.innerWidth + 4 || rb.left < -4; })(),
        static: rail.classList.contains('is-static'),
        movedTo: Math.round(track.scrollLeft),
        bandPct: bands.length ? Math.max(...bands) : 0,
        heightSpread: heights.length ? Math.max(...heights) - Math.min(...heights) : 0,
        scrollable: track.scrollWidth - track.clientWidth > 4,
        maxScroll: Math.round(track.scrollWidth - track.clientWidth),
        hasBtns: !!rail.querySelector('.rail__btn--prev') && !!rail.querySelector('.rail__btn--next')
      };
    });

    // column fill: does either column end long before the container does?
    R.fill = [...document.querySelectorAll('article.project')].map(a => {
      const num = a.querySelector('.project__index')?.textContent.trim() || '?';
      const box = a.getBoundingClientRect();
      const kids = [...a.querySelectorAll(':scope > .project__body > *, :scope > .project__body > .project__info, :scope > .project__body > .project__shots-container')];
      const info = a.querySelector('.project__info');
      const media = a.querySelector('.project__shots-container');
      const bottomOf = (el) => el ? el.getBoundingClientRect().bottom : box.top;
      const lastContentBottom = Math.max(...[...a.querySelectorAll('.shot, .custom-video-player, .project__links, .project__stack, .project__feats, li')]
        .map(el => el.getBoundingClientRect().bottom).filter(n => isFinite(n)), box.top);
      const containerH = Math.round(box.height);
      const emptyTail = Math.round(box.bottom - lastContentBottom);
      const infoH = info ? Math.round(info.getBoundingClientRect().height) : 0;
      const mediaH = media ? Math.round(media.getBoundingClientRect().height) : 0;
      return { num, containerH, emptyTail, infoH, mediaH, colSlack: Math.abs(infoH - mediaH) };
    });

    R.players = [...document.querySelectorAll('.custom-video-player')].map(v => {
      const vid = v.querySelector('video');
      const r = v.getBoundingClientRect();
      const btns = [...v.querySelectorAll('.v-btn')];
      return {
        shape: v.className.replace('custom-video-player', '').trim(),
        boxRatio: +(r.width / r.height).toFixed(2),
        btnIcons: btns.map(b => (b.querySelector('use')?.getAttribute('href') || 'NO-USE')).join(','),
        hasRange: !!v.querySelector('.v-progress'),
        hasVolume: !!v.querySelector('.v-volume'),
        controlsVisible: v.querySelector('.video-controls') ? getComputedStyle(v.querySelector('.video-controls')).opacity : 'none',
        srcOk: vid ? !!vid.getAttribute('src') : false
      };
    });
    R.videoDims = [...document.querySelectorAll('.custom-video-player video')].map(v => ({
      nat: v.videoWidth + 'x' + v.videoHeight, ratio: v.videoWidth ? +(v.videoWidth / v.videoHeight).toFixed(2) : 0
    }));

    R.yt = [...document.querySelectorAll('iframe')].map(f => {
      const r = f.getBoundingClientRect();
      return { ratio: r.height ? +(r.width / r.height).toFixed(2) : 0, allowFs: f.hasAttribute('allowfullscreen'), src: (f.getAttribute('src') || '').slice(-24) };
    });

    // structure: a mixed-up nesting shows up here, not in a tag balance
    R.structure = [...document.querySelectorAll('article.project')].map(a => ({
      num: a.querySelector('.project__index')?.textContent.trim(),
      mediaKids: [...(a.querySelector('.project__shots-container')?.children || [])].map(c => c.tagName.toLowerCase() + '.' + (c.className || '').split(' ')[0]),
      videoGridKids: [...(a.querySelector('.project__videos-grid')?.children || [])].map(c => (c.className || '').split(' ').slice(0, 2).join('.'))
    }));

    R.certs = {
      cards: document.querySelectorAll('.cert-card').length,
      dots: document.querySelectorAll('.certs-dot, .certs-num').length,
      navBtns: [...document.querySelectorAll('.certs-page-btn')].map(b => b.textContent.trim() + '/' + (b.querySelector('use') ? 'icon' : 'NO-ICON')),
      count: document.getElementById('certCount')?.textContent || '',
      cardsWithIcons: [...document.querySelectorAll('.cert-card .cert-card__kind use')].filter(u => {
        const id = (u.getAttribute('href') || '').slice(1);
        return !!document.getElementById(id);
      }).length
    };
    R.lightboxPresent = !!document.getElementById('lightbox');
    R.emDash = (document.body.innerHTML.match(/\u2014/g) || []).length;
    return R;
  });

  // interaction: lightbox opens from a rail tile, then step, then close
  const lb = await (async () => {
    const before = await p.evaluate(() => document.getElementById('lightbox')?.hidden);
    await p.evaluate(() => document.querySelector('.rail__track .shot')?.click());
    await new Promise(r => setTimeout(r, 400));
    const opened = await p.evaluate(() => {
      const l = document.getElementById('lightbox');
      return { hidden: l.hidden, src: (document.getElementById('lightboxImg')?.getAttribute('src') || '').slice(-30) };
    });
    await p.evaluate(() => document.querySelector('.lightbox__nav--next')?.click());
    await new Promise(r => setTimeout(r, 300));
    const stepped = await p.evaluate(() => (document.getElementById('lightboxImg')?.getAttribute('src') || '').slice(-30));
    await p.evaluate(() => document.querySelector('.lightbox__close')?.click());
    await new Promise(r => setTimeout(r, 250));
    const closed = await p.evaluate(() => document.getElementById('lightbox').hidden);
    return { before, opened, stepped, closed, changed: stepped !== opened.src };
  })();

  // interaction: language toggle
  const lang = await (async () => {
    const first = await p.evaluate(() => {
      const el = document.querySelector('[data-id][data-en]');
      return { code: document.getElementById('langCode')?.textContent, text: (el?.textContent || '').slice(0, 46) };
    });
    await p.evaluate(() => document.getElementById('langToggle')?.click());
    await new Promise(r => setTimeout(r, 350));
    const second = await p.evaluate(() => {
      const el = document.querySelector('[data-id][data-en]');
      return { code: document.getElementById('langCode')?.textContent, text: (el?.textContent || '').slice(0, 46), htmlLang: document.documentElement.lang };
    });
    await p.evaluate(() => document.getElementById('langToggle')?.click());
    await new Promise(r => setTimeout(r, 300));
    const back = await p.evaluate(() => document.getElementById('langCode')?.textContent);
    return { first, second, back };
  })();

  // interaction: certificate next page
  const certsNav = await (async () => {
    const p1 = await p.evaluate(() => document.getElementById('certCount')?.textContent);
    await p.evaluate(() => document.querySelector('.certs-next')?.click());
    await new Promise(r => setTimeout(r, 400));
    const p2 = await p.evaluate(() => ({
      count: document.getElementById('certCount')?.textContent,
      firstTitle: (document.querySelector('.cert-card h3')?.textContent || '').slice(0, 40)
    }));
    return { p1, p2 };
  })();

  console.log('###QA###' + JSON.stringify({
    label: LABEL, viewport: W + 'x' + H,
    errors: [...new Set(errors)].slice(0, 6),
    failed: [...new Set(bad)].slice(0, 10),
    ...out, autoScrollProof: autoScroll, lightbox: lb, lang, certsNav
  }, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
