async function loadMasterData() {
    try {
        console.log("Mengambil data master dari server...");

        const response = await fetch('../api/public/get_homepage_data.php', {
            method: 'GET', 
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        

        if (!response.ok) {
            throw new Error(`Koneksi ke API gagal: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        const data = result.data || {}; 

        if (result.success) {
            console.log("Data master berhasil dimuat.");

            
            window.UM_MART.products = data.products || [];
            
            window.UM_MART.categories = data.categories || []; 
            
            window.UM_MART.featured_categories = data.featured_categories || []; 
            
            window.UM_MART.main_banners = data.main_banners || [];
            window.UM_MART.showcase_banners = data.showcase_banners || [];
            window.UM_MART.product_statuses = data.product_statuses || [];
            window.UM_MART.active_vouchers = data.active_vouchers || []; 
            window.UM_MART.site_settings = data.site_settings || {};
            
            return true; 
        } else {
            console.warn(result.message || 'Gagal memuat data master dari API.');
            throw new Error(result.message || 'Gagal memuat data master.');
        }

    } catch (error) {
        console.error("Error fatal saat memuat data master:", error);
        
        window.UM_MART.products = [];
        window.UM_MART.categories = [];
        window.UM_MART.featured_categories = [];
        window.UM_MART.main_banners = [];
        window.UM_MART.showcase_banners = [];
        window.UM_MART.product_statuses = [];
        window.UM_MART.active_vouchers = [];
        window.UM_MART.site_settings = {};
        
        return false; 
    }
}


function renderGlobalComponents() {
    if (!window.UM_MART) return;

    const settings = window.UM_MART.site_settings;
    const vouchers = window.UM_MART.active_vouchers; 

    const promoElement = document.querySelector('.top-bar .promo');
    if (promoElement) {
        if (vouchers && vouchers.length > 0) {
            const firstVoucher = vouchers[0];
            promoElement.innerHTML = `${firstVoucher.description} | Kode : <b>${firstVoucher.code}</b>`;
        } else if (settings && settings.promo_text) {
            promoElement.innerHTML = settings.promo_text;
        } else {
            promoElement.innerHTML = "Selamat Datang di UM Mart!";
        }
    }

    const promo1Img = document.getElementById('promo-banner-1-img');
    const promo1Link = document.getElementById('promo-banner-1-link');
    if(promo1Img && settings.promo_banner_1_img) {
        promo1Img.src = settings.promo_banner_1_img;
        if(promo1Link) promo1Link.href = settings.promo_banner_1_link || '#';
    }
    
    const promo2Img = document.getElementById('promo-banner-2-img');
    const promo2Link = document.getElementById('promo-banner-2-link');
    if(promo2Img && settings.promo_banner_2_img) {
        promo2Img.src = settings.promo_banner_2_img;
        if(promo2Link) promo2Link.href = settings.promo_banner_2_link || '#';
    }
    
    const policyImg = document.getElementById('policy-banner-img');
    const policyLink = document.getElementById('policy-banner-link');
    if(policyImg && settings.policy_banner_img) {
        policyImg.src = settings.policy_banner_img;
        if(policyLink) policyLink.href = settings.policy_banner_link || '#';
    }

    const contactAddress = document.getElementById('contact-address');
    if (contactAddress && settings.contact_address) {
        contactAddress.innerHTML = settings.contact_address.replace(/\n/g, '<br>');
    }

    const contactPhone = document.getElementById('contact-phone');
    if (contactPhone && settings.contact_phone) {
        contactPhone.textContent = settings.contact_phone;
    }

    const contactEmail = document.getElementById('contact-email');
    if (contactEmail && settings.contact_email) {
        contactEmail.textContent = settings.contact_email;
    }
}


document.addEventListener('DOMContentLoaded', async () => {

    window.UM_MART = {
        products: [],
        categories: [],
        featured_categories: [], 
        main_banners: [],
        showcase_banners: [],
        product_statuses: [],
        active_vouchers: [], 
        site_settings: {}
    };

    if (typeof Auth !== 'undefined') window.UM_MART.Auth = Auth;
    if (typeof Cart !== 'undefined') window.UM_MART.Cart = Cart;
    if (typeof HomePage !== 'undefined') window.UM_MART.HomePage = HomePage;
    if (typeof ShopPage !== 'undefined') window.UM_MART.ShopPage = ShopPage;
    if (typeof CheckoutDetailPage !== 'undefined') window.UM_MART.CheckoutDetailPage = CheckoutDetailPage;

    if (window.UM_MART.Auth) window.UM_MART.Auth.init();
    if (window.UM_MART.Cart) window.UM_MART.Cart.init();

    try {
        const dataLoaded = await loadMasterData();

        renderGlobalComponents();

        if (dataLoaded) {
            if (document.querySelector('.best-offers-section') && window.UM_MART.HomePage) {
                window.UM_MART.HomePage.init();
            }
            if (document.querySelector('.main-shop-content') && window.UM_MART.ShopPage) {
                window.UM_MART.ShopPage.init();
            }
            if (document.querySelector('.checkout-layout') && window.UM_MART.CheckoutDetailPage) {
                window.UM_MART.CheckoutDetailPage.init();
            }
        } else {
            throw new Error("Data master gagal dimuat.");
        }

    } catch (error) {
        console.error("Gagal menginisialisasi halaman:", error);
        const productsArea = document.querySelector('.discount-products');
        if(productsArea) {
            productsArea.innerHTML = '<p style="color:red; text-align:center; width:100%;">Gagal terhubung ke server. Harap muat ulang halaman.</p>';
        }
    }
});