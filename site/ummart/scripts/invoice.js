document.addEventListener("DOMContentLoaded", function() {
    const invoiceData = JSON.parse(localStorage.getItem('currentInvoice'));
    const shippingCost = 5000;
    const discountValue = 2000;
    
    const invoiceIdElement = document.getElementById('invoice-id');
    const orderDateElement = document.getElementById('order-date');
    const paymentMethodElement = document.getElementById('payment-method');
    const productTableBody = document.querySelector('#product-table tbody');
    const subtotalPriceElement = document.getElementById('subtotal-price');
    const shippingPriceElement = document.getElementById('shipping-price');
    const discountRow = document.querySelector('.summary-item.discount-row');
    const discountPriceElement = document.getElementById('discount-price');
    const totalPriceElement = document.getElementById('total-price');
    const printBtn = document.getElementById('print-invoice-btn');

    if (!invoiceData) {
        UINotification.show('Invoice data not found. Please go back to the transaction list.');
        window.location.href = './transactions.html';
        return;
    }

    // Isi detail invoice
    invoiceIdElement.textContent = invoiceData.orderCode.replace('#UMMART-', '');
    orderDateElement.textContent = invoiceData.orderDate;
    paymentMethodElement.textContent = invoiceData.paymentMethod.toUpperCase();

    let subtotal = 0;
    productTableBody.innerHTML = '';
    invoiceData.products.forEach(product => {
        const productSubtotal = product.price * product.quantity;
        subtotal += productSubtotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.quantity}</td>
            <td>Rp ${product.price.toLocaleString('id-ID')}</td>
            <td>Rp ${productSubtotal.toLocaleString('id-ID')}</td>
        `;
        productTableBody.appendChild(row);
    });

    // Hitung dan tampilkan total
    let finalTotal = subtotal + shippingCost;
    if (subtotal + shippingCost !== invoiceData.orderTotal) {
        finalTotal = invoiceData.orderTotal;
        discountRow.classList.remove('hidden');
        const discountAmount = (subtotal + shippingCost) - finalTotal;
        discountPriceElement.textContent = `-Rp ${discountAmount.toLocaleString('id-ID')}`;
    }

    subtotalPriceElement.textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
    shippingPriceElement.textContent = `Rp ${shippingCost.toLocaleString('id-ID')}`;
    totalPriceElement.textContent = `Rp ${finalTotal.toLocaleString('id-ID')}`;

    // Tambahkan fungsionalitas tombol cetak
    if (printBtn) {
        printBtn.addEventListener('click', function() {
            window.print();
        });
    }

    // Bersihkan data sementara setelah dimuat
    // localStorage.removeItem('currentInvoice');
});