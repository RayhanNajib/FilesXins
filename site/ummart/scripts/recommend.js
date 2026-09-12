document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Buat elemen FAB (Floating Action Button) baru
    const fab = document.createElement('div');
    fab.id = 'recommend-fab';
    fab.title = 'Lihat Rekomendasi';
    // Gunakan ikon 'lightbulb' dari Font Awesome
    fab.innerHTML = '<i class="fas fa-star"></i>';

    // 2. Buat elemen Modal (di-desain ulang untuk "chat")
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'recommend-modal-overlay';
    
    modalOverlay.innerHTML = `
        <div class="recommend-modal-content">
            <div class="recommend-header">
                <h2 id="recommend-title">Rekomendasi</h2>
                <span id="recommend-close-btn">&times;</span>
            </div>
            <div class="recommend-product-list" id="recommend-list-container">
                <div class="cakra-chat-bubble">
                    <img src="../assets/images/maskot1.png" alt="Cakra" class="cakra-avatar">
                    <p class="recommend-message" id="recommend-message">Cakra sedang berpikir...</p>
                </div>
                </div>
        </div>
    `;

    // 3. Tambahkan elemen ke halaman
    document.body.appendChild(fab);
    document.body.appendChild(modalOverlay);

    // 4. Ambil referensi elemen
    const closeBtn = document.getElementById('recommend-close-btn');
    const listContainer = document.getElementById('recommend-list-container');
    const headerTitle = document.getElementById('recommend-title');
    const messageEl = document.getElementById('recommend-message');

    // 5. Fungsi baru untuk membersihkan rekomendasi lama
    const clearOldProducts = () => {
        const items = listContainer.querySelectorAll('.recommend-item, .recommend-message-empty');
        items.forEach(item => item.remove());
    };

    // 6. Fungsi untuk mengambil data (diperbarui)
    const fetchRecommendations = async () => {
        try {
            // Selalu reset ke status "loading" setiap kali dibuka
            headerTitle.textContent = 'Memuat Rekomendasi...';
            messageEl.innerHTML = "Cakra sedang berpikir...";
            clearOldProducts();

            const response = await fetch('../api/public/get_recommendations.php');
            const result = await response.json();

            if (result.success) {
                // Perbarui Judul dan Pesan Cakra
                headerTitle.textContent = result.title;
                messageEl.innerHTML = result.message; // Menggunakan innerHTML agar tag <strong> terbaca
                
                if (result.data.length > 0) {
                    renderRecommendations(result.data);
                } else {
                    // Jika user login tapi tidak ada item baru di kategori favoritnya
                    const noItemMessage = document.createElement('p');
                    noItemMessage.className = 'recommend-message-empty';
                    noItemMessage.textContent = 'Kamu sudah melihat semua item di kategori favoritmu!';
                    listContainer.appendChild(noItemMessage);
                }
            } else {
                throw new Error(result.message || 'Gagal mengambil data.');
            }
        } catch (error) {
            UINotification.show('Error fetching recommendations:', error);
            headerTitle.textContent = "Error";
            messageEl.innerHTML = 'Gagal memuat rekomendasi.';
        }
    };


    const renderRecommendations = (products) => {
        products.forEach(product => {
            const productLink = document.createElement('a');
            productLink.className = 'recommend-item';
            

            const searchTerm = product.name;
            productLink.href = `./filter.html?search=${encodeURIComponent(searchTerm)}`;
            
            productLink.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div class="recommend-item-info">
                    <span class="recommend-item-name">${product.name}</span>
                    <span class="recommend-item-price">Rp ${product.price.toLocaleString('id-ID')}</span>
                </div>
            `;
            listContainer.appendChild(productLink);
        });
    };


    fab.addEventListener('click', () => {
        modalOverlay.classList.add('visible');
        fetchRecommendations(); 
    });

    closeBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('visible');
    });


    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('visible');
        }
    });
});