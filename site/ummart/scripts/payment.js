document.addEventListener("DOMContentLoaded", function() {
    
    // --- 1. Ambil Data Pesanan Terakhir (Pending) ---
    // Data ini disiapkan oleh halaman Checkout sebelumnya
    const lastOrder = JSON.parse(localStorage.getItem('lastOrder'));

    // Validasi: Jika tidak ada data pesanan, kembalikan ke home
    if (!lastOrder || !lastOrder.orderCode) {
        if (typeof UINotification !== 'undefined') {
            UINotification.show('Data pesanan tidak valid atau sesi habis.', 'error');
        } else {
            alert('Data pesanan tidak valid.');
        }
        setTimeout(() => {
            window.location.href = './home.html';
        }, 1500);
        return; 
    }

    // --- 2. Selektor DOM ---
    const countdownElement = document.getElementById("countdown");
    const continueButton = document.getElementById("continue-btn");
    const priceElement = document.querySelector(".purchase-info .price");
    const orderIdElement = document.querySelector(".purchase-info .order-id");
    const paymentMethodLogo = document.querySelector(".payment-method .payment-logo");
    
    // Elemen Alur QRIS
    const qrCodeImage = document.getElementById("dummy-qr-code");
    const qrDisplay = document.getElementById("qr-display");
    const simulatedPaymentScreen = document.getElementById("simulated-payment");
    const simulatedAmount = document.getElementById("simulated-amount");
    const simulatedPayButton = document.getElementById("simulated-pay-button");

    // --- 3. Tampilkan Data ke Layar ---
    const orderCode = lastOrder.orderCode;
    const finalPrice = lastOrder.orderTotal;
    const paymentType = lastOrder.paymentMethod;

    if (priceElement) priceElement.textContent = `Rp ${finalPrice.toLocaleString('id-ID')}`;
    if (orderIdElement) orderIdElement.textContent = `Order ID: ${orderCode}`;
    if (simulatedAmount) simulatedAmount.textContent = `Rp ${finalPrice.toLocaleString('id-ID')}`;

    if (paymentType && paymentMethodLogo) {
        paymentMethodLogo.src = `../assets/images/Payment/${paymentType.toUpperCase()}.png`;
        paymentMethodLogo.alt = paymentType.toUpperCase();
    }
    
    // Generate QR Code
    if (qrCodeImage) {
        // QR Code ini hanya simulasi visual
        const qrData = `PAYMENT:${orderCode};AMOUNT:${finalPrice};MERCHANT:UMMART`;
        qrCodeImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;
    }

    // --- 4. Logika Timer (Auto-Cancel) ---
    let timeInSeconds = 300; // 5 menit
    
    const timerInterval = setInterval(() => {
        timeInSeconds--;
        let minutes = Math.floor(timeInSeconds / 60);
        let seconds = timeInSeconds % 60;
        
        if(countdownElement) {
            countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        if (timeInSeconds < 0) {
            clearInterval(timerInterval);
            if(countdownElement) countdownElement.textContent = "Waktu Habis";
            
            if (typeof UINotification !== 'undefined') {
                UINotification.show('Waktu pembayaran habis. Pesanan dibatalkan.', 'error', 5000);
            }
            
            // Matikan interaksi
            if(continueButton) continueButton.disabled = true;
            if(qrDisplay) qrDisplay.style.display = 'none';
            if(simulatedPaymentScreen) simulatedPaymentScreen.style.display = 'none';

            setTimeout(() => {
                window.location.href = './home.html';
            }, 3000);
        }
    }, 1000);
    
    // --- 5. FUNGSI KONFIRMASI PEMBAYARAN (DIPAKAI OLEH DUA METODE) ---
    
    async function confirmPayment() {
        try {
            // Panggil API untuk update status jadi 'Complete'
            const response = await fetch('../api/public/konfirmasi_bayar.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    order_code: orderCode
                })
            });

            const result = await response.json();

            if (result.success) {
                if(typeof UINotification !== 'undefined') UINotification.show('Pembayaran Berhasil!', 'success');
                
                // Redirect ke Order Complete
                setTimeout(() => {
                    window.location.href = './order-complete.html';
                }, 1000);
            
            } else {
                if(typeof UINotification !== 'undefined') UINotification.show('Gagal: ' + result.message, 'error');
                if(continueButton) {
                    continueButton.disabled = false;
                    continueButton.textContent = "Continue";
                }
            }

        } catch (error) {
            console.error('Error saat konfirmasi:', error);
            if(typeof UINotification !== 'undefined') UINotification.show('Terjadi kesalahan koneksi.', 'error');
            if(continueButton) {
                continueButton.disabled = false;
                continueButton.textContent = "Continue";
            }
        }
    }

    // --- 6. Event Listeners (DUA ALTERNATIF) ---

    // ALTERNATIF A: Klik QR Code (Simulasi Scan HP)
    if (qrCodeImage) {
        qrCodeImage.addEventListener('click', () => {
            if (qrDisplay) qrDisplay.style.display = 'none';
            if (simulatedPaymentScreen) simulatedPaymentScreen.style.display = 'flex';
        });
    }

    // Lanjutan Alternatif A: Klik "Bayar Sekarang" di Menu Simulasi
    if (simulatedPayButton) {
        simulatedPayButton.addEventListener('click', () => {
            clearInterval(timerInterval); 
            if (typeof UINotification !== 'undefined') {
                UINotification.show('Memproses pembayaran via QR...', 'info');
            }
            setTimeout(() => { confirmPayment(); }, 1000); 
        });
    }

    // ALTERNATIF B: Klik Tombol "Continue" (Cara Cepat)
    if (continueButton) {
        continueButton.addEventListener('click', () => {
            clearInterval(timerInterval);
            
            continueButton.disabled = true;
            continueButton.textContent = "Memproses...";
            
            if (typeof UINotification !== 'undefined') {
                UINotification.show('Memverifikasi pembayaran...', 'info');
            }
            
            setTimeout(() => { confirmPayment(); }, 1000); 
        });
    }
});