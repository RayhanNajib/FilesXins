/* ============================================================
   FilesXins — Rayhan Najib
   Interactions: reveal on scroll, nav state, project filter,
   lightbox galleries and the certificate grid.

   Every certificate entry states what the document verifies and
   which capability it evidences — the ATS-friendly framing.
   Icons are inlined by _build/icons.py so they follow currentColor.
   ============================================================ */
(() => {
  'use strict';

  /* ---------------------------------------------------------
     Inline icon helper (Lucide, ISC licence)
     --------------------------------------------------------- */
  const ICON = {
    badge:  '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>',
    award:  '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526"/><circle cx="12" cy="8" r="6"/></svg>',
    course: '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>',
  };

  /* ---------------------------------------------------------
     Galleries
     --------------------------------------------------------- */
  const GALLERIES = {
    ummart: [
      ['assets/shots/ummart-home.webp',           'Storefront — banners, promotions and product grid'],
      ['assets/shots/ummart-shop.webp',           'Catalogue — category browsing and filter combinations'],
      ['assets/shots/ummart-checkout.webp',       'Checkout — contact and shipping details'],
      ['assets/shots/ummart-payment-ovo.webp',    'Payment flow — OVO (GoPay, DANA and card use the same flow)'],
      ['assets/shots/ummart-order-complete.webp', 'Order confirmation — receipt summary'],
      ['assets/shots/ummart-transactions.webp',   'Customer transaction history'],
      ['assets/shots/ummart-invoice.webp',        'Printable invoice'],
      ['assets/shots/ummart-admin-dashboard.webp','Admin dashboard — statistics, charts, CRUD and Excel export'],
      ['assets/shots/ummart-contact.webp',        'Contact page'],
      ['assets/shots/ummart-about.webp',          'About page'],
      ['assets/shots/ummart-login.webp',          'Authentication — password and Google Sign-In'],
    ],
    klinik: [
      ['assets/shots/klinik-login.webp',           'Sign in — Klinik Pratama UM'],
      ['assets/shots/klinik-dashboard-admin.webp', 'Admin dashboard — counters and quick actions'],
      ['assets/shots/klinik-admin-dokter.webp',    'Admin — doctor management'],
      ['assets/shots/klinik-admin-jadwal.webp',    'Admin — practice schedule management'],
      ['assets/shots/klinik-admin-pembayaran.webp','Admin — cashier and payment reports'],
      ['assets/shots/klinik-dokter-pasien.webp',   'Doctor — appointment queue'],
      ['assets/shots/klinik-dokter-jadwal.webp',   'Doctor — own practice schedule'],
      ['assets/shots/klinik-pasien-jadwal.webp',   'Patient portal — browse doctor schedules'],
      ['assets/shots/klinik-pasien-janji.webp',    'Patient portal — appointment history'],
      ['assets/shots/klinik-register.webp',        'Patient registration'],
    ],
    nanggungan: [
      ['assets/thirdparty/nanggungan-home.webp',        'Homepage — Desa Nanggungan, Kayen Kidul'],
      ['assets/thirdparty/nanggungan-profil-desa.webp', 'Village profile and history'],
      ['assets/thirdparty/nanggungan-pasar-desa.webp',  'Village market'],
      ['assets/thirdparty/nanggungan-berita.webp',      'News and articles'],
    ],
  };

  /* ---------------------------------------------------------
     Certificates — 12 documents, each with the capability it
     evidences. Sorted strongest first (IP registrations, then
     campus awards, then certified courses).
     --------------------------------------------------------- */
  const CERTS = [
    { img:'assets/certs/hki-um-mart.webp', kind:'hki', label:'Intellectual property',
      title:'Registered IP — UM-MART e-commerce platform',
      issuer:'Ministry of Law of Indonesia (Kemenkumham)',
      evidences:'Original software authorship. Verifies that the UM-MART catalogue, cart, payment and admin systems are my own work.' },

    { img:'assets/certs/hki-smart-rakaat.webp', kind:'hki', label:'Intellectual property',
      title:'Registered IP — Smart Rakaat',
      issuer:'Ministry of Law of Indonesia (Kemenkumham)',
      evidences:'Product innovation and hardware-software integration, from concept through to a registered design.' },

    { img:'assets/certs/asisten-lab.webp', kind:'award', label:'Campus appointment',
      title:'Laboratory Teaching Assistant',
      issuer:'Universitas Negeri Malang · even semester 2025/2026',
      evidences:'Selected to teach and assess a laboratory course — technical depth plus the ability to explain it.' },

    { img:'assets/certs/pkm.webp', kind:'award', label:'National programme',
      title:'Program Kreativitas Mahasiswa (PKM)',
      issuer:'National student creativity programme · 2025',
      evidences:'Competitive national selection: research proposal writing and team-based project delivery.' },

    { img:'assets/certs/pkkmb.webp', kind:'award', label:'Campus award',
      title:'PKKMB Universitas Negeri Malang',
      issuer:'Campus orientation programme · 2024',
      evidences:'Campus-level recognition during new-student orientation.' },

    { img:'assets/certs/cisco-ite.webp', kind:'course', label:'Vendor certification',
      title:'IT Essentials',
      issuer:'Cisco Networking Academy',
      evidences:'Hardware, operating systems, networking and security fundamentals — the infrastructure layer under my web work.' },

    { img:'assets/certs/bootcamp-uiux.webp', kind:'course', label:'Bootcamp',
      title:'UI/UX Design Intensive Camp',
      issuer:'Intensive programme',
      evidences:'User research, wireframing, design systems and prototyping. Directly applied in the Figma project on this page.' },

    { img:'assets/certs/bootcamp-figma.webp', kind:'course', label:'Bootcamp',
      title:'Figma Camp',
      issuer:'Design tooling programme',
      evidences:'Components, auto-layout and interactive prototypes — the tool I design every interface in.' },

    { img:'assets/certs/bootcamp-excel.webp', kind:'course', label:'Certified course',
      title:'Data Visualization with Microsoft Excel',
      issuer:'MySkill',
      evidences:'Spreadsheet analysis and chart design, applied to the admin reporting and Excel export in UM-MART.' },

    { img:'assets/certs/diklat-nasional.webp', kind:'course', label:'National training',
      title:'Diklat Nasional',
      issuer:'National training programme · 2025',
      evidences:'Structured national-level training beyond the standard curriculum.' },

    { img:'assets/certs/ukbing.webp', kind:'course', label:'Language training',
      title:'English Proficiency Training (UKBING)',
      issuer:'Universitas Negeri Malang',
      evidences:'English reading and writing at a level sufficient for technical documentation and international sources.' },

    { img:'assets/certs/webinar-iot.webp', kind:'course', label:'Technical webinar',
      title:'IoT with Raspberry Pi',
      issuer:'Technical webinar',
      evidences:'Embedded computing and sensor integration — the hardware side of the Smart Rakaat work.' },
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
      b.innerHTML =
        '<div class="cert-card__img">' +
          '<span class="cert-card__kind" data-k="' + c.kind + '">' + (ICON[c.kind] || '') + c.label + '</span>' +
          '<img src="' + c.img + '" alt="' + c.title + '" loading="lazy">' +
        '</div>' +
        '<div class="cert-card__meta">' +
          '<h3>' + c.title + '</h3>' +
          '<p>' + c.evidences + '</p>' +
          '<span class="cert-card__src">' + c.issuer + '</span>' +
        '</div>';
      frag.appendChild(b);
    });
    grid.appendChild(frag);
    GALLERIES.certs = CERTS.map((c) => [c.img, c.title + ' — ' + c.issuer]);
  }

  /* ---------------------------------------------------------
     Lightbox
     --------------------------------------------------------- */
  const lb    = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCap = document.getElementById('lightboxCap');
  let current = { group: null, i: 0 };

  const render = () => {
    const g = GALLERIES[current.group];
    if (!g) return;
    const [src, cap] = g[current.i];
    lbImg.src = src;
    lbImg.alt = cap || '';
    lbCap.textContent = (cap || '') + '   ·   ' + (current.i + 1) + '/' + g.length;
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
     Nav
     --------------------------------------------------------- */
  const nav    = document.getElementById('nav');
  const links  = document.querySelector('.nav__links');
  const burger = document.querySelector('.nav__burger');
  const bar    = document.getElementById('progressBar');

  burger?.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(isOpen));
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
      glow.style.transform = 'translate(' + x + 'px, ' + y + 'px) translate(-50%,-50%)';
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
    revealables.forEach((el, i) => { el.style.transitionDelay = Math.min(i % 4, 3) * 70 + 'ms'; io.observe(el); });
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
