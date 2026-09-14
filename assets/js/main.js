/* ============================================================
  FilesXins - Rayhan Najib
  Interactions: reveal on scroll, topbar state, self-scrolling
  preview rails, fullscreen media lightbox, custom video player,
  certificate pagination and the ID/EN language switch.

  Order matters: every const is declared before the function that
  reads it. Icon symbols (#ico-*) are defined once in index.html
  and referenced here with <use href="#...">, so this file never
  depends on an external sprite request.
  ============================================================ */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     Certificates: each entry states the document, the issuer,
     and the capability it evidences.
     --------------------------------------------------------- */
  const CERTS = [
    { img: 'assets/opt/certs/hki-um-mart.webp', kind: 'hki', label: 'Kekayaan Intelektual',
      title: 'HKI Registered - UM-MART Platform E-Commerce',
      issuer: 'Kementerian Hukum & HAM RI',
      evidences: 'Hak cipta perangkat lunak UM-MART: katalog, keranjang, kasir, dan panel admin.' },
    { img: 'assets/opt/certs/hki-smart-rakaat.webp', kind: 'hki', label: 'Kekayaan Intelektual',
      title: 'HKI Registered - Smart Rakaat IoT',
      issuer: 'Kementerian Hukum & HAM RI',
      evidences: 'Hak cipta perangkat IoT penghitung rakaat otomatis berbasis ESP32.' },
    { img: 'assets/opt/certs/asisten-lab.webp', kind: 'award', label: 'Penugasan Kampus',
      title: 'Asisten Laboratorium Komputer',
      issuer: 'Departemen Teknik Elektro & Informatika UM (Genap 2025/2026)',
      evidences: 'Mendampingi praktikum mahasiswa dan mengelola perangkat laboratorium komputer.' },
    { img: 'assets/opt/certs/pkm.webp', kind: 'award', label: 'Program Nasional',
      title: 'Program Kreativitas Mahasiswa (PKM)',
      issuer: 'Kemendikbudristek RI',
      evidences: 'Proposal PKM inovasi perangkat cerdas untuk anak disgrafia.' },
    { img: 'assets/opt/certs/ldk-positron.webp', kind: 'award', label: 'Pelatihan Organisasi',
      title: 'Latihan Dasar Kepemimpinan Positron 2024',
      issuer: 'Himpunan Mahasiswa Universitas Negeri Malang',
      evidences: 'Penguatan manajemen organisasi dan kepemimpinan tim.' },
    { img: 'assets/opt/certs/pemira-2024.webp', kind: 'award', label: 'Kepanitiaan Kampus',
      title: 'Pemilu Raya (PEMIRA) 2024',
      issuer: 'Panitia Pemira Universitas Negeri Malang',
      evidences: 'Keterlibatan dalam suksesi demokrasi mahasiswa kampus.' },
    { img: 'assets/opt/certs/pemira-2025.webp', kind: 'award', label: 'Kepanitiaan Kampus',
      title: 'Pemilu Raya (PEMIRA) 2025',
      issuer: 'Panitia Pemira Universitas Negeri Malang',
      evidences: 'Keterlibatan dalam suksesi demokrasi mahasiswa kampus.' },
    { img: 'assets/opt/certs/pkkmb.webp', kind: 'award', label: 'Penghargaan Kampus',
      title: 'PKKMB Universitas Negeri Malang',
      issuer: 'Panitia Orientasi Kampus UM',
      evidences: 'Kelulusan dan partisipasi orientasi mahasiswa baru.' },
    { img: 'assets/opt/certs/cisco-ite.webp', kind: 'course', label: 'Sertifikasi Vendor',
      title: 'Cisco Networking Academy - IT Essentials',
      issuer: 'Cisco Systems International',
      evidences: 'Kompetensi hardware, sistem operasi, jaringan dasar, dan keamanan IT.' },
    { img: 'assets/opt/certs/bootcamp-uiux.webp', kind: 'course', label: 'Bootcamp',
      title: 'UI/UX Design Intensive Camp',
      issuer: 'Intensive Bootcamp Program',
      evidences: 'Riset pengguna, wireframing, sistem UI, dan prototipe interaktif.' },
    { img: 'assets/opt/certs/bootcamp-figma.webp', kind: 'course', label: 'Bootcamp',
      title: 'Figma Design Camp',
      issuer: 'Design Tooling Certification',
      evidences: 'Auto-layout, komponen UI, design token, dan prototipe Figma.' },
    { img: 'assets/opt/certs/bootcamp-excel.webp', kind: 'course', label: 'Kursus Bersertifikat',
      title: 'Data Visualization with Microsoft Excel',
      issuer: 'MySkill Certification',
      evidences: 'Analisis data spreadsheet dan visualisasi statistik.' },
    { img: 'assets/opt/certs/workshop-ai.webp', kind: 'course', label: 'Workshop',
      title: 'Workshop Generative AI & Technology',
      issuer: 'Penyelenggara Workshop Teknologi',
      evidences: 'Pemanfaatan kecerdasan buatan untuk akselerasi alur kerja pengembangan.' },
    { img: 'assets/opt/certs/workshop-iot.webp', kind: 'course', label: 'Workshop',
      title: 'Workshop Internet of Things (IoT)',
      issuer: 'Workshop Pembelajaran IoT',
      evidences: 'Sistem embedded, mikrokontroler, dan pengiriman data sensor.' },
    { img: 'assets/opt/certs/workshop-plc.webp', kind: 'course', label: 'Workshop',
      title: 'Workshop Automation & PLC',
      issuer: 'Pelatihan Otomasi Industri',
      evidences: 'Dasar pemrograman logika kontroler otomatisasi industri.' },
    { img: 'assets/opt/certs/workshop-cendekia.webp', kind: 'course', label: 'Workshop',
      title: 'Workshop Cendekia Menulis Karya Ilmiah',
      issuer: 'Forum Cendekia Akademik',
      evidences: 'Penyusunan karya ilmiah dan publikasi teknis.' },
    { img: 'assets/opt/certs/webinar-iot.webp', kind: 'course', label: 'Webinar',
      title: 'Webinar IoT dengan Raspberry Pi',
      issuer: 'Webinar Nasional IoT',
      evidences: 'Integrasi Raspberry Pi, Linux embedded, dan komunikasi sensor.' },
    { img: 'assets/opt/certs/webinar-gemapedia.webp', kind: 'course', label: 'Webinar',
      title: 'Webinar Nasional Pendidikan - GEMAPEDIA',
      issuer: 'UKM GEMAPEDIA Universitas Negeri Malang',
      evidences: 'Penguatan inovasi pendidikan inklusif.' },
    { img: 'assets/opt/certs/webinar-mdgb.webp', kind: 'course', label: 'Webinar',
      title: 'Webinar MDGB Kuliah Bestari UM',
      issuer: 'Majelis Dewan Guru Besar UM',
      evidences: 'Wawasan akademik kepemimpinan dan inovasi sains teknologi.' },
    { img: 'assets/opt/certs/webinar-politik.webp', kind: 'course', label: 'Webinar',
      title: 'Seminar Nasional Ilmu Politik',
      issuer: 'Fakultas Ilmu Sosial Universitas Negeri Malang',
      evidences: 'Seminar akademik nasional tata kelola dan analisis isu publik.' },
    { img: 'assets/opt/certs/webinar-ppkn.webp', kind: 'course', label: 'Webinar',
      title: 'Webinar Nasional PPKN FIS UM',
      issuer: 'Fakultas Ilmu Sosial Universitas Negeri Malang',
      evidences: 'Penguatan wawasan kebangsaan dan etika digital.' },
    { img: 'assets/opt/certs/diklat-nasional.webp', kind: 'course', label: 'Diklat',
      title: 'Diklat Nasional Pengembangan Kompetensi',
      issuer: 'Program Diklat Nasional',
      evidences: 'Pengembangan kapasitas diri, kepemimpinan, dan kerja sama tim.' },
    { img: 'assets/opt/certs/ukbing.webp', kind: 'course', label: 'Pelatihan Bahasa',
      title: 'English Proficiency Training (UKBING)',
      issuer: 'Balai Bahasa Universitas Negeri Malang',
      evidences: 'Membaca, mendengarkan, dan menulis dokumentasi teknis Bahasa Inggris.' },
  ];

  const CERT_ICON = { hki: 'ico-award', award: 'ico-circle-check', course: 'ico-book-open' };
  const CERTS_PER_PAGE = 6;
  let certPage = 1;
  let certFilter = 'all';

  /* ---------------------------------------------------------
     Galleries are read from the DOM: every rail track declares
     its gallery, so a gallery can never be defined but unused
     (or used but undefined).
     --------------------------------------------------------- */
  const GALLERIES = {};
  document.querySelectorAll('.rail__track[data-gallery]').forEach((track) => {
    const name = track.dataset.gallery;
    const items = [...track.querySelectorAll('.shot')].map((fig) => {
      const img = fig.querySelector('img');
      const cap = fig.querySelector('figcaption');
      return [img ? img.getAttribute('src') : '', cap ? cap.textContent.trim().replace(/\s+/g, ' ') : ''];
    }).filter((it) => it[0]);
    if (items.length) GALLERIES[name] = items;
  });
  GALLERIES.certs = CERTS.map((c) => [c.img, c.title + ' - ' + c.issuer]);

  /* ---------------------------------------------------------
     Lightbox - one gallery cursor, keyboard + swipe aware
     --------------------------------------------------------- */
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCap = document.getElementById('lightboxCap');
  let cursor = { group: null, i: 0 };
  let lastFocus = null;

  const paint = () => {
    const g = GALLERIES[cursor.group];
    if (!g || !lbImg) return;
    const [src, cap] = g[cursor.i];
    lbImg.src = src;
    lbImg.alt = cap || '';
    if (lbCap) lbCap.textContent = (cap || '') + '  ·  ' + (cursor.i + 1) + '/' + g.length;
  };
  const openLb = (group, i) => {
    if (!lb || !GALLERIES[group]) return;
    lastFocus = document.activeElement;
    cursor = { group, i: Math.max(0, Math.min(i, GALLERIES[group].length - 1)) };
    paint();
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lightbox__close')?.focus();
  };
  const closeLb = () => {
    if (!lb) return;
    lb.hidden = true;
    if (lbImg) lbImg.src = '';
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };
  const stepLb = (d) => {
    const g = GALLERIES[cursor.group];
    if (!g) return;
    cursor.i = (cursor.i + d + g.length) % g.length;
    paint();
  };

  document.addEventListener('click', (e) => {
    const trig = e.target.closest('[data-gallery]');
    if (trig) {
      const shot = trig.closest('.shot');
      if (shot) { openLb(trig.dataset.gallery, Number(shot.dataset.i || 0)); return; }
      if (trig.dataset.i !== undefined) { openLb(trig.dataset.gallery, Number(trig.dataset.i)); return; }
    }
    const cert = e.target.closest('.cert-card');
    if (cert && cert.dataset.certIdx !== undefined) {
      openLb('certs', Number(cert.dataset.certIdx));
      return;
    }
  });

  if (lb) {
    lb.querySelector('.lightbox__close')?.addEventListener('click', closeLb);
    lb.querySelector('.lightbox__nav--prev')?.addEventListener('click', () => stepLb(-1));
    lb.querySelector('.lightbox__nav--next')?.addEventListener('click', () => stepLb(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      else if (e.key === 'ArrowLeft') stepLb(-1);
      else if (e.key === 'ArrowRight') stepLb(1);
    });
    let sx = null;
    lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 45) stepLb(dx < 0 ? 1 : -1);
      sx = null;
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     Topbar: stuck state, mobile menu
     --------------------------------------------------------- */
  const topbar = document.getElementById('topbar');
  const navPanel = topbar ? topbar.querySelector('.nav') : null;
  const burger = document.getElementById('navBurger');

  const onScroll = () => {
    if (topbar) topbar.classList.toggle('is-stuck', window.scrollY > 24);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  burger?.addEventListener('click', () => {
    const open = navPanel?.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(Boolean(open)));
  });
  navPanel?.addEventListener('click', (e) => {
    if (e.target.closest('a')) {
      navPanel.classList.remove('is-open');
      burger?.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  const revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------------------------------------------------------
     Self-scrolling rails: one preview per block, no empty track.
     Auto-scroll pauses on hover, focus, touch and when off-screen.
     --------------------------------------------------------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* fit every rail once its shots have real dimensions */
  const railTracks = () => [...document.querySelectorAll('[data-rail] .rail__track')];
  const fitAll = () => railTracks().forEach((t) => { t.dataset.scrollable = undefined; fitRail(t); });
  window.addEventListener('load', fitAll);
  window.addEventListener('resize', () => { clearTimeout(window.__railT); window.__railT = setTimeout(fitAll, 180); });
  railTracks().forEach((t) => [...t.querySelectorAll('img')].forEach((i) => {
    if (i.complete) return;
    i.addEventListener('load', () => fitAll(), { once: true });
  }));
  setTimeout(fitAll, 350);

  /* The row must fill the container: pick the tile height that makes the
     widest tile set cover the track, so a rail never ends in empty space. */
  const fitRail = (track) => {
    const tiles = [...track.querySelectorAll('.shot')];
    if (!tiles.length) return;
    const imgs = tiles.map((t) => t.querySelector('img'));
    let ratios = imgs.map((i) => (i && i.naturalWidth && i.naturalHeight ? i.naturalWidth / i.naturalHeight : 0));
    tiles.forEach((t, idx) => {
      if (t.classList.contains('shot--video')) ratios[idx] = 16 / 9;
      else if (!ratios[idx]) ratios[idx] = 16 / 9;
    });
    const totalRatio = ratios.reduce((a, b) => a + b, 0);
    const gap = 0.6 * 16;                       // .rail__track gap in px
    const avail = Math.max(200, track.clientWidth - gap * (tiles.length - 1));
    const cur = parseFloat(getComputedStyle(track).getPropertyValue('--tile-h')) || 178;
    const need = Math.round((avail / totalRatio) * 0.94);   // 6% headroom = a visible peek
    let h = Math.max(120, Math.min(Math.max(cur, need), 300));
    /* a tall column (long copy beside the rail) must not end in dead space:
       grow the tiles so the rail section matches the column height. */
    /* only when the copy and the rail sit SIDE BY SIDE: on narrow screens they
       stack, and the stacked gap is not dead space to fill with taller tiles. */
    const card = track.closest('.project');
    const col = track.closest('.project__media');
    const info = card?.querySelector('.project__info');
    const section = track.closest('.project__shots-container') || track.parentElement;
    if (col && info && section && col.clientWidth > 0) {
      const ib = info.getBoundingClientRect(), cb = col.getBoundingClientRect();
      const sideBySide = Math.abs(ib.top - cb.top) < 40 && ib.right <= cb.left + 2;
      const slack = col.clientHeight - section.clientHeight;
      if (sideBySide && slack > 40) h = Math.min(h + slack, 520);
    }
    track.style.setProperty('--tile-h', h + 'px');
    if (track.dataset.scrollable === undefined) {
      requestAnimationFrame(() => { track.dataset.scrollable = String(track.scrollWidth > track.clientWidth + 4); });
    }
  };

  document.querySelectorAll('[data-rail]').forEach((rail) => {
    const track = rail.querySelector('.rail__track');
    if (!track) return;
    const prev = rail.querySelector('.rail__btn--prev');
    const next = rail.querySelector('.rail__btn--next');

    let timer = null;
    let dir = 1;
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

    const tileStep = () => {
      const t = track.querySelector('.shot');
      return t ? Math.round(t.getBoundingClientRect().width + 10) : 300;
    };
    const sync = () => {
      const max = track.scrollWidth - track.clientWidth;
      rail.classList.toggle('is-static', max <= 2);
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    };

    prev?.addEventListener('click', () => { stop(); track.scrollBy({ left: -tileStep(), behavior: 'smooth' }); });
    next?.addEventListener('click', () => { stop(); track.scrollBy({ left: tileStep(), behavior: 'smooth' }); });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();

    if (reduceMotion) return;

    const start = () => { if (!timer) timer = setInterval(tick, 4200); };
    const tick = () => {
      if (document.hidden || !rail.isConnected) return;
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 2) return;
      if (dir === 1 && track.scrollLeft >= max - 2) dir = -1;
      else if (dir === -1 && track.scrollLeft <= 2) dir = 1;
      track.scrollBy({ left: dir * tileStep(), behavior: 'smooth' });
    };

    rail.addEventListener('pointerenter', stop);
    rail.addEventListener('pointerdown', stop);
    rail.addEventListener('focusin', stop);
    rail.addEventListener('touchstart', stop, { passive: true });
    rail.addEventListener('pointerleave', start);
    rail.addEventListener('focusout', start);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) start(); else stop(); });
      }, { threshold: 0.14 }).observe(rail);
    } else {
      start();
    }
  });

  /* ---------------------------------------------------------
     Custom video player (Media Chrome style, own controls)
     --------------------------------------------------------- */
  const fmt = (sec) => {
    if (!isFinite(sec) || isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  };

  document.querySelectorAll('.custom-video-player').forEach((player) => {
    const video = player.querySelector('video');
    if (!video) return;
    const playBtn = player.querySelector('.v-play');
    const progress = player.querySelector('.v-progress');
    const timeEl = player.querySelector('.v-time');
    const muteBtn = player.querySelector('.v-mute');
    const volume = player.querySelector('.v-volume');
    const fullBtn = player.querySelector('.v-fullscreen');

    const label = player.dataset.label;

    const toggle = () => {
      if (video.paused) video.play().catch(() => {}); else video.pause();
    };
    playBtn?.addEventListener('click', toggle);
    video.addEventListener('click', toggle);

    video.addEventListener('play', () => {
      player.classList.add('is-playing');
      if (playBtn) playBtn.innerHTML = '<svg class="ico"><use href="#ico-pause"></use></svg>';
    });
    video.addEventListener('pause', () => {
      player.classList.remove('is-playing');
      if (playBtn) playBtn.innerHTML = '<svg class="ico"><use href="#ico-play"></use></svg>';
    });

    const syncTime = () => {
      if (progress && video.duration) progress.value = (video.currentTime / video.duration) * 100;
      if (timeEl) timeEl.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration);
    };
    video.addEventListener('timeupdate', syncTime);
    video.addEventListener('loadedmetadata', syncTime);
    if (label && timeEl) timeEl.textContent = '0:00 / 0:00';

    progress?.addEventListener('input', () => {
      if (video.duration) video.currentTime = (progress.value / 100) * video.duration;
    });

    const paintVolume = () => {
      if (!muteBtn) return;
      muteBtn.innerHTML = (video.muted || video.volume === 0)
        ? '<svg class="ico"><use href="#ico-volume-x"></use></svg>'
        : '<svg class="ico"><use href="#ico-volume-2"></use></svg>';
    };
    muteBtn?.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted && video.volume === 0) { video.volume = 1; if (volume) volume.value = 100; }
      paintVolume();
    });
    volume?.addEventListener('input', () => {
      video.volume = Number(volume.value) / 100;
      video.muted = video.volume === 0;
      paintVolume();
    });
    paintVolume();

    fullBtn?.addEventListener('click', () => {
      const target = player.requestFullscreen ? player : video;
      if (!document.fullscreenElement) {
        (target.requestFullscreen || target.webkitRequestFullscreen || (() => {})).call(target);
      } else {
        (document.exitFullscreen || (() => {})).call(document);
      }
    });
  });

  /* ---------------------------------------------------------
     Certificate grid: filter chips, pagination, dots
     --------------------------------------------------------- */
  const certGrid = document.getElementById('certGrid');
  const certCount = document.getElementById('certCount');
  const certFilters = document.getElementById('certFilters');

  const renderCertificates = () => {
    if (!certGrid) return;
    const filtered = certFilter === 'all' ? CERTS : CERTS.filter((c) => c.kind === certFilter);
    const totalPages = Math.max(1, Math.ceil(filtered.length / CERTS_PER_PAGE));
    if (certPage > totalPages) certPage = totalPages;
    const start = (certPage - 1) * CERTS_PER_PAGE;
    const pageItems = filtered.slice(start, start + CERTS_PER_PAGE);

    certGrid.innerHTML = pageItems.map((c) => {
      const idx = CERTS.indexOf(c);
      return '<button class="cert-card" type="button" data-cert-idx="' + idx + '">' +
        '<div class="cert-card__img">' +
          '<img src="' + c.img + '" alt="' + c.title + '" loading="lazy" decoding="async">' +
          '<span class="cert-card__kind" data-k="' + c.kind + '">' +
            '<svg class="ico"><use href="#' + CERT_ICON[c.kind] + '"></use></svg>' + c.label +
          '</span>' +
        '</div>' +
        '<div class="cert-card__meta">' +
          '<h3>' + c.title + '</h3>' +
          '<p>' + c.evidences + '</p>' +
          '<span class="cert-card__src">' + c.issuer + '</span>' +
        '</div>' +
      '</button>';
    }).join('');

    if (certCount) certCount.textContent = filtered.length + ' sertifikat · halaman ' + certPage + '/' + totalPages;

    let bar = document.querySelector('.certs-pagination-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'certs-pagination-bar';
      certGrid.after(bar);
    }
    bar.innerHTML =
      '<button class="certs-page-btn certs-prev" type="button" aria-label="Halaman sebelumnya"' + (certPage === 1 ? ' disabled' : '') + '>' +
        '<svg class="ico"><use href="#ico-chevron-left"></use></svg></button>' +
      '<div class="certs-page-nums">' +
        Array.from({ length: totalPages }).map((_, i) =>
          '<button class="certs-num' + (i + 1 === certPage ? ' is-active' : '') + '" type="button" data-page="' + (i + 1) + '" aria-label="Halaman ' + (i + 1) + '">' + String(i + 1).padStart(2, '0') + '</button>'
        ).join('') +
      '</div>' +
      '<button class="certs-page-btn certs-next" type="button" aria-label="Halaman berikutnya"' + (certPage === totalPages ? ' disabled' : '') + '>' +
        '<svg class="ico"><use href="#ico-chevron-right"></use></svg></button>';

    bar.querySelector('.certs-prev')?.addEventListener('click', () => { if (certPage > 1) { certPage--; renderCertificates(); } });
    bar.querySelector('.certs-next')?.addEventListener('click', () => { if (certPage < totalPages) { certPage++; renderCertificates(); } });
    bar.querySelectorAll('.certs-num, .certs-dot').forEach((dot) => dot.addEventListener('click', () => {
      certPage = Number(dot.dataset.page);
      renderCertificates();
    }));
  };

  certFilters?.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-certfilter]');
    if (!chip) return;
    certFilters.querySelectorAll('[data-certfilter]').forEach((c) => c.classList.toggle('is-active', c === chip));
    certFilter = chip.dataset.certfilter;
    certPage = 1;
    renderCertificates();
  });

  /* ---------------------------------------------------------
     Language switch: ID (default) / EN
     --------------------------------------------------------- */
  const langBtn = document.getElementById('langToggle');
  const langCode = document.getElementById('langCode');
  let lang = 'id';
  try { lang = localStorage.getItem('lang') || 'id'; } catch (err) { lang = 'id'; }

  const setLanguage = (next) => {
    lang = next === 'en' ? 'en' : 'id';
    document.documentElement.lang = lang;
    if (langCode) langCode.textContent = lang.toUpperCase();
    document.querySelectorAll('[data-id][data-en]').forEach((el) => {
      const value = lang === 'en' ? el.dataset.en : el.dataset.id;
      if (value !== undefined) el.textContent = value;
    });
    try { localStorage.setItem('lang', lang); } catch (err) { /* storage blocked */ }
  };

  langBtn?.addEventListener('click', () => setLanguage(lang === 'id' ? 'en' : 'id'));
  setLanguage(lang);

  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  renderCertificates();
})();
