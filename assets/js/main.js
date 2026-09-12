/* ============================================================
   FilesXins — interactions
   Reveal on scroll, nav state, project filter, lightbox gallery
   and the certificate grid (rendered from data).
   ============================================================ */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     Galleries — every set of images a visitor can click through.
     --------------------------------------------------------- */
  const GALLERIES = {
    ummart: [
      ['assets/shots/ummart-home.webp',          'Storefront — banners, promos and product grid'],
      ['assets/shots/ummart-shop.webp',          'Shop — category browsing and filters'],
      ['assets/shots/ummart-checkout.webp',      'Checkout detail — contact and shipping'],
      ['assets/shots/ummart-payment-ovo.webp',   'Payment flow — OVO (GoPay, DANA and card follow the same flow)'],
      ['assets/shots/ummart-order-complete.webp','Order complete — receipt summary'],
      ['assets/shots/ummart-transactions.webp',  'Transaction list'],
      ['assets/shots/ummart-invoice.webp',       'Invoice'],
      ['assets/shots/ummart-admin-dashboard.webp','Admin dashboard — statistics, CRUD and export'],
      ['assets/shots/ummart-contact.webp',       'Contact page'],
      ['assets/shots/ummart-about.webp',         'About page'],
      ['assets/shots/ummart-login.webp',         'Login — password and Google Sign-In'],
    ],
    klinik: [
      ['assets/shots/klinik-login.webp',          'Login — Klinik Pratama UM'],
      ['assets/shots/klinik-dashboard-admin.webp','Admin dashboard — counters and quick actions'],
      ['assets/shots/klinik-admin-dokter.webp',   'Admin — doctor management'],
      ['assets/shots/klinik-admin-jadwal.webp',   'Admin — practice schedule management'],
      ['assets/shots/klinik-admin-pembayaran.webp','Admin — cashier and payment reports'],
      ['assets/shots/klinik-dokter-pasien.webp',  'Doctor — my patients'],
      ['assets/shots/klinik-dokter-jadwal.webp',  'Doctor — my practice schedule'],
      ['assets/shots/klinik-pasien-jadwal.webp',  'Patient — find a doctor schedule'],
      ['assets/shots/klinik-pasien-janji.webp',   'Patient — appointment history'],
      ['assets/shots/klinik-register.webp',       'Patient registration'],
    ],
    nanggungan: [
      ['assets/thirdparty/nanggungan-home.webp',         'Homepage — Desa Nanggungan, Kayen Kidul'],
      ['assets/thirdparty/nanggungan-profil-desa.webp',  'Village profile and history'],
      ['assets/thirdparty/nanggungan-pasar-desa.webp',   'Village market'],
      ['assets/thirdparty/nanggungan-berita.webp',       'News and articles'],
    ],
  };

  /* ---------------------------------------------------------
     Certificates — curated set shown in the portfolio.
     --------------------------------------------------------- */
  const CERTS = [
    { img:'assets/certs/hki-um-mart.webp',       title:'Hak Kekayaan Intelektual — UM-MART',   meta:'HKI · Kemenkumham', kind:'hki',
      desc:'Registered intellectual property for the UM-MART e-commerce platform.' },
    { img:'assets/certs/hki-smart-rakaat.webp',  title:'Hak Kekayaan Intelektual — Smart Rakaat', meta:'HKI · Kemenkumham', kind:'hki',
      desc:'Registered intellectual property for the Smart Rakaat innovation.' },
    { img:'assets/certs/bootcamp-uiux.webp',     title:'UI/UX Design Intensive Camp',          meta:'Bootcamp', kind:'course',
      desc:'Interface design intensive: research, wireframes, design systems, prototyping.' },
    { img:'assets/certs/bootcamp-figma.webp',    title:'Figma Camp',                           meta:'Bootcamp', kind:'course',
      desc:'Hands-on Figma bootcamp: components, auto-layout and prototypes.' },
    { img:'assets/certs/cisco-ite.webp',         title:'IT Essentials',                        meta:'Cisco Networking Academy', kind:'course',
      desc:'Cisco IT Essentials — hardware, operating systems, networking and security fundamentals.' },
    { img:'assets/certs/bootcamp-excel.webp',    title:'Data Visualization with Microsoft Excel', meta:'MySkill', kind:'course',
      desc:'Spreadsheet analysis and data visualisation.' },
    { img:'assets/certs/pkm.webp',               title:'Program Kreativitas Mahasiswa',         meta:'PKM · 2025', kind:'cert',
      desc:'National student creativity programme.' },
    { img:'assets/certs/pkkmb.webp',             title:'PKKMB Universitas Negeri Malang',       meta:'2024 · Campus', kind:'cert',
      desc:'Campus orientation programme for new students.' },
    { img:'assets/certs/asisten-lab.webp',       title:'Asisten Laboratorium',                  meta:'Genap 2025/2026 · UM', kind:'cert',
      desc:'Teaching assistant for a laboratory course (even semester).' },
    { img:'assets/certs/diklat-nasional.webp',   title:'Diklat Nasional',                       meta:'2025 · National', kind:'cert',
      desc:'National training programme.' },
    { img:'assets/certs/ukbing.webp',            title:'Pelatihan Bahasa Inggris (UKBING)',     meta:'UM · English', kind:'course',
      desc:'English language proficiency training.' },
    { img:'assets/certs/webinar-iot.webp',       title:'Webinar IoT — Raspberry Pi',            meta:'Webinar', kind:'course',
      desc:'Internet of Things with Raspberry Pi.' },
  ];

  /* ---------------------------------------------------------
     Certificate grid
     --------------------------------------------------------- */
  const grid = document.getElementById('certGrid');
  if (grid) {
    const frag = document.createDocumentFragment();
    CERTS.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'cert-card';
      b.type = 'button';
      b.dataset.gallery = 'certs';
      b.dataset.i = String(i);
      b.innerHTML = `
        <div class="cert-card__img">
          <span class="cert-card__kind" data-k="${c.kind}">${c.meta}</span>
          <img src="${c.img}" alt="${c.title}" loading="lazy">
        </div>
        <div class="cert-card__meta">
          <h3>${c.title}</h3>
          <p>${c.desc}</p>
        </div>`;
      frag.appendChild(b);
    });
    grid.appendChild(frag);
    GALLERIES.certs = CERTS.map((c) => [c.img, c.title]);
  }

  /* ---------------------------------------------------------
     Lightbox
     --------------------------------------------------------- */
  const lb      = document.getElementById('lightbox');
  const lbImg   = document.getElementById('lightboxImg');
  const lbCap   = document.getElementById('lightboxCap');
  let current = { group: null, i: 0 };

  const render = () => {
    const g = GALLERIES[current.group];
    if (!g) return;
    const [src, cap] = g[current.i];
    lbImg.src = src;
    lbImg.alt = cap || '';
    lbCap.textContent = `${cap || ''}   ·   ${current.i + 1}/${g.length}`;
  };
  const open  = (group, i) => { current = { group, i }; render(); lb.hidden = false; document.body.style.overflow = 'hidden'; };
  const close = () => { lb.hidden = true; lbImg.src = ''; document.body.style.overflow = ''; };
  const step  = (d) => { const g = GALLERIES[current.group]; current.i = (current.i + d + g.length) % g.length; render(); };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-gallery]');
    if (trigger) { open(trigger.dataset.gallery, Number(trigger.dataset.i || 0)); return; }
  });
  if (lb) {
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('.lightbox__nav--prev').addEventListener('click', () => step(-1));
    lb.querySelector('.lightbox__nav--next').addEventListener('click', () => step(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ---------------------------------------------------------
     Nav: stick state, mobile menu, scroll progress
     --------------------------------------------------------- */
  const nav     = document.getElementById('nav');
  const links   = document.querySelector('.nav__links');
  const burger  = document.querySelector('.nav__burger');
  const bar     = document.getElementById('progressBar');

  burger?.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  links?.addEventListener('click', (e) => {
    if (e.target.closest('a')) { links.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
  });

  const onScroll = () => {
    nav.classList.toggle('is-stuck', window.scrollY > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     Cursor glow (pointer devices only)
     --------------------------------------------------------- */
  const glow = document.querySelector('.cursor-glow');
  if (glow && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      x += (tx - x) * 0.09; y += (ty - y) * 0.09;
      glow.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();
  } else if (glow) { glow.style.display = 'none'; }

  /* ---------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------- */
  const revealables = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealables.forEach((el, i) => { el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`; io.observe(el); });
  } else {
    revealables.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------------------------------------------------------
     Project filtering
     --------------------------------------------------------- */
  const chips = document.querySelectorAll('.chip[data-filter]');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.toggle('is-active', c === chip));
    const f = chip.dataset.filter;
    document.querySelectorAll('[data-tags]').forEach((el) => {
      const match = f === 'all' || el.dataset.tags.split(' ').includes(f);
      el.style.display = match ? '' : 'none';
    });
  }));
})();
