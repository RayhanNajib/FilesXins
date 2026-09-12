document.addEventListener('DOMContentLoaded', () => {
    // =======================================================
    // --- 1. SETUP GLOBAL & API URLS ---
    // =======================================================
    
    // --- API Endpoints ---
    const statsApiURL = '../api/admin/get_statistics.php';
    const exportApiURL = '../api/admin/export_excel.php';
    const chartApiURL = '../api/admin/get_chart_data.php'; 
    
    const productApiURL = '../api/admin/manage_products.php';
    const categoryApiURL = '../api/admin/manage_categories.php'; 
    const hCategoryApiURL = '../api/admin/manage_horizontal_categories.php';
    const mainBannerApiURL = '../api/admin/manage_banners.php';
    const showcaseBannerApiURL = '../api/admin/manage_showcase_banners.php';
    const voucherApiURL = '../api/admin/manage_vouchers.php';
    const statusApiURL = '../api/admin/manage_statuses.php';
    const settingsApiURL = '../api/admin/manage_settings.php';

    // --- Variabel Global untuk Chart ---
    let salesChartInstance = null; 

    // --- DOM Elements: Sidebar & Sections ---
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const sections = document.querySelectorAll('.management-section');
    
    // --- Elemen Dashboard ---
    const statsFilter = document.getElementById('stats-filter');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const statTotalSales = document.getElementById('stat-total-sales');
    const statTotalOrders = document.getElementById('stat-total-orders');
    const statNewUsers = document.getElementById('stat-total-new-users');
    const statTopProduct = document.getElementById('stat-top-product');
    const chartTitle = document.getElementById('chart-title');
    const salesChartCanvas = document.getElementById('salesChart'); 

    // --- DOM Elements: Forms & Tables ---
    const productForm = document.getElementById('product-form');
    const productTableBody = document.getElementById('product-table-body');
    const categoryForm = document.getElementById('category-form');
    const categoryTableBody = document.getElementById('category-table-body');
    const categoryCancelBtn = categoryForm?.querySelector('button[type="reset"]');
    const hCategoryForm = document.getElementById('horizontal-category-form');
    const hCategoryTableBody = document.getElementById('horizontal-category-table-body');
    const hCategoryCancelBtn = hCategoryForm?.querySelector('button[type="reset"]');
    const mainBannerForm = document.getElementById('main-banner-form');
    const mainBannerTableBody = document.getElementById('main-banner-table-body');
    const showcaseBannerForm = document.getElementById('showcase-banner-form');
    const showcaseBannerTableBody = document.getElementById('showcase-banner-table-body');
    const promoBannerForm = document.getElementById('promo-banner-form');
    const voucherForm = document.getElementById('voucher-form');
    const voucherTableBody = document.getElementById('voucher-table-body');
    const statusForm = document.getElementById('status-form');
    const statusTableBody = document.getElementById('status-table-body');
    const siteSettingsForm = document.getElementById('site-settings-form');
    const bannerTabs = document.querySelectorAll('#banner-management .sub-nav-btn');
    const bannerTabContents = document.querySelectorAll('#banner-management .sub-management-section');


    // =======================================================
    // --- 2. FUNGSI UTILITAS (TERMASUK FIX 'UNDEFINED') ---
    // =======================================================

    /**
     * Helper baru untuk menampilkan notifikasi dari API.
     * Ini mencegah error "undefined".
     */
    function showApiResponseNotification(result) {
        if (typeof UINotification === 'undefined') {
            UINotification.show("UINotification modul belum dimuat.");
            UINotification.show(result.message || (result.success ? 'Sukses' : 'Error')); // Fallback ke UINotification.show
            return;
        }
        
        const type = result.success ? 'success' : 'error';
        
        // Beri pesan cadangan jika result.message kosong atau undefined
        const message = result.message || (result.success ? 'Aksi berhasil!' : 'Terjadi kesalahan.');
        
        if (result.success) {
            // Notifikasi sukses hilang dalam 2 detik (2000ms)
            UINotification.show(message, type, 5000);
        } else {
            // Notifikasi error tetap 5 detik (5000ms) atau lebih lama
            UINotification.show(message, type, 10000);
        }
    }

    /**
     * Mengisi form dengan data untuk keperluan Edit.
     */
    function populateForm(formElement, data) {
        if (!formElement || !formElement.tagName || formElement.tagName !== 'FORM') {
            UINotification.show("populateForm Error: Elemen bukan form valid.", formElement);
            return;
        }

        const formId = formElement.getAttribute('id');
        if (!formId) {
            UINotification.show("Form ID tidak ditemukan pada elemen:", formElement);
            return;
        }

        formElement.reset();

        for (const key in data) {
            const inputElement = formElement.elements[key];
            if (inputElement) {
                if (inputElement.type === 'checkbox') {
                    inputElement.checked = (data[key] == 1 || data[key] === true);
                } else if (inputElement.type !== 'file') {
                    if (inputElement.name === 'discount') {
                        inputElement.value = parseFloat(data[key]) || 0;
                    } else {
                        inputElement.value = data[key];
                    }
                }
            }
        }
        
        let hiddenIdInput = formElement.querySelector('input[name="id"]');
        if (hiddenIdInput && data.id) {
            hiddenIdInput.value = data.id;
        }

        const fileInput = formElement.querySelector('input[type="file"]');
        if (fileInput) fileInput.required = false;

        const imagePath = data.image_path || data.icon_path;
        
        if (imagePath) {
            const imageKey = data.image_path ? 'existing_image' : 'existing_icon';
            let hiddenImgInput = formElement.querySelector(`input[name="${imageKey}"]`);
            if (!hiddenImgInput) {
                hiddenImgInput = document.createElement('input');
                hiddenImgInput.type = 'hidden';
                hiddenImgInput.name = imageKey;
                formElement.appendChild(hiddenImgInput);
            }
            hiddenImgInput.value = imagePath;
            
            let previewId = null;
            if (formId === 'horizontal-category-form') {
                previewId = 'horizontal-category-image-preview';
            } else if (formId === 'category-form') {
                previewId = null; 
            } else {
                previewId = formId.replace('-form', '-image-preview');
            }
            
            if (previewId) {
                const previewEl = document.getElementById(previewId);
                if (previewEl) {
                    previewEl.innerHTML = `<img src="${imagePath}" alt="Preview" style="max-width: 200px; max-height: 150px;">`;
                }
            }
        }
        
        // --- REVISI: BARIS INI DIHAPUS ---
        // formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // ---------------------------------
    }
    
    /**
     * Mereset form ke kondisi awal (bersih).
     */
    function resetForm(formElement) {
        if (!formElement || !formElement.getAttribute) return;
        const formId = formElement.getAttribute('id');

        formElement.reset();
        
        formElement.querySelectorAll('input[type="hidden"]').forEach(input => {
             if (input.name !== 'is_featured') input.value = '';
        });

        const fileInput = formElement.querySelector('input[type="file"]');
        if (fileInput) fileInput.required = true;
        
        let previewId = null;
        if (formId === 'horizontal-category-form') previewId = 'horizontal-category-image-preview';
        else if (formId) previewId = formId.replace('-form', '-image-preview');

        if (previewId) {
            const preview = document.getElementById(previewId);
            if (preview) preview.innerHTML = '<p>Pratinjau gambar akan muncul di sini</p>';
        }
    }

    // =======================================================
    // --- 3. NAVIGASI ---
    // =======================================================
    
    function showSection(targetId) {
        sections.forEach(section => section.style.display = 'none');
        const targetSection = document.getElementById(targetId);
        if (targetSection) targetSection.style.display = 'flex';
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            showSection(targetId);
        });
    });

    if (bannerTabs) {
        bannerTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                bannerTabs.forEach(t => t.classList.remove('active'));
                bannerTabContents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.target).classList.add('active');
            });
        });
    }

    // =======================================================
    // --- 4. LOGIKA DASHBOARD (STATISTIK, CHART, EXPORT) ---
    // =======================================================

    async function fetchStatistics(filter = 'today') {
        if (!statTotalSales) return; 
        try {
            const response = await fetch(`${statsApiURL}?filter=${filter}`, { credentials: 'include' });
            const result = await response.json();
            
            if (result.success) {
                const data = result.data;
                statTotalSales.textContent = `Rp ${data.total_sales.toLocaleString('id-ID')}`;
                statTotalOrders.textContent = data.total_orders;
                statNewUsers.textContent = data.total_new_users;
                statTopProduct.textContent = data.top_product || 'N/A';
            } else {
                showApiResponseNotification(result);
            }
        } catch (error) {
            if(typeof UINotification !== 'undefined') UINotification.show('Gagal mengambil data statistik.', 'error');
        }
    }

    async function fetchChartData(filter = 'week') {
        if (!salesChartCanvas) return; 
        try {
            const response = await fetch(`${chartApiURL}?filter=${filter}`, { credentials: 'include' });
            const result = await response.json();
            if (result.success) {
                renderChart(result.data, filter); 
            } else {
                if(typeof UINotification !== 'undefined') UINotification.show('Gagal memuat data grafik.', 'error');
            }
        } catch (error) {
            if(typeof UINotification !== 'undefined') UINotification.show('Gagal terhubung ke API grafik.', 'error');
        }
    }

    function renderChart(apiData, filter) {
        if (!salesChartCanvas || typeof Chart === 'undefined') return;
        const ctx = salesChartCanvas.getContext('2d');
        
        if (salesChartInstance) {
            salesChartInstance.destroy();
        }

        let titleText = 'Grafik Penjualan (Hari Ini)';
        if (filter === 'week') titleText = 'Grafik Penjualan (7 Hari Terakhir)';
        if (filter === 'month') titleText = 'Grafik Penjualan (30 Hari Terakhir)';
        if (filter === 'year') titleText = 'Grafik Penjualan (1 Tahun Terakhir)';
        if (chartTitle) chartTitle.textContent = titleText;

        salesChartInstance = new Chart(ctx, {
            type: 'line', 
            data: {
                labels: apiData.labels, 
                datasets: [{
                    label: 'Penjualan (Rp)',
                    data: apiData.data, 
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    borderColor: '#0066cc',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1 
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'Rp ' + value.toLocaleString('id-ID');
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += 'Rp ' + context.parsed.y.toLocaleString('id-ID');
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    if (statsFilter) {
        statsFilter.addEventListener('change', () => {
            const filterValue = statsFilter.value;
            fetchStatistics(filterValue);
            let chartFilter = (filterValue === 'today') ? 'week' : filterValue;
            fetchChartData(chartFilter);
        });
    }

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', () => {
            const currentFilter = statsFilter.value;
            if(typeof UINotification !== 'undefined') UINotification.show('Mempersiapkan file Excel...', 'info');
            window.location.href = `${exportApiURL}?filter=${currentFilter}`;
        });
    }

    // =======================================================
    // --- 5. MANAJEMEN PRODUK ---
    // =======================================================
    async function fetchProducts() {
        try {
            const response = await fetch(productApiURL, { credentials: 'include' });
            const result = await response.json();
            if (result.success) {
                renderProductTable(result.data);
            }
        } catch (error) { UINotification.show('Error fetching products:', error); }
    }

    function renderProductTable(products) {
        if (!productTableBody) return;
        productTableBody.innerHTML = ''; 
        if (!products || products.length === 0) {
            productTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Belum ada produk.</td></tr>';
            return;
        }
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td><img src="${product.image}" alt="${product.name}" width="50" height="50" style="object-fit: cover;"></td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>Rp ${parseInt(product.price).toLocaleString('id-ID')}</td>
                <td>${product.status}</td>
                <td>
                    <button class="btn-action btn-edit-product" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-delete-product" data-id="${product.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            row.dataset.product = JSON.stringify(product);
            productTableBody.appendChild(row);
        });
    }

    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(productForm);
            try {
                const response = await fetch(productApiURL, { method: 'POST', credentials: 'include', body: formData });
                const result = JSON.parse((await response.text()).trim());
                showApiResponseNotification(result);
                if (result.success) {
                    resetForm(productForm);
                    fetchProducts(); 
                }
            } catch (error) {
                UINotification.show('Gagal terhubung ke server.', 'error');
            }
        });
    }

    if (productTableBody) {
        productTableBody.addEventListener('click', async (e) => {
            const editButton = e.target.closest('.btn-edit-product');
            const deleteButton = e.target.closest('.btn-delete-product');
            if (editButton) {
                const row = editButton.closest('tr');
                const productData = JSON.parse(row.dataset.product);
                populateForm(productForm, productData);
            }
            if (deleteButton) {
                if (confirm(`Hapus produk ini?`)) {
                    try {
                        const response = await fetch(productApiURL, {
                            method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: deleteButton.dataset.id })
                        });
                        const result = await response.json();
                        showApiResponseNotification(result);
                        if (result.success) fetchProducts(); 
                    } catch (error) {
                        UINotification.show('Gagal menghapus produk.', 'error');
                    }
                }
            }
        });
    }

    // =======================================================
    // --- 6. MANAJEMEN KATEGORI (BIASA) ---
    // =======================================================
    
    async function fetchCategories() {
        try {
            const response = await fetch(categoryApiURL, { credentials: 'include' });
            const result = await response.json();
            if (result.success) {
                renderCategoryTable(result.data);
                populateCategoryDropdown(result.data);
            }
        } catch (error) { UINotification.show('Error fetching categories:', error); }
    }

    function renderCategoryTable(categories) {
        if (!categoryTableBody) return;
        categoryTableBody.innerHTML = ''; 
        if (!categories || categories.length === 0) {
            categoryTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada kategori.</td></tr>';
            return;
        }
        categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.id}</td>
                <td><img src="${category.icon_path}" alt="${category.name}" width="30"></td>
                <td>${category.name}</td>
                <td>
                    <button class="btn-action btn-edit-category" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-delete-category" data-id="${category.id}" data-name="${category.name}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            row.dataset.category = JSON.stringify(category);
            categoryTableBody.appendChild(row);
        });
    }

    function populateCategoryDropdown(categories) {
        const categorySelect = document.getElementById('product-category');
        if (!categorySelect) return; 
        categorySelect.innerHTML = '<option value="">-- Pilih Kategori --</option>'; 
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.slug; 
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(categoryForm);
            try {
                const response = await fetch(categoryApiURL, { method: 'POST', credentials: 'include', body: formData });
                const result = await response.json();
                showApiResponseNotification(result);
                if (result.success) {
                    resetForm(categoryForm);
                    fetchCategories(); 
                }
            } catch (error) {
                UINotification.show('Terjadi kesalahan saat menyimpan kategori.', 'error');
            }
        });
        
        if (categoryCancelBtn) {
            categoryCancelBtn.addEventListener('click', () => resetForm(categoryForm));
        }
    }

    if (categoryTableBody) {
        categoryTableBody.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.btn-delete-category');
            const editButton = e.target.closest('.btn-edit-category');
            if (editButton) {
                const row = editButton.closest('tr');
                const data = JSON.parse(row.dataset.category);
                populateForm(categoryForm, data);
            }
            if (deleteButton) {
                if (confirm(`Hapus kategori "${deleteButton.dataset.name}"?`)) {
                    try {
                        const response = await fetch(categoryApiURL, {
                            method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: deleteButton.dataset.id })
                        });
                        const result = await response.json();
                        showApiResponseNotification(result);
                        if (result.success) fetchCategories(); 
                    } catch (error) {
                        UINotification.show('Gagal menghapus kategori.', 'error');
                    }
                }
            }
        });
    }

    // =======================================================
    // --- 7. MANAJEMEN HORIZONTAL CATEGORY (API BARU) ---
    // =======================================================
    
    async function fetchHorizontalCategories() {
        try {
            const response = await fetch(hCategoryApiURL, { credentials: 'include' });
            const result = await response.json();
            if (result.success) {
                renderHorizontalCategoryTable(result.data);
            }
        } catch (error) { UINotification.show('Error fetching horizontal categories:', error); }
    }

    function renderHorizontalCategoryTable(categories) {
        if (!hCategoryTableBody) return;
        hCategoryTableBody.innerHTML = ''; 
        if (!categories || categories.length === 0) {
            hCategoryTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Belum ada kategori horizontal.</td></tr>';
            return;
        }
        categories.forEach(category => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.id}</td>
                <td><img src="${category.icon_path}" alt="${category.name}" width="30"></td>
                <td>${category.name}</td>
                <td>
                    <button class="btn-action btn-edit-h-category" data-id="${category.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-delete-h-category" data-id="${category.id}" data-name="${category.name}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            row.dataset.category = JSON.stringify(category);
            hCategoryTableBody.appendChild(row);
        });
    }

    if (hCategoryForm) {
        hCategoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(hCategoryForm);
            try {
                const response = await fetch(hCategoryApiURL, { method: 'POST', credentials: 'include', body: formData });
                const result = await response.json();
                showApiResponseNotification(result);
                if (result.success) {
                    resetForm(hCategoryForm);
                    fetchHorizontalCategories(); 
                }
            } catch (error) {
                UINotification.show('Terjadi kesalahan saat menyimpan kategori horizontal.', 'error');
            }
        });

        if (hCategoryCancelBtn) {
            hCategoryCancelBtn.addEventListener('click', () => resetForm(hCategoryForm));
        }
    }

    if (hCategoryTableBody) {
        hCategoryTableBody.addEventListener('click', async (e) => {
            const deleteButton = e.target.closest('.btn-delete-h-category');
            const editButton = e.target.closest('.btn-edit-h-category');
            if (editButton) {
                const row = editButton.closest('tr');
                const data = JSON.parse(row.dataset.category);
                populateForm(hCategoryForm, data);
            }
            if (deleteButton) {
                if (confirm(`Hapus kategori horizontal "${deleteButton.dataset.name}"?`)) {
                    try {
                        const response = await fetch(hCategoryApiURL, {
                            method: 'DELETE', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: deleteButton.dataset.id })
                        });
                        const result = await response.json();
                        showApiResponseNotification(result);
                        if (result.success) fetchHorizontalCategories(); 
                    } catch (error) {
                        UINotification.show('Gagal menghapus kategori horizontal.', 'error');
                    }
                }
            }
        });
    }

    // =======================================================
    // --- 8. MANAJEMEN BANNER UTAMA ---
    // =======================================================
    async function fetchMainBanners() {
        try {
            const response = await fetch(mainBannerApiURL, { credentials: 'include' });
            const result = await response.json();
            if (result.success) renderMainBannerTable(result.data);
        } catch (error) { UINotification.show('Error fetchMainBanners', error); }
    }
    
    function renderMainBannerTable(banners) {
        if (!mainBannerTableBody) return;
        mainBannerTableBody.innerHTML = '';
        if (!banners || banners.length === 0) {
            mainBannerTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada banner.</td></tr>'; return;
        }
        banners.forEach(banner => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${banner.id}</td><td><img src="${banner.image_path}" alt="${banner.title}" width="100"></td><td>${banner.title}</td><td>${banner.description}</td><td><button class="btn-action btn-edit-main-banner" data-id="${banner.id}"><i class="fas fa-edit"></i></button><button class="btn-action btn-delete-main-banner" data-id="${banner.id}"><i class="fas fa-trash"></i></button></td>`;
            row.dataset.banner = JSON.stringify(banner);
            mainBannerTableBody.appendChild(row);
        });
    }

    if (mainBannerForm) {
        mainBannerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(mainBannerForm);
            try {
                const response = await fetch(mainBannerApiURL, { method: 'POST', credentials: 'include', body: formData });
                const result = await response.json();
                showApiResponseNotification(result);
                if (result.success) { resetForm(mainBannerForm); fetchMainBanners(); }
            } catch (error) { UINotification.show('Error menyimpan banner.', 'error'); }
        });
    }

    if (mainBannerTableBody) {
        mainBannerTableBody.addEventListener('click', (e) => {
            const edit = e.target.closest('.btn-edit-main-banner');
            const del = e.target.closest('.btn-delete-main-banner');
            if (edit) populateForm(mainBannerForm, JSON.parse(edit.closest('tr').dataset.banner));
            if (del && confirm('Hapus banner?')) {
                fetch(mainBannerApiURL, { method: 'DELETE', credentials: 'include', body: JSON.stringify({ id: del.dataset.id }) })
                    .then(r => r.json()).then(j => { 
                        showApiResponseNotification(j);
                        if (j.success) fetchMainBanners(); 
                    });
            }
        });
    }

    // =======================================================
    // --- 9. MANAJEMEN SHOWCASE BANNER ---
    // =======================================================
    async function fetchShowcaseBanners() {
        try {
            const response = await fetch(showcaseBannerApiURL, { credentials: 'include' });
            const result = await response.json();
            if (result.success) renderShowcaseBannerTable(result.data);
        } catch (error) { UINotification.show('Error fetchShowcaseBanners', error); }
    }

    function renderShowcaseBannerTable(banners) {
        if (!showcaseBannerTableBody) return;
        showcaseBannerTableBody.innerHTML = '';
        if (!banners || banners.length === 0) {
            showcaseBannerTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada showcase banner.</td></tr>'; return;
        }
        banners.forEach(banner => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${banner.id}</td><td><img src="${banner.image_path}" alt="${banner.title}" width="100"></td><td>${banner.title}</td><td>${banner.description}</td><td><button class="btn-action btn-edit-showcase-banner" data-id="${banner.id}"><i class="fas fa-edit"></i></button><button class="btn-action btn-delete-showcase-banner" data-id="${banner.id}"><i class="fas fa-trash"></i></button></td>`;
            row.dataset.banner = JSON.stringify(banner);
            showcaseBannerTableBody.appendChild(row);
        });
    }

    if (showcaseBannerForm) {
        showcaseBannerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(showcaseBannerForm);
            try {
                const response = await fetch(showcaseBannerApiURL, { method: 'POST', credentials: 'include', body: formData });
                const result = await response.json();
                showApiResponseNotification(result);
                if (result.success) { resetForm(showcaseBannerForm); fetchShowcaseBanners(); }
            } catch (error) { UINotification.show('Error menyimpan showcase banner.', 'error'); }
        });
    }

    if (showcaseBannerTableBody) {
        showcaseBannerTableBody.addEventListener('click', (e) => {
            const edit = e.target.closest('.btn-edit-showcase-banner');
            const del = e.target.closest('.btn-delete-showcase-banner');
            if (edit) populateForm(showcaseBannerForm, JSON.parse(edit.closest('tr').dataset.banner));
            if (del && confirm('Hapus showcase banner?')) {
                fetch(showcaseBannerApiURL, { method: 'DELETE', credentials: 'include', body: JSON.stringify({ id: del.dataset.id }) })
                    .then(r => r.json()).then(j => { 
                        showApiResponseNotification(j);
                        if (j.success) fetchShowcaseBanners(); 
                    });
            }
        });
    }

    // =======================================================
    // --- 10. MANAJEMEN VOUCHER ---
    // =======================================================
    async function fetchVouchers() {
        try {
            const response = await fetch(voucherApiURL, { credentials: 'include' });
            const result = await response.json();
            if (result.success && voucherTableBody) {
                voucherTableBody.innerHTML = '';
                result.data.forEach(v => {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${v.id}</td><td>${v.code}</td><td>${v.description}</td><td>${v.is_active ? 'Aktif' : 'Mati'}</td><td><button class="btn-action btn-edit-voucher"><i class="fas fa-edit"></i></button><button class="btn-action btn-delete-voucher" data-id="${v.id}"><i class="fas fa-trash"></i></button></td>`;
                    row.dataset.voucher = JSON.stringify(v);
                    voucherTableBody.appendChild(row);
                });
            }
        } catch (e) { UINotification.show('Error fetchVouchers', e); }
    }

    if (voucherForm) {
        voucherForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(voucherForm);
            const data = {
                id: formData.get('id') || null,
                code: formData.get('code'),
                discount_value: formData.get('discount_value'),
                description: formData.get('description'),
                is_active: formData.get('is_active') ? 1 : 0
            };
            try {
                const response = await fetch(voucherApiURL, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                const result = await response.json();
                showApiResponseNotification(result);
                if (result.success) { voucherForm.reset(); fetchVouchers(); }
            } catch (e) { UINotification.show('Error saving voucher', 'error'); }
        });
    }

    if (voucherTableBody) {
        voucherTableBody.addEventListener('click', (e) => {
            const edit = e.target.closest('.btn-edit-voucher');
            const del = e.target.closest('.btn-delete-voucher');
            if (edit) populateForm(voucherForm, JSON.parse(edit.closest('tr').dataset.voucher));
            if (del && confirm('Hapus voucher?')) {
                fetch(voucherApiURL, { method: 'DELETE', credentials: 'include', body: JSON.stringify({ id: del.dataset.id }) })
                    .then(r => r.json()).then(j => { 
                        showApiResponseNotification(j);
                        if (j.success) fetchVouchers(); 
                    });
            }
        });
    }

    // =======================================================
    // --- 11. MANAJEMEN STATUS ---
    // =======================================================
    async function fetchStatuses() {
        try {
            const res = await fetch(statusApiURL, { credentials: 'include' });
            const json = await res.json();
            if (json.success && statusTableBody) {
                statusTableBody.innerHTML = '';
                json.data.forEach(s => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${s.id}</td><td>${s.name}</td><td>${s.slug}</td><td><button class="btn-action btn-edit-status"><i class="fas fa-edit"></i></button><button class="btn-action btn-delete-status" data-id="${s.id}"><i class="fas fa-trash"></i></button></td>`;
                    tr.dataset.status = JSON.stringify(s);
                    statusTableBody.appendChild(tr);
                });
            }
        } catch (e) { UINotification.show('Error fetchStatuses', e); }
    }

    if (statusForm) {
        statusForm.addEventListener('submit', async(e)=>{ 
            e.preventDefault(); 
            const fd = new FormData(statusForm);
            const d = { id: fd.get('id'), name: fd.get('name'), slug: fd.get('slug') };
            const r = await fetch(statusApiURL, { method: 'POST', credentials: 'include', body: JSON.stringify(d) }); 
            const j = await r.json(); 
            showApiResponseNotification(j);
            if (j.success) { statusForm.reset(); fetchStatuses(); } 
        });
    }

    if (statusTableBody) {
        statusTableBody.addEventListener('click', (e) => {
            const edit = e.target.closest('.btn-edit-status');
            if (edit) populateForm(statusForm, JSON.parse(edit.closest('tr').dataset.status));
        });
    }

    // =======================================================
    // --- 12. SITE SETTINGS & PROMO BANNER ---
    // =======================================================
    async function fetchSettings() {
        try {
            const res = await fetch(settingsApiURL, { credentials: 'include' });
            const json = await res.json();
            if (json.success) {
                if (siteSettingsForm) {
                    for (const k in json.data) {
                        if (siteSettingsForm.elements[k]) siteSettingsForm.elements[k].value = json.data[k];
                    }
                }
                if (promoBannerForm) {
                    for (const k in json.data) {
                        if (promoBannerForm.elements[k] && promoBannerForm.elements[k].type !== 'file') {
                            promoBannerForm.elements[k].value = json.data[k];
                        }
                    }
                    const s = json.data;
                    if (s.promo_banner_1_img) document.getElementById('promo-banner-1-preview').innerHTML = `<img src="${s.promo_banner_1_img}" alt="Preview" style="max-height: 60px;">`;
                    if (s.promo_banner_2_img) document.getElementById('promo-banner-2-preview').innerHTML = `<img src="${s.promo_banner_2_img}" alt="Preview" style="max-height: 60px;">`;
                    if (s.policy_banner_img) document.getElementById('policy-banner-preview').innerHTML = `<img src="${s.policy_banner_img}" alt="Preview" style="max-height: 60px;">`;
                }
            }
        } catch (e) { UINotification.show('Error fetchSettings', e); }
    }

    if (siteSettingsForm) {
        siteSettingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(siteSettingsForm);
            const r = await fetch(settingsApiURL, { method: 'POST', credentials: 'include', body: fd });
            const j = await r.json();
            showApiResponseNotification(j);
        });
    }

    if (promoBannerForm) {
        promoBannerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(promoBannerForm);
            const r = await fetch(settingsApiURL, { method: 'POST', credentials: 'include', body: fd });
            const j = await r.json();
            showApiResponseNotification(j);
            if (j.success) fetchSettings();
        });
    }

    // =======================================================
    // --- INITIAL LOAD ---
    // =======================================================
    fetchStatistics('today'); 
    fetchChartData('week'); 
    
    fetchProducts();
    fetchCategories(); // Kategori Biasa
    fetchHorizontalCategories(); // Kategori Horizontal
    fetchMainBanners();
    fetchShowcaseBanners();
    fetchVouchers();
    fetchStatuses();
    fetchSettings();
});