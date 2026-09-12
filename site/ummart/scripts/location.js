// location.js

// Fungsi untuk menampilkan lokasi yang tersimpan
function displaySavedLocation() {
    const savedLocation = localStorage.getItem('userLocation');
    const locationTextElement = document.getElementById('location-text');
    if (locationTextElement && savedLocation) {
        locationTextElement.textContent = savedLocation;
    }
}

// Fungsi untuk mendapatkan nama kota dari koordinat (latitude, longitude)
function getCityName(lat, lon) {
    const apiUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            let cityName = "Lokasi Anda";
            if (data.address) {
                cityName = data.address.city || data.address.town || data.address.county || "Lokasi Terdeteksi";
            }
            localStorage.setItem('userLocation', cityName);
            UINotification.show(`Lokasi berhasil diatur ke: ${cityName}`);
            // Arahkan kembali ke halaman utama
            window.location.href = './home.html';
        })
        .catch(error => {
            UINotification.show("Gagal mengambil nama kota:", error);
            UINotification.show("Gagal mengambil nama kota, namun lokasi Anda tetap tersimpan.");
            localStorage.setItem('userLocation', 'Lokasi Tersimpan');
            window.location.href = './home.html';
        });
}

// Fungsi utama untuk memulai deteksi lokasi
function setLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Berhasil mendapatkan koordinat
                getCityName(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                // Gagal mendapatkan koordinat
                UINotification.show("Error Geolocation:", error);
                UINotification.show("Tidak dapat mengakses lokasi. Pastikan Anda telah memberikan izin akses lokasi pada browser Anda.");
            }
        );
    } else {
        UINotification.show("Browser Anda tidak mendukung fitur Geolocation.");
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // --- Bagian ini berjalan di SEMUA halaman untuk menampilkan lokasi ---
    displaySavedLocation();

    // --- Bagian ini berjalan KHUSUS di halaman pengaturan lokasi ---
    const setLocationButton = document.querySelector('.btn-location');
    if (setLocationButton) {
        setLocationButton.addEventListener('click', (event) => {
            event.preventDefault();
            setLocation();
        });
    }
});