// Mengambil data keranjang dari Local Storage atau membuat array kosong
let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];

// Fungsi untuk menyimpan keranjang ke Local Storage
const saveCart = () => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
};

// Fungsi untuk memperbarui notifikasi jumlah item di ikon keranjang
const updateCartUI = () => {
    const container = document.getElementById('cart-items');
    const countEls = document.querySelectorAll('#cart-item-count');
    const subtotalEl = document.getElementById('subtotal-price');
    const notificationEl = document.getElementById('cart-notification');

    if (!container) return;
    
    container.innerHTML = '';
    let subtotal = 0;
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    if (cartItems.length > 0) {
        cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            container.innerHTML += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-quantity-text">${item.quantity} x Rp ${item.price.toLocaleString('id-ID')}</span>
                        <div class="item-price">Rp ${itemTotal.toLocaleString('id-ID')}</div>
                    </div>
                    <button class="remove-item" data-id="${item.id}">&times;</button>
                </div>
            `;
        });
    } else {
        container.innerHTML = '<p style="text-align: center; color: #888;">Keranjang Anda kosong.</p>';
    }
    
    if(subtotalEl) subtotalEl.textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
    countEls.forEach(el => el.textContent = totalItems);
    if(notificationEl) {
        notificationEl.textContent = totalItems;
        notificationEl.style.display = totalItems > 0 ? 'flex' : 'none';
    }
};

const addToCart = (productId, quantity = 1) => {
    // Gunakan array 'products' dari file Latihan34_UM_MART_DATA.js
    const productToAdd = window.UM_MART.products.find(p => p.id === productId); // BENAR
    if (!productToAdd) return;

    const existingItem = cartItems.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cartItems.push({ ...productToAdd, quantity });
    }
    saveCart();
    updateCartUI();
};

const removeFromCart = (productId) => {
    cartItems = cartItems.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
};

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();

    const cartToggle = document.getElementById('cart-icon-container');
    const cartSidebar = document.getElementById('cart-sidebar');
    const closeCartBtn = document.getElementById('close-cart');
    const overlay = document.getElementById('overlay');
    const toggleCart = e => {
        if(e) e.preventDefault();
        cartSidebar.classList.toggle('open');
        overlay.classList.toggle('visible');
    };

    if(cartToggle) cartToggle.addEventListener('click', toggleCart);
    if(closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);
    if(overlay) overlay.addEventListener('click', toggleCart);
    
    const cartContainer = document.getElementById('cart-items');
    if(cartContainer) {
        cartContainer.addEventListener('click', e => {
            if (e.target.classList.contains('remove-item')) {
                removeFromCart(parseInt(e.target.dataset.id));
            }
        });
    }
});