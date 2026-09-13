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
    ['assets/shots/ummart-home.webp', 'Storefront - merchandise & kafe kopi UM Mart'],
    ['assets/shots/ummart-shop.webp', 'Katalog Produk - kategori, filter & pencarian'],
    ['assets/shots/ummart-checkout.webp', 'Formulir Checkout & Alamat'],
    ['assets/shots/ummart-payment-ovo.webp', 'Integrasi Pembayaran OVO & E-Wallet'],
    ['assets/shots/ummart-order-complete.webp', 'Konfirmasi Pesanan & Ringkasan Resi'],
    ['assets/shots/ummart-transactions.webp', 'Riwayat Transaksi Pelanggan'],
    ['assets/shots/ummart-invoice.webp', 'Cetak Invoice Resmi'],
    ['assets/shots/ummart-admin-dashboard.webp', 'Dashboard Admin BPUDA - Grafik & CRUD'],
    ['assets/shots/ummart-contact.webp', 'Halaman Kontak & Bantuan'],
    ['assets/shots/ummart-about.webp', 'Informasi Unit Usaha UM Mart'],
    ['assets/shots/ummart-login.webp', 'Autentikasi Ganda (Password & Google OAuth)'],
  ],
  klinik: [
    ['assets/shots/klinik-login.webp', 'Portal Masuk Sistem Klinik Pratama UM'],
    ['assets/shots/klinik-dashboard-admin.webp', 'Dashboard Manajemen Klinik - Ringkasan Layanan'],
    ['assets/shots/klinik-admin-dokter.webp', 'Manajemen Data Dokter Umum & Gigi'],
    ['assets/shots/klinik-admin-jadwal.webp', 'Pengaturan Jadwal Praktik Dokter'],
    ['assets/shots/klinik-admin-pembayaran.webp', 'Kasir & Laporan Transaksi Berobat'],
    ['assets/shots/klinik-dokter-pasien.webp', 'Antrean & Rekam Medis Dokter'],
    ['assets/shots/klinik-dokter-jadwal.webp', 'Jadwal Praktik Per Dokter'],
    ['assets/shots/klinik-pasien-jadwal.webp', 'Informasi Jadwal Poli Umum, Gigi & KIA'],
    ['assets/shots/klinik-pasien-janji.webp', 'Booking & Riwayat Berobat Pasien'],
    ['assets/shots/klinik-register.webp', 'Pendaftaran Akun Pasien Baru'],
  ],
  nanggungan: [
    ['assets/projects/desa/MENU_BERANDA_DESA_NANGGUNGAN.webp', 'Halaman Utama Portal Nanggungan Digdaya'],
    ['assets/projects/desa/DASHBOARD_ADMIN_DESA_NANGGUNGAN.webp', 'Dashboard Admin Staf Desa'],
    ['assets/projects/desa/MENU_PASAR_DESA_DESA_NANGGUNGAN.webp', 'Pasar Desa Online - Produk UMKM Lokal'],
    ['assets/projects/desa/MENU_PERATURAN_DESA_NANGGUNGAN.webp', 'Dokumen Transparansi & Peraturan Desa'],
    ['assets/projects/desa/PENGATURAN_WEB_DESA_STATISTIK.webp', 'Statistik Kependudukan & Wilayah Desa'],
    ['assets/projects/desa/AKUN_PRODUK_UMKM.webp', 'Manajemen Katalog Produk UMKM Desa'],
    ['assets/projects/desa/DASHBOARD_AKUN_UMKM.webp', 'Dashboard Pelaku Usaha Desa'],
    ['assets/projects/desa/MENU_BERITA_DESA_NANNGUNGAN.webp', 'Warta & Pengumuman Resmi Desa'],
    ['assets/projects/desa/MENU_PROFIL_AND_SEJARAH_DESA_NANGGUNGAN.webp', 'Profil Sejarah & Potensi Desa Nanggungan'],
  ],
  figma: [
    ['assets/shots/figma-ummart-home.webp', 'UM-MART - Antarmuka E-Commerce Kampus'],
    ['assets/shots/figma-ummart-shop.webp', 'UM-MART - Layout Katalog & Filter'],
    ['assets/shots/figma-ummart-components.webp', 'UM-MART - Sistem Komponen UI'],
    ['assets/shots/figma-ummart-checkout.webp', 'UM-MART - Desain Alur Checkout'],
    ['assets/shots/figma-viar-concept.webp', 'UI VIAR UM - Game AR Media Pembelajaran Anak TKJ (Unity Engine)'],
    ['assets/shots/figma-smartipen.webp', 'Konsep meniru gaya poster ala instagram UM'],
    ['assets/shots/figma-kkn-spanduk.webp', 'Desain banner KKN nanggungan UM BBM 2026'],
  ],
  texum: [
    ['assets/shots/texum-title.webp', 'Layar Judul Game TEXUM (RPG Maker MZ)'],
    ['assets/shots/texum-gameplay.webp', 'Gameplay & Eksplorasi Peta RPG'],
    ['assets/shots/texum-battle.webp', 'Sistem Pertarungan Turn-Based RPG'],
    ['assets/shots/texum-menu-status.webp', 'Antarmuka Menu Status & Item Karakter'],
    ['assets/shots/texum-map-06.webp', 'Peta 3D World (1 dari 20 Peta Buatan Tangan)'],
    ['assets/shots/texum-enemy-phoenix.webp', 'Desain Karakter & Monster - Phoenix'],
    ['assets/shots/texum-mockup.webp', 'Mockup Rilis Game TEXUM'],
  ],
  wsblender: [
    ['assets/shots/Workspace Blender MyPC.png', 'Workspace Blender - Pemodelan PC Desktop'],
    ['assets/shots/Workspace Blender Classroom XII MIPA 1.png', 'Workspace Blender - Desain Kelas XII MIPA 1'],
    ['assets/shots/Workspace Blender Cooler Blackshark Pro 2.png', 'Workspace Blender - Pemodelan Cooler Blackshark Pro 2'],
    ['assets/shots/Workspace Blender Cutting Nail.png', 'Workspace Blender - Pemodelan Gunting Kuku'],
    ['assets/shots/Workspace Blender Hand Sanitizer.png', 'Workspace Blender - Pemodelan Hand Sanitizer'],
    ['assets/shots/Workspace Blender Keyboard HP GK 100.png', 'Workspace Blender - Pemodelan Keyboard HP GK 100'],
    ['assets/shots/Workspace Concept Smart Rakaat.png', 'Workspace Blender - Konsep Casing Smart Rakaat'],
    ['assets/shots/Workspace Keycaps Blender.jpg', 'Workspace Blender - Pemodelan Keycaps Mechanical Keyboard'],
    ['assets/shots/Workspace Model 3D Cakra.jpg', 'Workspace Blender - Pemodelan Ikon Cakra UM 3D'],
  ],
  renders: [
    ['assets/shots/Project Render Blender Classroom XII MIPA 1.png', 'Output Render Blender - Interior Ruang Kelas XII MIPA 1'],
    ['assets/shots/Project Render Blender Concept SMART RAKAAT.png', 'Output Render Blender - Konsep Casing Perangkat Smart Rakaat'],
    ['assets/shots/Project Render Blender Cutting Nail.png', 'Output Render Blender - Produk Gunting Kuku 3D'],
    ['assets/shots/Project Render Blender Hand Sanitizer.png', 'Output Render Blender - Botol Hand Sanitizer 3D'],
    ['assets/shots/Project Render Blender Keyboard HP GK 100.PNG', 'Output Render Blender - Mechanical Keyboard HP GK 100'],
  ],
  wsmedia: [
    ['assets/shots/Workspace Intro KKN Logo Premiere pro.png', 'Workspace Premiere Pro - Editing Motion Intro Logo KKN Kelompok H'],
    ['assets/shots/Workspace Editing Teaser Logo Meraja Premiere pro.png', 'Workspace Premiere Pro - Timeline Editing Teaser Logo Meraja'],
    ['assets/shots/Workspace Editing TrailerLogo Meraja Premiere pro.png', 'Workspace Premiere Pro - Timeline Editing Trailer Sate Meraja'],
    ['assets/shots/Project Edit Poster With Photoshop.png', 'Workspace Photoshop - Desain Poster Media Pembelajaran & Promosi'],
  ],
  iot: [
    ['assets/shots/Skema Rangkaian SMART RAKAAT FRITIZING.png', 'Skema Rangkaian Elektronika Smart Rakaat (Fritzing)'],
    ['assets/shots/Project Render Blender Concept SMART RAKAAT.png', 'Model 3D Casing Perangkat Smart Rakaat (Blender)'],
  ],
};

  /* ---------------------------------------------------------
  Certificates - 12 documents, each with the capability it
  evidences. Sorted strongest first (IP registrations, then
  campus awards, then certified courses).
  --------------------------------------------------------- */
  
  


  /* ---------------------------------------------------------
  Certificate grid
  --------------------------------------------------------- */
  

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
  const nav = document.getElementById('topbar') || document.querySelector('.topbar') || document.querySelector('.nav');
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
  nav?.classList.toggle('is-stuck', window.scrollY > 24);
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



