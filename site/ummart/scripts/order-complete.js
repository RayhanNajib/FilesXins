document.addEventListener("DOMContentLoaded", function() {
    const orderCodeElement = document.getElementById('order-code');
    const orderDateElement = document.getElementById('order-date');
    const orderTotalElement = document.getElementById('order-total');
    const paymentMethodElement = document.getElementById('payment-method');
    const productCarouselWrapper = document.getElementById('product-carousel');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    // Mengambil seluruh objek order dari localStorage
    const orderDetails = JSON.parse(localStorage.getItem('lastOrder'));
    
    // Periksa apakah data order ada
    if (!orderDetails) {
        orderCodeElement.textContent = 'N/A';
        orderDateElement.textContent = 'N/A';
        orderTotalElement.textContent = 'Rp 0';
        paymentMethodElement.textContent = 'N/A';
        productCarouselWrapper.innerHTML = '<p style="text-align:center; color:#888;">Tidak ada produk dalam pesanan ini.</p>';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        return;
    }

    // Gunakan data dari objek orderDetails
    const { orderCode, orderDate, orderTotal, paymentMethod, products } = orderDetails;

    // Isi detail pesanan
    orderCodeElement.textContent = orderCode;
    orderDateElement.textContent = orderDate;
    orderTotalElement.textContent = `Rp ${orderTotal.toLocaleString('id-ID')}`;
    paymentMethodElement.textContent = paymentMethod.toUpperCase();

    // Render produk di karosel
    if (products && products.length > 0) {
        products.forEach(item => {
            const productElement = document.createElement('div');
            productElement.classList.add('carousel-item');
            productElement.innerHTML = `<img src="${item.image}" alt="${item.name}">`;
            productCarouselWrapper.appendChild(productElement);
        });
    } else {
        productCarouselWrapper.innerHTML = '<p style="text-align:center; color:#888;">Tidak ada produk dalam pesanan ini.</p>';
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }

    // Atur fungsionalitas karosel
    const scrollAmount = 180; // Lebar item + gap

    prevBtn.addEventListener('click', () => {
        productCarouselWrapper.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    nextBtn.addEventListener('click', () => {
        productCarouselWrapper.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
});