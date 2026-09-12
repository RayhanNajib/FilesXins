/* ============================================================
  FilesXins - Rayhan Najib
  Interactions: reveal on scroll, nav state, project filter,
  lightbox galleries and the certificate grid.

  Every certificate entry states what the document verifies and
  which capability it evidences - the ATS-friendly framing.
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
  ['assets/shots/ummart-home.webp',  'Storefront - banners, promotions and product grid'],
  ['assets/shots/ummart-shop.webp',  'Catalogue - category browsing and filter combinations'],
  ['assets/shots/ummart-checkout.webp',  'Checkout - contact and shipping details'],
  ['assets/shots/ummart-payment-ovo.webp',  'Payment flow - OVO (GoPay, DANA and card use the same flow)'],
  ['assets/shots/ummart-order-complete.webp', 'Order confirmation - receipt summary'],
  ['assets/shots/ummart-transactions.webp',  'Customer transaction history'],
  ['assets/shots/ummart-invoice.webp',  'Printable invoice'],
  ['assets/shots/ummart-admin-dashboard.webp','Admin dashboard - statistics, charts, CRUD and Excel export'],
  ['assets/shots/ummart-contact.webp',  'Contact page'],
  ['assets/shots/ummart-about.webp',  'About page'],
  ['assets/shots/ummart-login.webp',  'Authentication - password and Google Sign-In'],
  ],
  klinik: [
  ['assets/shots/klinik-login.webp',  'Sign in - Klinik Pratama UM'],
  ['assets/shots/klinik-dashboard-admin.webp', 'Admin dashboard - counters and quick actions'],
  ['assets/shots/klinik-admin-dokter.webp',  'Admin - doctor management'],
  ['assets/shots/klinik-admin-jadwal.webp',  'Admin - practice schedule management'],
  ['assets/shots/klinik-admin-pembayaran.webp','Admin - cashier and payment reports'],
  ['assets/shots/klinik-dokter-pasien.webp',  'Doctor - appointment queue'],
  ['assets/shots/klinik-dokter-jadwal.webp',  'Doctor - own practice schedule'],
  ['assets/shots/klinik-pasien-jadwal.webp',  'Patient portal - browse doctor schedules'],
  ['assets/shots/klinik-pasien-janji.webp',  'Patient portal - appointment history'],
  ['assets/shots/klinik-register.webp',  'Patient registration'],
  ],
  nanggungan: [
  ['assets/projects/desa/MENU_BERANDA_DESA_NANGGUNGAN.webp', 'Homepage - village profile, news and services (full page)'],
  ['assets/projects/desa/DASHBOARD_ADMIN_DESA_NANGGUNGAN.webp', 'Admin dashboard - village staff'],
  ['assets/projects/desa/MENU_PASAR_DESA_DESA_NANGGUNGAN.webp', 'Village market - local sellers and products'],
  ['assets/projects/desa/MENU_PERATURAN_DESA_NANGGUNGAN.webp', 'Village regulations - public documents'],
  ['assets/projects/desa/PENGATURAN_WEB_DESA_STATISTIK.webp', 'Site settings - population statistics'],
  ['assets/projects/desa/AKUN_PRODUK_UMKM.webp', 'UMKM product management'],
  ['assets/projects/desa/DASHBOARD_AKUN_ANGGOTA.webp', 'Member dashboard'],
  ['assets/projects/desa/DASHBOARD_AKUN_UMKM.webp', 'UMKM seller dashboard'],
  ['assets/projects/desa/DASHBOARD_PENJUALAN_AKUN_UMKM.webp', 'UMKM sales report'],
  ['assets/projects/desa/MENU_BERITA_DESA_ADMIN.webp', 'Admin - news management'],
  ['assets/projects/desa/MENU_BERITA_DESA_NANNGUNGAN.webp', 'News list - published articles'],
  ['assets/projects/desa/MENU_EDIT_BERITA_DESA_ADMIN.webp', 'Admin - edit article'],
  ['assets/projects/desa/MENU_EDIT_PERATURAN_DESA_ADMIN.webp', 'Admin - edit regulation'],
  ['assets/projects/desa/MENU_ISI_BERITA_DESA_NANGGUNGAN.webp', 'Article page - full text and media'],
  ['assets/projects/desa/MENU_ISI_UMKM_DESA_NANGGUNGAN.webp', 'UMKM detail - local business page'],
  ['assets/projects/desa/MENU_LOGIN_DESA_NANGGUNGAN.webp', 'Login - staff and UMKM accounts'],
  ['assets/projects/desa/MENU_PERATURAN_DESA_ADMIN.webp', 'Admin - regulation management'],
  ['assets/projects/desa/MENU_PROFIL_AKUN.webp', 'Account profile'],
  ['assets/projects/desa/MENU_PROFIL_AND_SEJARAH_DESA_NANGGUNGAN.webp', 'Village profile and history'],
  ['assets/projects/desa/MENU_VERIFIKASI_PRODUK_UMKM_ADMIN.webp', 'Admin - UMKM product verification'],
  ['assets/projects/desa/PENGATURAN_WEB_3_PILAR_DESA.webp', 'Site settings - the village\'s three pillars'],
  ['assets/projects/desa/PENGATURAN_WEB_APARATUR_DESA.webp', 'Site settings - village officials'],
  ['assets/projects/desa/PENGATURAN_WEB_KONTAK_AND_LOKASI.webp', 'Site settings - contact and location'],
  ['assets/projects/desa/PENGATURAN_WEB_PROFIL_AND_SEJARAH_DESA.webp', 'Site settings - profile and history'],
  ['assets/projects/desa/PENGATURAN_WEB_VIDEO_YOUTUBE.webp', 'Site settings - embedded video'],
  ['assets/projects/desa/desa_izin.webp', 'Field visit - permission letter handover to the village office'],
  ['assets/projects/desa/desa_wawancara.webp', 'Field visit - collecting the village\'s data requirements'],
  ],
  figma: [
  ['assets/shots/figma-ummart-home.webp',  'UM-MART - homepage design'],
  ['assets/shots/figma-ummart-shop.webp',  'UM-MART - shop and catalogue'],
  ['assets/shots/figma-ummart-components.webp',  'UM-MART - component library'],
  ['assets/shots/figma-ummart-checkout.webp',  'UM-MART - checkout flow'],
  ['assets/shots/figma-viar-concept.webp',  'UI VIAR UM - concept and design board'],
  ['assets/shots/figma-smartipen.webp',  'SMARTIPEN - tablet interface'],
  ['assets/shots/figma-kkn-spanduk.webp',  'KKN - village post signage'],
  ],
  texum: [
  ['assets/shots/texum-title.webp',  'Title screen'],
  ['assets/shots/texum-gameplay.webp',  'In-game map - gameplay interface'],
  ['assets/shots/texum-battle.webp',  'Battle interface'],
  ['assets/shots/texum-menu-status.webp',  'Status menu'],
  ['assets/shots/texum-map-06.webp',  'Hand-built map (of 20)'],
  ['assets/shots/texum-map-11.webp',  'Hand-built map (of 20)'],
  ['assets/shots/texum-map-19.webp',  'Hand-built map (of 20)'],
  ['assets/shots/texum-enemy-phoenix.webp',  'Creature - Phoenix'],
  ['assets/shots/texum-enemy-chimera.webp',  'Creature - Chimera'],
  ['assets/shots/texum-enemy-orc.webp',  'Creature - Orc'],
  ['assets/shots/texum-enemy-marias.webp',  'Creature - Marias'],
  ['assets/shots/texum-icons.webp',  'Icon set'],
  ['assets/shots/texum-mockup.webp',  'Trailer mockup'],
  ],
  renders: [
  ['assets/shots/blender-pc.webp',  'PC build - hard-surface model'],
  ['assets/shots/blender-classroom.webp',  'Classroom interior scene'],
  ['assets/shots/blender-smartipen.webp',  'Smartipen - internals'],
  ['assets/shots/blender-smartipen-detail.webp', 'Smartipen - product detail'],
  ['assets/shots/blender-lab-um.webp',  'Laboratory scene'],
  ['assets/shots/blender-keyboard.webp',  'Keyboard model'],
  ['assets/shots/blender-gunting-kuku.webp',  'Nail clipper - edit mode'],
  ['assets/shots/blender-cooler.webp',  'Cooling assembly'],
  ['assets/shots/blender-maskot-um.webp',  'Campus mascot character'],
  ['assets/shots/blender-sate-meraja.webp',  'Sate Meraja - turntable render'],
  ['assets/shots/blender-smart-rakaat.webp',  'Smart Rakaat - device model'],
  ['assets/shots/blender-animation.webp',  'Animation scene'],
  ['assets/shots/blender-chain-weapon.webp',  'Chain weapon prop'],
  ['assets/shots/blender-magnifier.webp',  'Magnifier render'],
  ['assets/shots/blender-plane.webp',  'Aircraft render'],
  ['assets/shots/blender-render-plate.webp',  'Studio render'],
  ['assets/shots/blender-mockup-cover.webp',  'Mockup - cover'],
  ],
  wsblender: [
  ['assets/shots/ws-blender-pc.webp',  'Blender workspace - hard-surface modelling'],
  ['assets/shots/ws-blender-keyboard.webp',  'Blender workspace - keyboard in edit mode'],
  ['assets/shots/ws-blender-gunting-kuku.webp',  'Blender workspace - product detail pass'],
  ['assets/shots/ws-blender-smartrakaat.webp',  'Blender workspace - Smart Rakaat enclosure'],
  ],
  wsmedia: [
  ['assets/shots/ws-premiere-sate-meraja.webp',  'Premiere Pro timeline - Sate Meraja teaser'],
  ['assets/shots/ws-premiere-member.webp',  'Premiere Pro - multi-clip sequence'],
  ['assets/shots/ws-premiere-logo-edit.webp',  'Premiere Pro - logo ident keyframes'],
  ['assets/shots/ws-photoshop-design.webp',  'Photoshop workspace - print layout'],
  ],
  iot: [
  ['assets/shots/ws-fritzing-rakaat.webp',  'Circuit schematic - drawn in Fritzing'],
  ['assets/shots/iot-rakaat-device.webp',  'Assembled Smart Rakaat device'],
  ['assets/shots/iot-device-photo.webp',  'Device in operation'],
  ['assets/shots/ws-blender-smartrakaat.webp',  'Enclosure modelled in Blender'],
  ],
  };

  /* ---------------------------------------------------------
  Certificates - 12 documents, each with the capability it
  evidences. Sorted strongest first (IP registrations, then
  campus awards, then certified courses).
  --------------------------------------------------------- */
  const CERTS = [
  { img:'assets/certs/hki-um-mart.webp', kind:'hki', label:'Intellectual property',
  title:'Registered IP - UM-MART e-commerce platform',
  issuer:'Ministry of Law of Indonesia (Kemenkumham)',
  evidences:'Original software authorship. Verifies that the UM-MART catalogue, cart, payment and admin systems are my own work.' },

  { img:'assets/certs/hki-smart-rakaat.webp', kind:'hki', label:'Intellectual property',
  title:'Registered IP - Smart Rakaat',
  issuer:'Ministry of Law of Indonesia (Kemenkumham)',
  evidences:'Product innovation and hardware-software integration, from concept through to a registered design.' },

  { img:'assets/certs/asisten-lab.webp', kind:'award', label:'Campus appointment',
  title:'Laboratory Teaching Assistant',
  issuer:'Universitas Negeri Malang · even semester 2025/2026',
  evidences:'Selected to teach and assess a laboratory course - technical depth plus the ability to explain it.' },

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
  evidences:'Hardware, operating systems, networking and security fundamentals - the infrastructure layer under my web work.' },

  { img:'assets/certs/bootcamp-uiux.webp', kind:'course', label:'Bootcamp',
  title:'UI/UX Design Intensive Camp',
  issuer:'Intensive programme',
  evidences:'User research, wireframing, design systems and prototyping. Directly applied in the Figma project on this page.' },

  { img:'assets/certs/bootcamp-figma.webp', kind:'course', label:'Bootcamp',
  title:'Figma Camp',
  issuer:'Design tooling programme',
  evidences:'Components, auto-layout and interactive prototypes - the tool I design every interface in.' },

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
  evidences:'Embedded computing and sensor integration - the hardware side of the Smart Rakaat work.' },
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
  GALLERIES.certs = CERTS.map((c) => [c.img, c.title + ' - ' + c.issuer]);
  }

  /* ---------------------------------------------------------
  Lightbox
  --------------------------------------------------------- */
  const lb  = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCap = document.getElementById('lightboxCap');
  let current = { group: null, i: 0 };

  const render = () => {
  const g = GALLERIES[current.group];
  if (!g) return;
  const [src, cap] = g[current.i];
  lbImg.src = src;
  lbImg.alt = cap || '';
  lbCap.textContent = (cap || '') + '  ·  ' + (current.i + 1) + '/' + g.length;
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
  const nav  = document.getElementById('nav');
  const links  = document.querySelector('.nav__links');
  const burger = document.querySelector('.nav__burger');
  const bar  = document.getElementById('progressBar');

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

  /* ---------------------------------------------------------
  Horizontal scroll for workspace shots
  --------------------------------------------------------- */
  document.querySelectorAll('.shots-scroll').forEach((wrap) => {
  const strip = wrap.querySelector('.project__shots');
  const prev = wrap.querySelector('.shots-scroll__btn--prev');
  const next = wrap.querySelector('.shots-scroll__btn--next');
  const step = () => {
  const tile = strip?.querySelector('.shot');
  const w = tile ? tile.getBoundingClientRect().width + 8 : 280;
  return Math.max(160, Math.round(w));
  };
  const sync = () => {
  if (!strip) return;
  const max = strip.scrollWidth - strip.clientWidth;
  wrap.classList.toggle('is-static', max <= 2);
  prev && (prev.disabled = strip.scrollLeft <= 2);
  next && (next.disabled = strip.scrollLeft >= max - 2);
  };
  prev?.addEventListener('click', () => strip?.scrollBy({ left: -step(), behavior: 'smooth' }));
  next?.addEventListener('click', () => strip?.scrollBy({ left: step(), behavior: 'smooth' }));
  strip?.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  sync();
  });

  /* ---------------------------------------------------------
  i18n (ID / EN language toggle)
  --------------------------------------------------------- */
  const langToggle = document.getElementById('langToggle');
  let currentLang = localStorage.getItem('lang') || 'id';

  const setLanguage = (lang) => {
  currentLang = lang;
  document.documentElement.lang = lang;
  if (langToggle) langToggle.textContent = lang === 'id' ? 'EN' : 'ID';
  document.querySelectorAll('[data-id][data-en]').forEach((el) => {
  el.textContent = lang === 'en' ? el.dataset.en : el.dataset.id;
  });
  };

  langToggle?.addEventListener('click', () => {
  const nextLang = currentLang === 'id' ? 'en' : 'id';
  localStorage.setItem('lang', nextLang);
  setLanguage(nextLang);
  });

  setLanguage(currentLang);
})();
