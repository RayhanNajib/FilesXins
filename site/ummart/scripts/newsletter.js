/**
 * File: newsletter.js
 * Logika untuk Form Subscribe di Footer
 */

document.addEventListener('DOMContentLoaded', () => {
    
    const newsletterForm = document.getElementById('newsletter-form');
    const emailInput = document.getElementById('newsletter-email');
    const submitButton = document.getElementById('newsletter-submit');

    // Pastikan form ada di halaman ini
    if (!newsletterForm || !emailInput || !submitButton) {
        return;
    }

    // Fungsi sederhana untuk validasi format email
    function isValidEmail(email) {
        const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return regex.test(email);
    }

    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Mencegah form mengirim (reload halaman)

        const email = emailInput.value.trim();

        // Cek jika UINotification sudah dimuat
        if (typeof UINotification === 'undefined') {
            console.error("Modul UINotification belum dimuat!");
            return;
        }

        // 1. Validasi Email
        if (email === '' || !isValidEmail(email)) {
            UINotification.show('Harap masukkan alamat email yang valid.', 'warning');
            return;
        }

        // 2. Tampilkan Pesan Sukses
        // (Di proyek nyata, di sinilah Anda mengirim email ke Google Script/backend)
        UINotification.show('Terima kasih! Anda telah berlangganan.', 'success');
        
        // 3. Kosongkan input
        emailInput.value = '';
    });

});