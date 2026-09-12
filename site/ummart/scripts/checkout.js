// File: checkout.js
// REVISI: Memanggil processCheckout() SEKARANG, sebelum ke halaman QRIS

const CheckoutDetailPage = {
    SHIPPING_COST: 5000,
    
    init() {
        // Cek apakah kita di halaman yang benar
        if (!document.getElementById('cart-summary-list')) {
            return;
        }
        this.updateProgressBar();
        this.renderCheckoutSummary();
        this.setupPaymentMethodToggle();
        this.setupFormSubmission(); // Ini adalah fungsi yang kita revisi
    },

    updateProgressBar() {
        const shoppingCartStep = document.getElementById('shopping-cart-step');
        const checkoutDetailsStep = document.getElementById('checkout-details-step');
        const line1 = document.getElementById('line-1');
        const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

        // Periksa null sebelum mengakses classList
        if(shoppingCartStep && checkoutDetailsStep && line1) { 
            if (cartItems.length > 0) {
                shoppingCartStep.classList.add('active');
                checkoutDetailsStep.classList.add('active');
                line1.classList.add('active');
            } else {
                shoppingCartStep.classList.remove('active');
                checkoutDetailsStep.classList.remove('active');
                line1.classList.remove('active');
            }
        }
    },

    renderCheckoutSummary() {
        const cartList = document.getElementById('cart-summary-list');
        const subtotalPriceElement = document.getElementById('subtotal-price-summary');
        const totalElement = document.getElementById('total-price-summary');
        const appliedDiscountRow = document.querySelector('.applied-discount');
        const applyBtn = document.getElementById('apply-discount');
        const removeBtn = document.getElementById('remove-discount');
        const discountInput = document.getElementById('discount-input');
        
        const discountCodeNameEl = appliedDiscountRow ? appliedDiscountRow.querySelector('.discount-code-name') : null;
        const discountPriceEl = appliedDiscountRow ? appliedDiscountRow.querySelector('.discount-price') : null;
        
        let subtotal = 0;
        const currentCart = JSON.parse(localStorage.getItem('cartItems')) || [];
        
        if(cartList) cartList.innerHTML = '';

        if (currentCart.length === 0) {
            if(cartList) cartList.innerHTML = '<p class="empty-cart-message">Keranjang Anda kosong</p>'; 
        } else {
            currentCart.forEach(product => {
                if(cartList) cartList.innerHTML += `<div class="product-item"><img src="${product.image}" alt="${product.name}"><div class="item-info"><h4>${product.name}</h4><p>${product.quantity} x Rp ${product.price.toLocaleString('id-ID')}</p></div></div>`;
                subtotal += product.price * product.quantity;
            });
        }
        
        let subtotalWithShipping = subtotal + this.SHIPPING_COST;
        if(subtotalPriceElement) subtotalPriceElement.textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
        
        const updateTotals = (isDiscountApplied, appliedCode = null, discountAmount = 0) => {
            let finalTotal = subtotalWithShipping;
            if (isDiscountApplied) {
                finalTotal = subtotalWithShipping - discountAmount; 
                if(appliedDiscountRow) appliedDiscountRow.classList.remove('hidden');
                if (discountCodeNameEl) discountCodeNameEl.textContent = `(${appliedCode})`;
                if (discountPriceEl) discountPriceEl.textContent = `-Rp ${discountAmount.toLocaleString('id-ID')}`;
            } else {
                if(appliedDiscountRow) appliedDiscountRow.classList.add('hidden');
            }
            if(totalElement) totalElement.textContent = `Rp ${finalTotal.toLocaleString('id-ID')}`;
            localStorage.setItem('finalPaymentAmount', finalTotal);
        };
        
        if(applyBtn) applyBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const inputCode = discountInput.value.toUpperCase().trim();
            if (!inputCode) return;
            const activeVouchers = window.UM_MART.active_vouchers || [];
            const foundVoucher = activeVouchers.find(v => v.code.toUpperCase() === inputCode);
            if (foundVoucher) {
                updateTotals(true, foundVoucher.code, foundVoucher.discount_value);
                if(typeof UINotification !== 'undefined') UINotification.show('Kode diskon diterapkan!', 'success');
            } else {
                if(typeof UINotification !== 'undefined') UINotification.show('Kode diskon tidak valid.', 'error');
            }
        });
        
        if(removeBtn) removeBtn.addEventListener('click', (e) => { 
            e.preventDefault(); 
            updateTotals(false, null, 0); 
            if(discountInput) discountInput.value = ''; 
            if(typeof UINotification !== 'undefined') UINotification.show('Diskon dihapus.', 'info'); 
        });
        
        updateTotals(false, null, 0);
    },

    setupPaymentMethodToggle() {
        const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
        const cardFields = document.getElementById('card-fields');
        const phoneField = document.getElementById('phone-field');
        
        paymentRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'card') {
                    if(cardFields) cardFields.classList.remove('hidden');
                    if(phoneField) phoneField.classList.add('hidden');
                } else {
                    if(cardFields) cardFields.classList.add('hidden');
                    if(phoneField) phoneField.classList.remove('hidden');
                }
            });
        });
    },

    /**
     * REVISI UTAMA: FUNGSI INI SEKARANG MEMPROSES PESANAN
     */
    setupFormSubmission() {
        const orderNowBtn = document.getElementById('order-now-btn');
        if (!orderNowBtn) return;

        orderNowBtn.addEventListener('click', async (e) => { // <-- Ubah jadi async
            e.preventDefault();

            // 1. Validasi (Sama seperti sebelumnya)
            const loggedInUser = localStorage.getItem('loggedInUser');
            if (!loggedInUser) {
                UINotification.show('Anda harus login untuk melanjutkan checkout.', 'error');
                setTimeout(() => { window.location.href = './login.html'; }, 2000);
                return; 
            }
            
            const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
            if (cartItems.length === 0) {
                UINotification.show('Keranjang Anda kosong.', 'warning');
                return;
            }
            
            const requiredInputs = document.querySelectorAll('#contact-info-form input[required], #shipping-address-form input[required]');
            let isValid = true;
            requiredInputs.forEach(input => {
                if (input.value.trim() === '') {
                    isValid = false;
                    input.style.borderColor = 'red';
                } else {
                    input.style.borderColor = '#ddd';
                }
            });
            if (!isValid) {
                UINotification.show('Harap isi semua kolom yang wajib diisi (*).', 'error');
                return;
            }
            
            const selectedPaymentMethodInput = document.querySelector('input[name="payment-method"]:checked');
            if (!selectedPaymentMethodInput) {
                UINotification.show('Silakan pilih metode pembayaran.', 'warning');
                return;
            }
            const selectedPaymentMethod = selectedPaymentMethodInput.value;
            localStorage.setItem('paymentMethod', selectedPaymentMethod);

            // Tampilkan loading
            orderNowBtn.disabled = true;
            orderNowBtn.textContent = 'Membuat Pesanan...';
            UINotification.show('Membuat pesanan Anda...', 'info');

            // 2. Panggil processCheckout() (file PHP) SEKARANG
            try {
                const totalAmount = parseFloat(localStorage.getItem('finalPaymentAmount'));
                
                const response = await fetch('../api/public/process_checkout.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cartItems: cartItems,
                        paymentMethod: selectedPaymentMethod,
                        totalAmount: totalAmount
                    })
                });

                const result = await response.json();

                if (result.success) {
                    // 3. SUKSES MEMBUAT PESANAN 'PENDING'
                    
                    // Simpan detail pesanan PENTING ini untuk halaman QR
                    localStorage.setItem('lastOrder', JSON.stringify(result.orderDetails));
                    
                    // Kosongkan keranjang SEKARANG
                    localStorage.removeItem('cartItems'); 
                    if(typeof Cart !== 'undefined') Cart.updateCartUI(); // Update UI keranjang
                    
                    // Tentukan halaman pembayaran
                    let paymentPageUrl = '';
                    switch (selectedPaymentMethod) {
                        case 'gopay': paymentPageUrl = './payment-gopay.html'; break;
                        case 'ovo': paymentPageUrl = './payment-ovo.html'; break;
                        case 'dana': paymentPageUrl = './payment-dana.html'; break;
                        case 'card': paymentPageUrl = './payment-card.html'; break;
                        // Tambahkan case 'qris' jika Anda membuatnya
                        default: 
                            UINotification.show('Metode pembayaran tidak valid.', 'error'); 
                            orderNowBtn.disabled = false;
                            orderNowBtn.textContent = 'Order Now';
                            return;
                    }
                    // Arahkan ke halaman pembayaran
                    window.location.href = paymentPageUrl;

                } else {
                    // 4. Gagal membuat pesanan
                    throw new Error(result.message);
                }
            } catch (error) {
                UINotification.show('Gagal membuat pesanan: ' + error.message, 'error');
                orderNowBtn.disabled = false;
                orderNowBtn.textContent = 'Order Now';
            }
        });
    }
};

// Panggil init
document.addEventListener('DOMContentLoaded', () => {
    CheckoutDetailPage.init();
});