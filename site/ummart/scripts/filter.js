const ShopPage = {
    currentView: 'grid',
    currentPage: 1,
    productsPerPage: 9,
    currentFilteredProducts: [],

    rangeMin: null, rangeMax: null, priceMinInput: null, priceMaxInput: null,
    progress: null, productGrid: null, productListView: null, miniProductList: null,
    gridViewBtn: null, listViewBtn: null, paginationContainer: null,
    resultCountStart: null, resultCountEnd: null, resultCountTotal: null,
    headerSearchInput: null,
    categoryListContainer: null,
    statusListContainer: null,

    init() {
        if (!document.querySelector('.main-shop-content')) {
            return;
        }
        
        // Cek data
        if (!window.UM_MART || !window.UM_MART.products || !window.UM_MART.categories || !window.UM_MART.product_statuses) {
            UINotification.show('Data master belum siap. ShopPage.init() dibatalkan.');
            document.getElementById('product-grid').innerHTML = '<p>Gagal memuat data halaman.</p>';
            return;
        }

        // 1. Ambil elemen DOM
        this.rangeMin = document.getElementById('range-min');
        this.rangeMax = document.getElementById('range-max');
        this.priceMinInput = document.getElementById('price-min');
        this.priceMaxInput = document.getElementById('price-max');
        this.progress = document.querySelector('.slider .progress');
        this.productGrid = document.getElementById('product-grid');
        this.productListView = document.getElementById('product-list-view');
        this.miniProductList = document.getElementById('mini-product-list');
        this.gridViewBtn = document.getElementById('grid-view');
        this.listViewBtn = document.getElementById('list-view');
        this.paginationContainer = document.querySelector('.pagination');
        this.resultCountStart = document.getElementById('showing-start');
        this.resultCountEnd = document.getElementById('showing-end');
        this.resultCountTotal = document.getElementById('product-count');
        this.headerSearchInput = document.querySelector('.main-header .search-bar input[type="text"]');
        this.categoryListContainer = document.getElementById('category-filter-list');
        this.statusListContainer = document.getElementById('status-filter-list');

        // 2. Render Filter
        this.renderCategoryFilters();
        this.renderStatusFilters();
        
        // 3. Event Listener
        this.addEventListeners();

        // 4. URL Param
        this.applyFiltersFromURL();
        
        // 5. Render Awal
        this.applyFiltersAndSort();
        this.updatePriceSliderVisuals();
    },
    
    renderCategoryFilters() {
        if (!this.categoryListContainer) return;
        const categories = window.UM_MART.categories;
        this.categoryListContainer.innerHTML = '';
        if (categories && categories.length > 0) {
            categories.forEach(category => {
                this.categoryListContainer.innerHTML += `
                    <label class="filter-checkbox">
                        <input type="checkbox" name="category" value="${category.slug}"> 
                        ${category.name}
                    </label>
                `;
            });
        }
    },
    
    renderStatusFilters() {
        if (!this.statusListContainer) return;
        const statuses = window.UM_MART.product_statuses;
        this.statusListContainer.innerHTML = ''; 
        if (statuses && statuses.length > 0) {
            statuses.forEach(status => {
                this.statusListContainer.innerHTML += `
                    <label class="filter-checkbox">
                        <input type="checkbox" name="status" value="${status.slug}"> 
                        ${status.name}
                    </label>
                `;
            });
        }
    },

    // --- REVISI TAMPILAN KARTU PRODUK (GRID) ---
    renderProductCard(product) {
        const hasDiscount = product.discount && product.discount !== "0%";
        
        // Logika Stok
        const isOutOfStock = product.status === 'out-of-stock' || product.inStock === false;
        
        const dotClass = isOutOfStock ? 'unavailable-dot' : 'available-dot';
        const statusClass = isOutOfStock ? 'out-of-stock' : 'in-stock';
        const statusIcon = isOutOfStock ? 'fa-times-circle' : 'fa-check-circle';
        const statusText = isOutOfStock ? 'Out of Stock' : 'In Stock';
        
        const buttonDisabled = isOutOfStock ? 'disabled' : '';
        const buttonText = isOutOfStock ? 'Habis' : 'Add To Cart';
        const cardClass = isOutOfStock ? 'product-card is-out-of-stock' : 'product-card';

        return `
            <div class="${cardClass}" data-product-id="${product.id}">
                <div class="product-image">
                    ${hasDiscount ? `<span class="discount-badge">${product.discount}</span>` : ''}
                    <span class="${dotClass}"></span>
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    
                    <span class="stock-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i> ${statusText} - ${product.unit}
                    </span>

                    <div class="product-price-new">Rp ${product.price.toLocaleString('id-ID')}</div>
                    
                    <div class="quantity-selector">
                        <button class="minus-btn" ${buttonDisabled}>-</button>
                        <input type="text" value="1" readonly>
                        <button class="plus-btn" ${buttonDisabled}>+</button>
                    </div>
                    <button class="add-to-cart-btn" ${buttonDisabled}>
                        <i class="fa-solid fa-cart-shopping"></i> ${buttonText}
                    </button>
                </div>
            </div>`;
    },

    // --- REVISI TAMPILAN LIST PRODUK (LIST) ---
    renderProductList(product) {
        // Logika Stok
        const isOutOfStock = product.status === 'out-of-stock' || product.inStock === false;
        
        const statusClass = isOutOfStock ? 'out-of-stock' : 'in-stock';
        const statusIcon = isOutOfStock ? 'fa-times-circle' : 'fa-check-circle';
        const statusText = isOutOfStock ? 'Out of Stock' : 'In Stock';
        const buttonDisabled = isOutOfStock ? 'disabled' : '';
        const buttonText = isOutOfStock ? 'Habis' : 'Add To Cart';
        const cardClass = isOutOfStock ? 'list-view-item is-out-of-stock' : 'list-view-item';

        return `
            <div class="${cardClass}" data-product-id="${product.id}">
                <div class="product-image-wrapper"><img src="${product.image}" alt="${product.name}" class="product-image"></div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    
                    <span class="stock-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i> ${statusText} - ${product.unit}
                    </span>

                    <div class="product-price"><span class="current-price">Rp ${product.price.toLocaleString('id-ID')}</span></div>
                    <button class="add-to-cart-btn" ${buttonDisabled}>
                        <i class="fa-solid fa-cart-shopping"></i> ${buttonText}
                    </button>
                </div>
            </div>`;
    },

    renderPage() {
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const paginatedProducts = this.currentFilteredProducts.slice(startIndex, endIndex);
        
        let mainContent = '';
        if (this.currentView === 'grid') {
            paginatedProducts.forEach(p => mainContent += this.renderProductCard(p));
            this.productGrid.innerHTML = mainContent || '<p>Tidak ada produk yang cocok.</p>';
            this.productGrid.style.display = 'grid';
            this.productListView.style.display = 'none';
        } else {
            paginatedProducts.forEach(p => mainContent += this.renderProductList(p));
            this.productListView.innerHTML = mainContent || '<p>Tidak ada produk yang cocok.</p>';
            this.productGrid.style.display = 'none';
            this.productListView.style.display = 'flex';
        }
        
        this.miniProductList.innerHTML = this.currentFilteredProducts.slice(0, 5).map(product => `
            <a href="#" class="mini-product-card">
                <img src="${product.image}" alt="${product.name}">
                <div class="mini-product-info">
                    <div class="mini-product-name">${product.name}</div>
                    <div class="mini-product-price">Rp ${product.price.toLocaleString('id-ID')}</div>
                </div>
            </a>`).join('');

        this.updatePagination();
        this.updateResultCount();
    },

    applyFiltersAndSort() {
        if (!this.priceMinInput) return;

        const urlParams = new URLSearchParams(window.location.search);
        const searchTermFromURL = urlParams.get('search') ? urlParams.get('search').toLowerCase() : '';
        const searchTermFromInput = this.headerSearchInput ? this.headerSearchInput.value.toLowerCase() : '';
        const searchTerm = searchTermFromInput || searchTermFromURL;

        const minPrice = parseFloat(this.priceMinInput.value) || 0;
        const maxPrice = parseFloat(this.priceMaxInput.value) || 100000;
        
        const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(cb => cb.value);
        
        // Filter Status: Ini yang sebelumnya "kacau". Sekarang akan mencocokkan 'slug' dari database (in-stock, out-of-stock)
        const selectedStatuses = Array.from(document.querySelectorAll('input[name="status"]:checked')).map(cb => cb.value);
        
        const sortBy = document.getElementById('sort-by').value;

        let filtered = window.UM_MART.products.filter(p => 
            p.price >= minPrice && p.price <= maxPrice &&
            (selectedCategories.length === 0 || selectedCategories.includes(p.category)) &&
            (selectedStatuses.length === 0 || selectedStatuses.includes(p.status)) &&
            (searchTerm === '' || p.name.toLowerCase().includes(searchTerm))
        );

        if (sortBy === 'price-low-to-high') filtered.sort((a, b) => a.price - b.price);
        else if (sortBy === 'price-high-to-low') filtered.sort((a, b) => b.price - a.price);
        
        this.currentFilteredProducts = filtered;
        this.currentPage = 1; 
        this.renderPage();
    },

    updatePagination() {
        const totalProducts = this.currentFilteredProducts.length;
        const totalPages = Math.ceil(totalProducts / this.productsPerPage);
        this.paginationContainer.innerHTML = ''; 
        if (totalPages <= 1) return; 
        if (this.currentPage > 1) {
            this.paginationContainer.innerHTML += `<button class="page-btn" data-page="${this.currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;
        }
        for (let i = 1; i <= totalPages; i++) {
            this.paginationContainer.innerHTML += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        if (this.currentPage < totalPages) {
            this.paginationContainer.innerHTML += `<button class="page-btn" data-page="${this.currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;
        }
    },

    updateResultCount() {
        const totalProducts = this.currentFilteredProducts.length;
        const start = totalProducts === 0 ? 0 : (this.currentPage - 1) * this.productsPerPage + 1;
        const end = Math.min(this.currentPage * this.productsPerPage, totalProducts);
        if (this.resultCountStart) this.resultCountStart.textContent = start;
        if (this.resultCountEnd) this.resultCountEnd.textContent = end;
        if (this.resultCountTotal) this.resultCountTotal.textContent = totalProducts;
    },

    applyFiltersFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        const categoriesFromURL = urlParams.get('category');
        if (categoriesFromURL) {
            const categories = categoriesFromURL.split(',');
            document.querySelectorAll('input[name="category"]').forEach(cb => {
                if (categories.includes(cb.value)) {
                    cb.checked = true;
                }
            });
        }
        const searchTermFromURL = urlParams.get('search');
        if (searchTermFromURL && this.headerSearchInput) {
            this.headerSearchInput.value = decodeURIComponent(searchTermFromURL);
        }
    },

    updatePriceSliderVisuals() {
        if(this.progress) {
            this.progress.style.left = `${(this.priceMinInput.value / this.rangeMin.max) * 100}%`;
            this.progress.style.right = `${100 - (this.priceMaxInput.value / this.rangeMax.max) * 100}%`;
        }
    },

    addEventListeners() {
        if(this.rangeMin) this.rangeMin.addEventListener('change', () => { this.priceMinInput.value = this.rangeMin.value; this.updatePriceSliderVisuals(); this.applyFiltersAndSort(); });
        if(this.rangeMax) this.rangeMax.addEventListener('change', () => { this.priceMaxInput.value = this.rangeMax.value; this.updatePriceSliderVisuals(); this.applyFiltersAndSort(); });
        if(this.priceMinInput) this.priceMinInput.addEventListener('change', () => { this.rangeMin.value = this.priceMinInput.value; this.updatePriceSliderVisuals(); this.applyFiltersAndSort(); });
        if(this.priceMaxInput) this.priceMaxInput.addEventListener('change', () => { this.rangeMax.value = this.priceMaxInput.value; this.updatePriceSliderVisuals(); this.applyFiltersAndSort(); });
        if(this.rangeMin) this.rangeMin.addEventListener('input', () => { this.priceMinInput.value = this.rangeMin.value; this.updatePriceSliderVisuals(); });
        if(this.rangeMax) this.rangeMax.addEventListener('input', () => { this.priceMaxInput.value = this.rangeMax.value; this.updatePriceSliderVisuals(); });

        document.querySelectorAll('input[type="checkbox"], #sort-by').forEach(el => {
            el.addEventListener('change', () => this.applyFiltersAndSort());
        });

        this.gridViewBtn.addEventListener('click', () => {
            this.currentView = 'grid';
            this.gridViewBtn.classList.add('active');
            this.listViewBtn.classList.remove('active');
            this.renderPage();
        });
        this.listViewBtn.addEventListener('click', () => {
            this.currentView = 'list';
            this.listViewBtn.classList.add('active');
            this.gridViewBtn.classList.remove('active');
            this.renderPage();
        });

        this.paginationContainer.addEventListener('click', e => {
            const pageButton = e.target.closest('.page-btn');
            if (pageButton) {
                e.preventDefault();
                this.currentPage = parseInt(pageButton.dataset.page);
                this.renderPage();
                window.scrollTo(0, 0);
            }
        });

        // Event Delegation untuk Add to Cart & Quantity
        document.querySelector('.main-shop-content').addEventListener('click', e => {
            const productEl = e.target.closest('.product-card, .list-view-item');
            if (!productEl) return;
            const productId = parseInt(productEl.dataset.productId);

            // Cek apakah tombol disabled
            if (e.target.closest('.add-to-cart-btn[disabled]')) {
                e.preventDefault();
                return; // Jangan lakukan apa-apa
            }

            if (e.target.closest('.add-to-cart-btn')) {
                const qtyInput = productEl.querySelector('.quantity-selector input');
                const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
                if (typeof addToCart === 'function') {
                    addToCart(productId, quantity);
                } else {
                    UINotification.show('Fungsi addToCart() tidak ditemukan.');
                }
            }
            if (e.target.matches('.minus-btn:not([disabled]), .plus-btn:not([disabled])')) {
                const qtyInput = productEl.querySelector('.quantity-selector input');
                if (!qtyInput) return;
                let qty = parseInt(qtyInput.value);
                if (e.target.matches('.plus-btn')) {
                    qtyInput.value = qty + 1;
                } else if (e.target.matches('.minus-btn') && qty > 1) {
                    qtyInput.value = qty - 1;
                }
            }
        });
    }
};