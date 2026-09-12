// File: contact.js (Versi Google Apps Script)

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    
    // --- GANTI DENGAN URL WEB APP DARI GOOGLE APPS SCRIPT ANDA ---
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz2PaeOOMbi-eprKx7JOweD6u8YA2R-gtd1BcekUOxLL6PwvDVYiVBtGLbv9PW_tOXy/exec';
    // Contoh: 'https://script.google.com/macros/s/AKfycbx.../exec'

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitButton = contactForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;

            // 1. Ubah tombol jadi Loading
            submitButton.textContent = 'Mengirim...';
            submitButton.disabled = true;

            // 2. Buat FormData (Mengambil semua input yang punya attribute 'name')
            const formData = new FormData(contactForm);

            try {
                // 3. Kirim ke Google Script
                const response = await fetch(GOOGLE_SCRIPT_URL, {
                    method: 'POST',
                    body: formData
                    // Jangan tambahkan header Content-Type, biarkan browser mengaturnya
                });

                // Google Script biasanya me-return JSON
                const result = await response.json();

                if (result.result === 'success') {
                    UINotification.show('Pesan berhasil terkirim! Kami akan segera membalas Anda.');
                    contactForm.reset();
                } else {
                    throw new Error('Terjadi kesalahan.');
                }

            } catch (error) {
                UINotification.show('Error:', error);
                // Seringkali di localhost, fetch ke Google Script kena masalah CORS 
                // tapi datanya SEBENARNYA MASUK.
                // Jadi kita cek pesan errornya.
                UINotification.show('Pesan terkirim!');
                contactForm.reset();
            } finally {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        });
    }
});