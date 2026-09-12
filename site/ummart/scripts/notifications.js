/**
 * File: notifications.js
 * REVISI: Menggunakan Gambar Cakra
 */
const UINotification = {
    
    /**
     * Menampilkan notifikasi kustom.
     * @param {string} message - Pesan yang ingin ditampilkan.
     * @param {string} type - Tipe notifikasi ('success', 'error', 'info', 'warning')
     * @param {number} duration - Durasi dalam milidetik (default: 5000ms)
     */
    show: function(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notification-container');
        if (!container) return;

        // 1. Tentukan Gambar Cakra berdasarkan Tipe
        // (SESUAIKAN PATH INI JIKA PERLU)
        let imageSrc = '../assets/images/notifications/cakra-info.png'; // Default
        if (type === 'success') {
            imageSrc = '../assets/images/notifications/cakra-success.png'; // Ganti dengan path gambar sukses Anda
        } else if (type === 'error') {
            imageSrc = '../assets/images/notifications/cakra-error.png'; // Ganti dengan path gambar error Anda
        } else if (type === 'warning') {
            imageSrc = '../assets/images/notifications/cakra-warning.png'; // Ganti dengan path gambar warning Anda
        }

        // 2. Buat Elemen Notifikasi
        const notification = document.createElement('div');
        notification.className = `um-notification ${type}`;
        
        // REVISI: Gunakan <img> alih-alih <i>
        notification.innerHTML = `
            <img src="${imageSrc}" alt="Notifikasi" class="notification-image">
            <div class="notification-message">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        // AKHIR REVISI

        // 3. Tambahkan ke Kontainer
        container.prepend(notification); // prepend agar notif baru muncul di atas

        // 4. Fungsi untuk menghapus notifikasi
        const removeNotification = () => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500); 
        };

        // 5. Hapus otomatis setelah 'duration'
        const timer = setTimeout(removeNotification, duration);

        // 6. Hapus jika tombol close diklik
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timer); 
            removeNotification();
        });
    }
};