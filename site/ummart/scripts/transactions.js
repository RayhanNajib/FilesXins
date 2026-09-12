document.addEventListener("DOMContentLoaded", function() {
    const transactionListContainer = document.getElementById('transaction-list');
    const statusButtons = document.querySelectorAll('.status-btn');
    const resetButton = document.querySelector('.reset-filter');
    const filterDropdownButton = document.querySelector('.filter-dropdown-btn');
    
    // Elemen UI Pengaturan
    const autoDeleteSelect = document.getElementById('auto-delete-select');
    const deleteAllBtn = document.getElementById('delete-all-btn');

    // --- SELEKTOR BARU UNTUK PENCARIAN & TANGGAL ---
    const searchInput = document.querySelector('.search-input-wrapper .search-input');
    const searchIcon = document.querySelector('.search-input-wrapper .search-icon');
    const dateInput = document.querySelector('.date-input'); // <-- TAMBAHKAN INI
    // --- AKHIR SELEKTOR BARU ---

    let allTransactions = []; 
    const MAX_PRODUCTS_DISPLAY = 1;

    // --- FUNGSI MASTER FILTER (DIPERBARUI) ---
    function filterAndRender() {
        // 1. Dapatkan nilai status filter
        const activeStatusBtn = document.querySelector('.status-btn.active');
        const statusFilter = activeStatusBtn ? activeStatusBtn.textContent.trim() : 'All';

        // 2. Dapatkan nilai search filter
        const searchTerm = searchInput.value.toLowerCase().trim();

        // 3. Dapatkan nilai date filter (BARU)
        const dateFilter = dateInput.value; // Ini akan menghasilkan format "YYYY-MM-DD"

        // 4. Mulai filter
        let filteredTransactions = allTransactions;

        // 5. Filter berdasarkan Status
        if (statusFilter !== 'All') {
            filteredTransactions = filteredTransactions.filter(t => t.status === statusFilter);
        }

        // 6. Filter berdasarkan Pencarian
        if (searchTerm) {
            filteredTransactions = filteredTransactions.filter(t => 
                t.orderCode.toLowerCase().includes(searchTerm) ||
                t.products.some(p => p.name.toLowerCase().includes(searchTerm))
            );
        }

        // 7. Filter berdasarkan Tanggal (BARU)
        if (dateFilter) {
            // Bandingkan dengan 'raw_order_date' (YYYY-MM-DD) yang kita tambahkan dari backend
            filteredTransactions = filteredTransactions.filter(t => t.raw_order_date === dateFilter);
        }

        // 8. Render hasil akhir
        renderTransactions(filteredTransactions);
    }


    // --- FUNGSI-FUNGSI SETELAN (Tidak Berubah) ---
    async function loadTransactionSettings() {
        try {
            const response = await fetch('../api/public/get_transaction_settings.php');
            const result = await response.json();
            if (result.success) {
                autoDeleteSelect.value = result.auto_delete_days;
            }
        } catch (error) {
            UINotification.show('Gagal memuat setelan:', error);
        }
    }

    async function saveTransactionSettings() {
        const selectedDays = parseInt(autoDeleteSelect.value);
        try {
            const response = await fetch('../api/public/set_auto_delete.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days: selectedDays })
            });
            const result = await response.json();
            if (result.success) {
                UINotification.show('Setelan berhasil diperbarui.');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            UINotification.show('Gagal menyimpan setelan:', error);
            UINotification.show('Gagal menyimpan setelan: ' + error.message);
        }
    }

    async function deleteAllTransactions() {
        const isConfirmed = confirm('PERINGATAN!\n\nAnda yakin ingin menghapus SEMUA riwayat transaksi Anda? Tindakan ini tidak dapat dibatalkan.');
        
        if (isConfirmed) {
            try {
                const response = await fetch('../api/public/delete_all_transactions.php', {
                    method: 'POST' 
                });
                const result = await response.json();
                
                if (result.success) {
                    UINotification.show('Semua riwayat transaksi berhasil dihapus.');
                    loadTransactions(); 
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                UINotification.show('Gagal menghapus transaksi:', error);
                UINotification.show('Gagal menghapus transaksi: ' + error.message);
            }
        }
    }

    // --- FUNGSI-FUNGSI RENDER (Tidak Berubah) ---
    async function loadTransactions() {
        try {
            const response = await fetch('../api/public/get_transactions.php');
            const result = await response.json();
            if (result.success) {
                allTransactions = result.data.map(t => ({
                    ...t,
                    // Tambahkan raw_order_date ke objek JS
                    raw_order_date: t.raw_order_date, 
                    products: Array.isArray(t.products) ? t.products : []
                }));
                filterAndRender(); 
            } else {
                transactionListContainer.innerHTML = `<p class="no-transaction-message">${result.message}</p>`;
            }
        } catch (error) {
            UINotification.show('Gagal mengambil transaksi:', error);
            transactionListContainer.innerHTML = '<p class="no-transaction-message">Gagal memuat data. Silakan coba lagi.</p>';
        }
    }

    function renderTransactions(transactionsToRender) {
        transactionListContainer.innerHTML = '';
        if (transactionsToRender.length === 0) {
            transactionListContainer.innerHTML = '<p class="no-transaction-message">Tidak ada transaksi ditemukan.</p>';
            return;
        }

        transactionsToRender.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.classList.add('transaction-list-item');
            let productsHtml = '';
            const productsInTransaction = transaction.products;
            const hasMoreProducts = productsInTransaction.length > MAX_PRODUCTS_DISPLAY;
            const productsToShow = productsInTransaction.slice(0, MAX_PRODUCTS_DISPLAY);
            
            productsToShow.forEach(product => {
                productsHtml += `
                    <div class="product-item">
                        <img src="${product.image}" alt="${product.name}">
                        <div class="product-item-details">
                            <h4>${product.name}</h4>
                            <p>${product.quantity} x Rp ${product.price.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                `;
            });
            
            if (hasMoreProducts) {
                const hiddenProducts = productsInTransaction.slice(MAX_PRODUCTS_DISPLAY);
                hiddenProducts.forEach(product => {
                    productsHtml += `
                        <div class="product-item hidden">
                            <img src="${product.image}" alt="${product.name}">
                            <div class="product-item-details">
                                <h4>${product.name}</h4>
                                <p>${product.quantity} x Rp ${product.price.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                    `;
                });
            }
            
            const statusClass = transaction.status === 'Complete' ? 'complete' : (transaction.status === 'Ongoing' ? 'ongoing' : 'failed');

            transactionItem.innerHTML = `
                <div class="transaction-header">
                    <div class="transaction-header-info">
                        <i class="fas fa-shopping-cart shopping-icon"></i>
                        <span class="transaction-status-label">Shopping</span>
                        <span class="transaction-date">${transaction.orderDate}</span>
                    </div>
                    <div class="transaction-header-status">
                        <span class="transaction-status ${statusClass}">${transaction.status}</span>
                        <span class="order-code">${transaction.orderCode}</span>
                    </div>
                </div>
                <div class="transaction-details">
                    <div class="product-info-wrapper">
                        <div class="product-list-wrapper">
                            ${productsHtml}
                        </div>
                        ${hasMoreProducts ? `<button class="see-more-btn">See More</button>` : ''}
                    </div>
                    <div class="total-summary-wrapper">
                        <span class="total-label">Total Shopping</span>
                        <span class="total-price">Rp ${transaction.orderTotal.toLocaleString('id-ID')}</span>
                        <button class="check-invoice-btn" data-order-code="${transaction.orderCode}">Check Invoice</button>
                    </div>
                </div>
            `;
            transactionListContainer.appendChild(transactionItem);
        });

        setupToggleListeners();
        setupInvoiceButtonListeners();
    }
    
    function setupToggleListeners() {
        document.querySelectorAll('.see-more-btn').forEach(button => {
            button.addEventListener('click', function() {
                const productListWrapper = this.closest('.product-info-wrapper').querySelector('.product-list-wrapper');
                const allProducts = productListWrapper.querySelectorAll('.product-item');
                if (this.textContent === 'See More') {
                    allProducts.forEach(item => item.classList.remove('hidden'));
                    this.textContent = 'See Less';
                } else {
                    allProducts.forEach((item, index) => {
                        if (index > 0) { 
                            item.classList.add('hidden');
                        }
                    });
                    this.textContent = 'See More';
                }
            });
        });
    }

    // --- FUNGSI setupFilters (DIPERBARUI) ---
    function setupFilters() {
        statusButtons.forEach(button => {
            button.addEventListener('click', function() {
                statusButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                filterAndRender();
            });
        });
        
        resetButton.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.status-btn.active').classList.remove('active');
            document.querySelector('.status-btn[data-filter="All"]').classList.add('active');
            searchInput.value = '';
            dateInput.value = ''; // <-- TAMBAHKAN INI (Reset kalender)
            filterAndRender();
        });
    }

    // --- FUNGSI setupSearch (Tidak Berubah) ---
    function setupSearch() {
        if (searchIcon) {
            searchIcon.addEventListener('click', filterAndRender);
        }
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    filterAndRender();
                }
            });
        }
    }
    
    // --- FUNGSI BARU: Menambahkan listener untuk tanggal ---
    function setupDateFilter() {
        if (dateInput) {
            dateInput.addEventListener('change', filterAndRender);
        }
    }
    
    // --- FUNGSI-FUNGSI LAINNYA (Tidak Berubah) ---
    function setupInvoiceButtonListeners() {
        document.querySelectorAll('.check-invoice-btn').forEach(button => {
            button.addEventListener('click', function() {
                const orderCode = this.dataset.orderCode;
                const transactionData = allTransactions.find(t => t.orderCode === orderCode);
                if (transactionData) {
                    localStorage.setItem('currentInvoice', JSON.stringify(transactionData));
                    window.location.href = './invoice.html';
                } else {
                    UINotification.show('Transaction data not found.');
                }
            });
        });
    }
    
    if (filterDropdownButton) {
        const dropdownMenu = document.createElement('div');
        dropdownMenu.classList.add('filter-dropdown-menu');
        dropdownMenu.innerHTML = `
            <a href="#" class="dropdown-item" data-filter="all">View All Products</a>
            <a href="#" class="dropdown-item" data-filter="recent">See Recently</a>
        `;
        filterDropdownButton.parentNode.insertBefore(dropdownMenu, filterDropdownButton.nextSibling);

        filterDropdownButton.addEventListener('click', () => {
            dropdownMenu.classList.toggle('visible');
        });

        dropdownMenu.addEventListener('click', (e) => {
            e.preventDefault();
            const filterType = e.target.dataset.filter;
            if (filterType === 'recent') {
                allTransactions.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
            }
            filterAndRender();
            
            filterDropdownButton.textContent = `${e.target.textContent} `;
            const chevronIcon = document.createElement('i');
            chevronIcon.classList.add('fas', 'fa-chevron-down');
            filterDropdownButton.appendChild(chevronIcon);
            dropdownMenu.classList.remove('visible');
        });

        document.addEventListener('click', function(e) {
            if (!filterDropdownButton.contains(e.target) && !dropdownMenu.contains(e.target)) {
                dropdownMenu.classList.remove('visible');
            }
        });
    }

    // --- INISIALISASI (DIPERBARUI) ---
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', deleteAllTransactions);
    }
    if (autoDeleteSelect) {
        autoDeleteSelect.addEventListener('change', saveTransactionSettings);
    }
    
    loadTransactions(); 
    loadTransactionSettings();
    setupFilters();
    setupSearch(); 
    setupDateFilter(); // <-- TAMBAHKAN PEMANGGILAN FUNGSI INI
});