/* ---------------------------------------------------------
Certificate Pagination & Dynamic Filter Render
--------------------------------------------------------- */

  const CERTS = [
  { img:'assets/certs/hki-um-mart.webp', kind:'hki', label:'Kekayaan Intelektual',
    title:'Sertifikat HKI Registered - UM-MART Platform E-Commerce',
    issuer:'Kementerian Hukum & HAM RI (Kemenkumham)',
    evidences:'Hak Cipta Perangkat Lunak Resmi UM-MART (Sistem Katalog, Keranjang, Kasir & Admin).' },

  { img:'assets/certs/hki-smart-rakaat.webp', kind:'hki', label:'Kekayaan Intelektual',
    title:'Sertifikat HKI Registered - Smart Rakaat IoT',
    issuer:'Kementerian Hukum & HAM RI (Kemenkumham)',
    evidences:'Hak Cipta Perangkat IoT Alat Penghitung Rakaat Salat Otomatis Berbasis ESP32.' },

  { img:'assets/certs/asisten-lab.webp', kind:'award', label:'Penugasan Kampus',
    title:'Asisten Laboratorium Komputer',
    issuer:'Departemen Teknik Elektro & Informatika UM (Genap 2025/2026)',
    evidences:'Penugasan mengajar & mendampingi praktikum mahasiswa di laboratorium komputer.' },

  { img:'assets/certs/cisco-ite.webp', kind:'course', label:'Sertifikasi Vendor',
    title:'Cisco Networking Academy - IT Essentials',
    issuer:'Cisco Systems International',
    evidences:'Kompetensi hardware komputer, sistem operasi, jaringan dasar, dan keamanan IT.' },

  { img:'assets/certs/pkm.webp', kind:'award', label:'Program Nasional',
    title:'Program Kreativitas Mahasiswa (PKM)',
    issuer:'Kemendikbudristek / Kemenristekdikti RI',
    evidences:'Seleksi proposal PKM inovasi teknologi hardware & perangkat cerdas disgrafia.' },

  { img:'assets/certs/bootcamp-uiux.webp', kind:'course', label:'Bootcamp',
    title:'UI/UX Design Intensive Camp',
    issuer:'Intensive Bootcamp Program',
    evidences:'Kompetensi riset pengguna, wireframing, sistem UI, dan pembuatan prototipe interaktif.' },

  { img:'assets/certs/bootcamp-figma.webp', kind:'course', label:'Bootcamp',
    title:'Figma Design Camp',
    issuer:'Design Tooling Certification',
    evidences:'Penguasaan fitur Figma advance: auto-layout, komponen UI, & prototipe.' },

  { img:'assets/certs/bootcamp-excel.webp', kind:'course', label:'Kursus Bersertifikat',
    title:'Data Visualization with Microsoft Excel',
    issuer:'MySkill Certification',
    evidences:'Analisis data spreadsheet dan pembuatan grafik visualisasi statistik admin.' },

  { img:'assets/certs/workshop-ai.webp', kind:'course', label:'Workshop',
    title:'Workshop Generative AI & Technology',
    issuer:'Penyelenggara Workshop Teknologi',
    evidences:'Pemanfaatan kecerdasan buatan untuk akselerasi alur kerja pengembangan IT.' },

  { img:'assets/certs/workshop-iot.webp', kind:'course', label:'Workshop',
    title:'Workshop Internet of Things (IoT)',
    issuer:'Workshop Pembelajaran IoT',
    evidences:'Pengembangan sistem embedded, mikrokontroler, dan pengiriman data sensor.' },

  { img:'assets/certs/workshop-plc.webp', kind:'course', label:'Workshop',
    title:'Workshop Automation & PLC',
    issuer:'Pelatihan Otomasi Industri',
    evidences:'Dasar pemograman logika kontroler otomatisasi dan sistem kontrol.' },

  { img:'assets/certs/workshop-cendekia.webp', kind:'course', label:'Workshop',
    title:'Workshop Cendekia Menulis Karya Ilmiah',
    issuer:'Forum Cendekia Akademik',
    evidences:'Keterampilan penyusunan karya ilmiah dan publikasi teknis.' },

  { img:'assets/certs/webinar-iot.webp', kind:'course', label:'Webinar',
    title:'Webinar IoT dengan Raspberry Pi',
    issuer:'Webinar Nasional IoT',
    evidences:'Integrasi Raspberry Pi, sistem Linux embedded, dan komunikasi sensor jarak jauh.' },

  { img:'assets/certs/webinar-gemapedia.webp', kind:'course', label:'Webinar',
    title:'Webinar Nasional Pendidikan - GEMAPEDIA',
    issuer:'UKM GEMAPEDIA Universitas Negeri Malang',
    evidences:'Partisipasi webinar nasional penguatan inovasi pendidikan inklusif.' },

  { img:'assets/certs/webinar-mdgb.webp', kind:'course', label:'Webinar',
    title:'Webinar MDGB Kuliah Bestari UM',
    issuer:'Majelis Dewan Guru Besar UM',
    evidences:'Wawasan akademik kepemimpinan dan inovasi sains teknologi.' },

  { img:'assets/certs/webinar-politik.webp', kind:'course', label:'Webinar',
    title:'Seminar Nasional Ilmu Politik',
    issuer:'Fakultas Ilmu Sosial Universitas Negeri Malang',
    evidences:'Partisipasi seminar akademik nasional tata kelola dan analisis isu publik.' },

  { img:'assets/certs/webinar-ppkn.webp', kind:'course', label:'Webinar',
    title:'Webinar Nasional PPKN FIS UM',
    issuer:'Fakultas Ilmu Sosial Universitas Negeri Malang',
    evidences:'Partisipasi webinar penguatan wawasan kebangsaan & etika digital.' },

  { img:'assets/certs/diklat-nasional.webp', kind:'course', label:'Diklat',
    title:'Diklat Nasional Pengembangan Kompetensi',
    issuer:'Program Diklat Nasional 2025',
    evidences:'Pengembangan kapasitas diri, kepemimpinan, dan kerja sama tim.' },

  { img:'assets/certs/ldk-positron.webp', kind:'award', label:'Pelatihan Organisasi',
    title:'Pelatihan LDK Positron 2024',
    issuer:'Himpunan Mahasiswa / Organisasi Kampus UM',
    evidences:'Latihan Dasar Kepemimpinan (LDK) penguatan manajemen organisasi kampus.' },

  { img:'assets/certs/pemira-2024.webp', kind:'award', label:'Kepanitiaan Kampus',
    title:'Sertifikat Pemilu Raya (PEMIRA) 2024',
    issuer:'Panitia Pemira Universitas Negeri Malang',
    evidences:'Keterlibatan aktif dalam suksesi demokrasi mahasiswa kampus UM 2024.' },

  { img:'assets/certs/pemira-2025.webp', kind:'award', label:'Kepanitiaan Kampus',
    title:'Sertifikat Pemilu Raya (PEMIRA) 2025',
    issuer:'Panitia Pemira Universitas Negeri Malang',
    evidences:'Keterlibatan aktif dalam suksesi demokrasi mahasiswa kampus UM 2025.' },

  { img:'assets/certs/pkkmb.webp', kind:'award', label:'Penghargaan Kampus',
    title:'PKKMB Universitas Negeri Malang',
    issuer:'Panitia Orientation Kampus UM 2024',
    evidences:'Kelulusan & penghargaan partisipasi orientasi mahasiswa baru UM.' },

  { img:'assets/certs/ukbing.webp', kind:'course', label:'Pelatihan Bahasa',
    title:'English Proficiency Training (UKBING)',
    issuer:'Balai Bahasa Universitas Negeri Malang',
    evidences:'Kompetensi membaca, mendengarkan, dan menulis dokumentasi teknis Bahasa Inggris.' },
];

  


  

  let currentCertPage = 1;
