const HomePage = {
    init() {
        // Cek apakah kita berada di halaman homepage
        if (!document.querySelector('.banner-slider') && !document.querySelector('.banner-showcase-container')) {
            return;
        } 
        
        // Pastikan data produk sudah tersedia dari MAIN.js
        if (!window.UM_MART || !window.UM_MART.products) {
            UINotification.show('Data produk belum siap.');
            return;
        }
        
        this.renderProductSections();
        this.initDynamicComponents();
        this.addEventListeners();
    },

    /**
     * Menginisialisasi komponen dinamis (Kategori, Banner)
     */
    initDynamicComponents() {
        const categories = window.UM_MART.categories; // Kategori Biasa (Atas)
        const featuredCategories = window.UM_MART.featured_categories; // Kategori Horizontal (Bawah)
        const mainBanners = window.UM_MART.main_banners;
        const showcaseBanners = window.UM_MART.showcase_banners;

        // 1. Render Kategori Atas (Category Scroller)
        if (categories && categories.length > 0) {
            this.renderCategoryScroller(categories);
            // Aktifkan Auto Scroll untuk Kategori Atas
            this.setupAutoScroller(".category-wrapper", "scrollLeft", "scrollRight");
        }

        // 2. Render Kategori Bawah (Horizontal Category)
        if (featuredCategories && featuredCategories.length > 0) {
            this.renderHorizontalCategories(featuredCategories);
            // Aktifkan Auto Scroll untuk Kategori Bawah juga
            this.setupAutoScroller(".horizontal-category-wrapper", "hScrollLeft", "hScrollRight");
        }

        // 3. Render Banner
        if (mainBanners) {
            this.initMainBanner(mainBanners);
        }
        if (showcaseBanners) {
            this.initShowcaseBanner(showcaseBanners);
        }
    },

    /**
     * Render Kategori Atas (Standard)
     */
    renderCategoryScroller(categories) {
        const categoryWrapper = document.querySelector(".category-wrapper");
        if (!categoryWrapper) return;
        
        categoryWrapper.innerHTML = categories.map(category => `
            <a href="./filter.html?category=${encodeURIComponent(category.slug)}" class="category-item">
                <img src="${category.icon_path}" alt="${category.name}">
                <p>${category.name}</p>
                <span>${category.item_count} Items</span>
            </a>
        `).join('');
    },

    /**
     * Render Kategori Bawah (Horizontal/Featured)
     */
    renderHorizontalCategories(featuredCategories) {
        const hCategoryWrapper = document.querySelector(".horizontal-category-wrapper");
        if (!hCategoryWrapper) return;
        
        hCategoryWrapper.innerHTML = featuredCategories.map(category => `
            <a href="./filter.html?category=${encodeURIComponent(category.slug)}" class="horizontal-category-item">
                <div class="h-category-content">
                    <img src="${category.icon_path}" alt="${category.name}">
                    <p class="category-text">${category.name}</p>
                </div>
            </a>
        `).join('');
    },

    /**
     * FUNGSI AUTO SCROLLER (YANG DIKEMBALIKAN)
     * Menggerakkan scrollbar secara otomatis kiri-kanan
     */
    setupAutoScroller(containerSelector, leftBtnId, rightBtnId) {
        const wrapper = document.querySelector(containerSelector);
        if (!wrapper) return;

        const scrollLeftBtn = document.getElementById(leftBtnId);
        const scrollRightBtn = document.getElementById(rightBtnId);
        
        // Variabel kontrol autoscroll
        let direction = 1; // 1 = kanan, -1 = kiri
        let speed = 0.5;   // Kecepatan scroll
        let isAutoScrolling = true;
        let animationId;

        // Fungsi animasi utama loop
        const animateScroll = () => {
            if (isAutoScrolling) {
                wrapper.scrollLeft += direction * speed;

                // Jika mentok kanan (dengan toleransi 1px), balik arah ke kiri
                if (direction === 1 && Math.ceil(wrapper.scrollLeft + wrapper.clientWidth) >= wrapper.scrollWidth - 1) {
                    direction = -1;
                } 
                // Jika mentok kiri, balik arah ke kanan
                else if (direction === -1 && wrapper.scrollLeft <= 0) {
                    direction = 1;
                }
            }
            animationId = requestAnimationFrame(animateScroll);
        };

        // Mulai animasi
        animationId = requestAnimationFrame(animateScroll);

        // Event Listeners: Pause saat mouse di atas container
        wrapper.addEventListener("mouseenter", () => { isAutoScrolling = false; });
        wrapper.addEventListener("mouseleave", () => { isAutoScrolling = true; });

        // Event Listeners Tombol Manual
        const handleManualScroll = (amount) => {
            // Matikan auto scroll sementara saat tombol ditekan
            isAutoScrolling = false;
            wrapper.scrollBy({ left: amount, behavior: 'smooth' });
            
            // Nyalakan lagi auto scroll setelah 3 detik
            setTimeout(() => { isAutoScrolling = true; }, 3000);
        };

        if (scrollLeftBtn) scrollLeftBtn.addEventListener("click", () => handleManualScroll(-200));
        if (scrollRightBtn) scrollRightBtn.addEventListener("click", () => handleManualScroll(200));
    },

    /**
     * Render Kartu Produk
     */
    renderProductCard(product) {
        const hasDiscount = product.discount && product.discount !== "0%";
        
        // Logika Cerdas: Cek status dari DB ('out-of-stock') ATAU boolean inStock
        const isOutOfStock = product.status === 'out-of-stock' || product.inStock === false;

        // Tentukan Kelas CSS, Ikon, dan Teks berdasarkan status
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

    /**
     * Render Bagian Produk (Discount & Best Offers)
     */
    renderProductSections() {
        const products = window.UM_MART.products;
        
        // 1. Render Discount Products (Top 8 Sale)
        const topDiscountContainer = document.querySelector('.discount-section .discount-products');
        if (topDiscountContainer) {
            const topDiscountProducts = products.filter(p => p.status === 'sale').slice(0, 8);
            topDiscountContainer.innerHTML = topDiscountProducts.map(product => this.renderProductCard(product)).join('');
        }
        
        // 2. Render Best Offers
        const bestOffersContainer = document.querySelector('.best-offers-section .offers-products');
        const toggleButton = document.getElementById('toggle-offers');
        if (bestOffersContainer && toggleButton) {
            let isExpanded = false;
            const offerProducts = products.slice(8); 
            
            const renderBestOffers = () => {
                const productsToRender = isExpanded ? offerProducts.slice(0, 16) : offerProducts.slice(0, 8);
                bestOffersContainer.innerHTML = productsToRender.map(product => this.renderProductCard(product)).join('');
            };
            
            toggleButton.addEventListener("click", (e) => {
                e.preventDefault();
                isExpanded = !isExpanded;
                toggleButton.textContent = isExpanded ? "See Less" : "See More";
                renderBestOffers();
            });
            
            renderBestOffers();
        }
    },

    /**
     * Inisialisasi Banner Utama (Slider)
     */
    initMainBanner(bannerData) {
        const bannerContainer = document.querySelector('.banner-container');
        if (!bannerContainer || !bannerData || bannerData.length === 0) return;
        
        const bannerSlider = bannerContainer.querySelector('.banner-slider');
        const bannerDotsContainer = bannerContainer.querySelector('.banner-dots');
        
        bannerSlider.innerHTML = '';
        bannerDotsContainer.innerHTML = '';

        bannerData.forEach((slide, index) => {
            bannerSlider.innerHTML += `
                <div class="banner-slide">
                    <img src="${slide.image_path}" alt="${slide.title}">
                    <div class="banner-content">
                        <h2>${slide.title}</h2>
                        <p>${slide.description}</p>
                        <a href="${slide.link_url}" class="shop-now-btn">SHOP NOW</a>
                    </div>
                </div>
            `;
            bannerDotsContainer.innerHTML += `<div class="banner-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></div>`;
        });

        const prevBtn = bannerContainer.querySelector('.banner-prev');
        const nextBtn = bannerContainer.querySelector('.banner-next');
        const dots = bannerContainer.querySelectorAll('.banner-dot');
        let currentSlide = 0;
        const slideCount = bannerData.length;

        const updateBanner = () => {
            if (bannerSlider) {
                bannerSlider.style.transform = `translateX(-${currentSlide * 100}%)`;
                dots.forEach((dot, index) => dot.classList.toggle('active', index === currentSlide));
            }
        };
        const nextBannerSlide = () => {
            currentSlide = (currentSlide + 1) % slideCount;
            updateBanner();
        };
        
        let slideInterval = setInterval(nextBannerSlide, 5000);
        
        if(nextBtn) nextBtn.addEventListener('click', () => { clearInterval(slideInterval); nextBannerSlide(); slideInterval = setInterval(nextBannerSlide, 5000); });
        if(prevBtn) prevBtn.addEventListener('click', () => { clearInterval(slideInterval); currentSlide = (currentSlide - 1 + slideCount) % slideCount; updateBanner(); slideInterval = setInterval(nextBannerSlide, 5000); });
        
        dots.forEach((dot) => {
            dot.addEventListener('click', () => {
                clearInterval(slideInterval);
                currentSlide = parseInt(dot.dataset.index);
                updateBanner();
                slideInterval = setInterval(nextBannerSlide, 5000);
            });
        });
        
        bannerContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
        bannerContainer.addEventListener('mouseleave', () => slideInterval = setInterval(nextBannerSlide, 5000));
        
        updateBanner(0);
    },

    /**
     * Inisialisasi Showcase Banner (Galeri)
     */
    initShowcaseBanner(slidesData) {
        const showcaseContainer = document.querySelector(".banner-showcase-container");
        if (!showcaseContainer || !slidesData || slidesData.length === 0) {
            if(showcaseContainer && showcaseContainer.parentElement) showcaseContainer.parentElement.style.display = 'none';
            return;
        }

        const mainImage = document.getElementById("showcase-main-image");
        const titleEl = document.getElementById("showcase-title");
        const descEl = document.getElementById("showcase-description");
        const linkEl = document.getElementById("learn-more-link");
        const prevBtn = document.getElementById("showcase-prev");
        const nextBtn = document.getElementById("showcase-next");
        const thumbnailsWrapper = document.getElementById("thumbnails-wrapper");
        const thumbPrevBtn = document.getElementById("thumb-prev");
        const thumbNextBtn = document.getElementById("thumb-next");

        let currentIndex = 0;

        const updateShowcase = (index, scrollThumb = true) => {
            currentIndex = (index + slidesData.length) % slidesData.length;
            const data = slidesData[currentIndex];
            
            if (mainImage) mainImage.src = data.image_path;
            if (titleEl) titleEl.textContent = data.title;
            if (descEl) descEl.textContent = data.description;
            if (linkEl) linkEl.href = data.link_url;

            if (thumbnailsWrapper) {
                document.querySelectorAll(".showcase-thumbnail-item").forEach((item, i) => {
                    item.classList.toggle("active", i === currentIndex);
                });
                const activeThumb = thumbnailsWrapper.querySelector(`[data-index="${currentIndex}"]`);
                if (activeThumb && scrollThumb) {
                    activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }
        };

        if (thumbnailsWrapper) {
            thumbnailsWrapper.innerHTML = slidesData.map((slide, index) => `
                <div class="showcase-thumbnail-item" data-index="${index}"><img src="${slide.image_path}" alt="${slide.title}"></div>
            `).join('');

            thumbnailsWrapper.addEventListener('click', (e) => {
                const thumb = e.target.closest('.showcase-thumbnail-item');
                if (thumb) {
                    updateShowcase(parseInt(thumb.dataset.index));
                }
            });
            
            if (thumbPrevBtn) thumbPrevBtn.addEventListener("click", () => { thumbnailsWrapper.scrollBy({ left: -300, behavior: 'smooth' }); });
            if (thumbNextBtn) thumbNextBtn.addEventListener("click", () => { thumbnailsWrapper.scrollBy({ left: 300, behavior: 'smooth' }); });
        }

        if (prevBtn) prevBtn.addEventListener("click", () => updateShowcase(currentIndex - 1));
        if (nextBtn) nextBtn.addEventListener("click", () => updateShowcase(currentIndex + 1));
        
        let showcaseInterval = setInterval(() => updateShowcase(currentIndex + 1, false), 5000);
        showcaseContainer.addEventListener("mouseenter", () => clearInterval(showcaseInterval));
        showcaseContainer.addEventListener("mouseleave", () => showcaseInterval = setInterval(() => updateShowcase(currentIndex + 1, false), 5000));
        
        updateShowcase(0, false);
    },

    /**
     * Event Listeners (Add to Cart, Quantity)
     */
    addEventListeners() {
        document.body.addEventListener('click', e => {
            const productCard = e.target.closest('.product-card');
            if (!productCard) return;
            
            // Cek apakah tombol disabled (Habis)
            if (e.target.closest('.add-to-cart-btn[disabled]')) {
                e.preventDefault();
                return;
            }

            const quantityInput = productCard.querySelector('.quantity-selector input');
            if (!quantityInput) return;
            let qty = parseInt(quantityInput.value);

            if (e.target.matches('.plus-btn:not([disabled])')) {
                quantityInput.value = qty + 1;
            } else if (e.target.matches('.minus-btn:not([disabled])') && qty > 1) {
                quantityInput.value = qty - 1;
            } else if (e.target.closest('.add-to-cart-btn')) {
                const productId = parseInt(productCard.dataset.productId);
                if (typeof addToCart === 'function') {
                    addToCart(productId, parseInt(quantityInput.value));
                } else {
                    UINotification.show('Fungsi global addToCart tidak ditemukan. Pastikan CART.js dimuat.');
                }
            }
        });
    }
};