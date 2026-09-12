/**
 * Modul Search Global (search.js)
 * * Versi ini Diperbarui dengan:
 * 1. Logika "Live Search Dropdown" untuk auto-suggest.
 * 2. PERBAIKAN BUG: Logika "Cerdas" untuk menangani pencarian kosong di halaman filter.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Ambil elemen search bar
    const searchBarContainer = document.querySelector('.main-header .search-bar');
    const headerSearchInput = searchBarContainer ? searchBarContainer.querySelector('input[type="text"]') : null;
    const headerSearchButton = searchBarContainer ? searchBarContainer.querySelector('.btn-p') : null;

    if (!headerSearchInput || !headerSearchButton) {
        return; // Hentikan jika search bar tidak ada
    }

    // --- 1. LOGIKA UNTUK LIVE SEARCH DROPDOWN ---
    
    // Buat elemen dropdown sekali saja
    const resultsDropdown = document.createElement('div');
    resultsDropdown.className = 'search-results-dropdown';
    // Masukkan dropdown tepat setelah search-bar di dalam header
    searchBarContainer.style.position = 'relative'; // Dibutuhkan untuk positioning
    searchBarContainer.appendChild(resultsDropdown);

    // Fungsi untuk memfilter dan menampilkan dropdown
    const showSearchSuggestions = () => {
        const term = headerSearchInput.value.trim().toLowerCase();

        // Cek jika data produk sudah siap
        if (term.length === 0 || !window.UM_MART || !window.UM_MART.products) {
            resultsDropdown.style.display = 'none';
            return;
        }

        // Filter produk berdasarkan nama
        const matches = window.UM_MART.products
            .filter(p => p.name.toLowerCase().includes(term))
            .slice(0, 5); // Tampilkan maksimal 5 hasil

        if (matches.length === 0) {
            resultsDropdown.style.display = 'none';
            return;
        }

        // Buat HTML untuk setiap hasil
        resultsDropdown.innerHTML = matches.map(product => `
            <a href="./filter.html?search=${encodeURIComponent(product.name)}" class="dropdown-item">
                <img src="${product.image}" alt="${product.name}" class="dropdown-item-img">
                <div class="dropdown-item-info">
                    <span class="dropdown-item-name">${product.name}</span>
                    <span class="dropdown-item-price">Rp ${product.price.toLocaleString('id-ID')}</span>
                </div>
            </a>
        `).join('');

        // Tampilkan dan posisikan dropdown
        resultsDropdown.style.width = `${searchBarContainer.offsetWidth}px`;
        resultsDropdown.style.display = 'block';
    };

    // Tampilkan dropdown saat pengguna mengetik
    headerSearchInput.addEventListener('input', showSearchSuggestions);

    // Sembunyikan dropdown saat pengguna mengklik di luar
    document.addEventListener('click', (e) => {
        if (!searchBarContainer.contains(e.target)) {
            resultsDropdown.style.display = 'none';
        }
    });
    // Sembunyikan juga saat input kehilangan fokus
     headerSearchInput.addEventListener('focusout', (e) => {
        setTimeout(() => {
            if (!resultsDropdown.matches(':hover')) {
                 resultsDropdown.style.display = 'none';
            }
        }, 200);
    });


    // --- 2. LOGIKA UNTUK TOMBOL SEARCH (PERBAIKAN BUG) ---

    const performSearch = () => {
        const searchTerm = headerSearchInput.value.trim();
        const filterPagePath = '/Latihan%20HTML%20LIBURAN/Latihan106_UM_MART_FILTER.html';
        const filterPageUrl = './filter.html';

        // Cek apakah kita SUDAH di halaman filter
        if (window.location.pathname.includes(filterPagePath)) {
            
            // --- INI ADALAH PERBAIKAN BUG ---
            // 1. Perbarui URL di browser secara manual TANPA me-reload halaman
            const url = new URL(window.location.href);
            if (searchTerm) {
                url.searchParams.set('search', searchTerm);
            } else {
                // Jika search bar kosong, HAPUS parameter 'search' dari URL
                url.searchParams.delete('search'); 
            }
            // 'pushState' mengubah URL di bar browser
            window.history.pushState({}, '', url.toString());
            
            // 2. Sekarang, panggil fungsi filter lokal dari ShopPage
            if (typeof ShopPage !== 'undefined' && typeof ShopPage.applyFiltersAndSort === 'function') {
                // Fungsi ini sekarang akan membaca URL yang sudah bersih (tanpa '?search=wortel')
                // dan input yang kosong, sehingga akan me-reset ke default.
                ShopPage.applyFiltersAndSort();
            } else {
                // Fallback jika ShopPage tidak ditemukan
                window.location.href = url.toString();
            }
            // --- AKHIR PERBAIKAN BUG ---
            
        } else {
            
            // JIKA BELUM (kita di homepage, dll): Lakukan redirect seperti biasa.
            const url = new URL(filterPageUrl, window.location.origin);
            if (searchTerm) {
                url.searchParams.set('search', searchTerm);
            }
            // Jika searchTerm kosong, kita tetap redirect (tanpa param search)
            window.location.href = url.toString();
        }
    };

    // Tambahkan event listener untuk tombol "SEARCH"
    headerSearchButton.addEventListener('click', performSearch);

    // Tambahkan event listener untuk menekan "Enter"
    headerSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault(); 
            performSearch();
        }
    });
});