const CERTS_PER_PAGE = 6;
let currentCertFilter = 'all';

const renderCertificates = () => {
  const grid = document.querySelector('.certs');
  if (!grid) return;
  
  let filtered = CERTS;
  if (currentCertFilter !== 'all') {
    filtered = CERTS.filter(c => c.kind === currentCertFilter);
  }
  
  const totalPages = Math.max(1, Math.ceil(filtered.length / CERTS_PER_PAGE));
  if (currentCertPage > totalPages) currentCertPage = totalPages;
  
  const startIdx = (currentCertPage - 1) * CERTS_PER_PAGE;
  const pageItems = filtered.slice(startIdx, startIdx + CERTS_PER_PAGE);
  
  grid.innerHTML = pageItems.map((c, i) => `
    <button class="cert-card reveal is-in" data-cert-idx="${CERTS.indexOf(c)}">
      <div class="cert-card__img">
        <img src="${c.img}" alt="${c.title}" loading="lazy">
        <span class="cert-card__kind" data-k="${c.kind}">
          <svg class="ico"><use href="#ico-${c.kind === 'hki' ? 'award' : (c.kind === 'award' ? 'circle-check' : 'book-open')}"></use></svg>
          ${c.label}
        </span>
      </div>
      <div class="cert-card__meta">
        <h3>${c.title}</h3>
        <p>${c.evidences}</p>
        <span class="cert-card__src">${c.issuer}</span>
      </div>
    </button>
  `).join('');
  
  let paginBar = document.querySelector('.certs-pagination-bar');
  if (!paginBar) {
    paginBar = document.createElement('div');
    paginBar.className = 'certs-pagination-bar';
    grid.after(paginBar);
  }
  
  paginBar.innerHTML = `
    <div class="certs-page-info">
      Halaman ${currentCertPage} dari ${totalPages} (${filtered.length} Sertifikat)
    </div>
    <div class="certs-page-nav">
      <button class="certs-page-btn certs-prev" ${currentCertPage === 1 ? 'disabled' : ''}>
        <svg class="ico"><use href="#ico-chevron-left"></use></svg> Prev
      </button>
      <div class="certs-page-dots">
        ${Array.from({length: totalPages}).map((_, idx) => `
          <span class="certs-dot ${idx + 1 === currentCertPage ? 'is-active' : ''}" data-page="${idx + 1}"></span>
        `).join('')}
      </div>
      <button class="certs-page-btn certs-next" ${currentCertPage === totalPages ? 'disabled' : ''}>
        Next <svg class="ico"><use href="#ico-chevron-right"></use></svg>
      </button>
    </div>
  `;
  
  paginBar.querySelector('.certs-prev')?.addEventListener('click', () => {
    if (currentCertPage > 1) {
      currentCertPage--;
      renderCertificates();
    }
  });
  paginBar.querySelector('.certs-next')?.addEventListener('click', () => {
    if (currentCertPage < totalPages) {
      currentCertPage++;
      renderCertificates();
    }
  });
  paginBar.querySelectorAll('.certs-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      currentCertPage = Number(dot.dataset.page);
      renderCertificates();
    });
  });
  
  grid.querySelectorAll('.cert-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = Number(card.dataset.certIdx);
      const cert = CERTS[idx];
      if (cert) openLightboxSingle(cert.img, `${cert.title} — ${cert.issuer}`);
    });
  });
};

/* Helper for single image lightbox */
const openLightboxSingle = (imgUrl, caption) => {
  const box = document.getElementById('lightbox');
  if (!box) return;
  const imgEl = box.querySelector('.lightbox__img');
  const capEl = box.querySelector('.lightbox__caption');
  if (imgEl) imgEl.src = imgUrl;
  if (capEl) capEl.textContent = caption;
  box.hidden = false;
  box.classList.add('is-open');
};

/* ---------------------------------------------------------
Custom Video Player Handler
--------------------------------------------------------- */
const setupCustomVideoPlayers = () => {
  document.querySelectorAll('.custom-video-player').forEach(player => {
    const video = player.querySelector('video');
    const playBtn = player.querySelector('.v-play');
    const progress = player.querySelector('.v-progress');
    const timeDisplay = player.querySelector('.v-time');
    const muteBtn = player.querySelector('.v-mute');
    const volume = player.querySelector('.v-volume');
    const fullBtn = player.querySelector('.v-fullscreen');
    
    if (!video) return;
    
    const formatTime = (sec) => {
      if (isNaN(sec) || !isFinite(sec)) return '0:00';
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (video.paused) {
          video.play();
        } else {
          video.pause();
        }
      });
    }
    video.addEventListener('play', () => {
      if (playBtn) playBtn.innerHTML = '<svg class="ico"><use href="#ico-pause"></use></svg>';
    });
    video.addEventListener('pause', () => {
      if (playBtn) playBtn.innerHTML = '<svg class="ico"><use href="#ico-play"></use></svg>';
    });
    
    video.addEventListener('timeupdate', () => {
      if (progress && video.duration) {
        progress.value = (video.currentTime / video.duration) * 100;
      }
      if (timeDisplay) {
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
      }
    });
    
    if (progress) {
      progress.addEventListener('input', () => {
        if (video.duration) {
          video.currentTime = (progress.value / 100) * video.duration;
        }
      });
    }
    
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted ? 
          '<svg class="ico"><use href="#ico-volume-x"></use></svg>' : 
          '<svg class="ico"><use href="#ico-volume-2"></use></svg>';
      });
    }
    if (volume) {
      volume.addEventListener('input', () => {
        video.volume = volume.value / 100;
        video.muted = (video.volume === 0);
      });
    }
    
    if (fullBtn) {
      fullBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          player.requestFullscreen().catch(err => console.log(err));
        } else {
          document.exitFullscreen().catch(err => console.log(err));
        }
      });
    }
  });
};

document.addEventListener('DOMContentLoaded', () => {
  renderCertificates();
  setupCustomVideoPlayers();
});

