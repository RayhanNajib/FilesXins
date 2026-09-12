async function handleCredentialResponse(response) {
    console.log("Token Google diterima. Mengirim ke server...");
    
    const idToken = response.credential;
    
    try {
        const fetchResponse = await fetch('../api/auth/google_verify.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: idToken })
        });

        const result = await fetchResponse.json();

        if (result.success) {
            localStorage.setItem('loggedInUser', result.username);
            UINotification.show('Login Google berhasil! Selamat datang, ' + result.username);
            
            if (result.role === 'admin') {
                window.location.href = './admin-dashboard.html';
            } else {
                window.location.href = './home.html';
            }
        } else {
            UINotification.show('Login Gagal: ' + result.message);
        }

    } catch (error) {
        UINotification.show('Verifikasi Google gagal:', error);
        UINotification.show('Login Gagal: Terjadi masalah jaringan.');
    }
}

const Auth = {
    init() {
        this.updateHeaderUI();
        this.addEventListeners();
        this.initGoogleLogin();
    },

    initGoogleLogin() {
        const checkGoogleAPI = setInterval(() => {
            if (typeof google !== 'undefined') {
                clearInterval(checkGoogleAPI);
                
                // GUNAKAN CLIENT ID YANG SAMA
                google.accounts.id.initialize({
                    client_id: '143358092915-2smtebd69n97k2j944tdos7pvk0unsbg.apps.googleusercontent.com',
                    callback: handleCredentialResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true
                });
                
                // Render Google Button
                const googleButton = document.getElementById('googleLoginButton');
                if (googleButton) {
                    google.accounts.id.renderButton(
                        googleButton,
                        { 
                            theme: 'outline', 
                            size: 'large',
                            width: googleButton.offsetWidth,
                            text: 'signin_with',
                            shape: 'rectangular'
                        }
                    );
                }
            }
        }, 100);
    },

// Update handleCredentialResponse menjadi method
async handleCredentialResponse(response) {
    console.log("Token Google diterima. Mengirim ke server...");
    
    const idToken = response.credential;
    
    try {
        const fetchResponse = await fetch('../api/auth/google_verify.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: idToken })
        });

        const result = await fetchResponse.json();

        if (result.success) {
            localStorage.setItem('loggedInUser', result.username);
            UINotification.show('Login Google berhasil! Selamat datang, ' + result.username);
            
            if (result.role === 'admin') {
                window.location.href = './admin-dashboard.html';
            } else {
                window.location.href = './home.html';
            }
        } else {
            UINotification.show('Login Gagal: ' + result.message);
        }

    } catch (error) {
        UINotification.show('Verifikasi Google gagal:', error);
        UINotification.show('Login Gagal: Terjadi masalah jaringan.');
    }
},

    // Fungsi untuk memperbarui tampilan header (Login/Logout & pesan selamat datang)
    updateHeaderUI() {
        // Ambil nama pengguna dari penyimpanan browser
        const loggedInUser = localStorage.getItem('loggedInUser');
        const authLinks = document.getElementById('auth-links');
        const userInfo = document.getElementById('user-info');
        const welcomeMessage = document.getElementById('welcome-message');

        if (loggedInUser) {
            // Jika pengguna sudah login, tampilkan info pengguna
            if (authLinks) authLinks.style.display = 'none';
            if (userInfo) {
                userInfo.style.display = 'flex';
                // Membuat huruf pertama dari username menjadi kapital
                const capitalizedUser = loggedInUser.charAt(0).toUpperCase() + loggedInUser.slice(1);
                if (welcomeMessage) welcomeMessage.textContent = `Selamat datang, ${capitalizedUser}`;
            }
        } else {
            // Jika pengguna belum login, tampilkan link Login/Sign Up
            if (authLinks) authLinks.style.display = 'flex';
            if (userInfo) userInfo.style.display = 'none';
        }
    },
    
    // Fungsi untuk proses logout
    async logout() {
        // 1. Hapus data di client
        localStorage.removeItem('loggedInUser');

        try {
            // 2. Hancurkan sesi di server
            const response = await fetch('../api/auth/logout.php');
            const result = await response.json();
            
            if (result.success) {
                // 3. Beri tahu user dan reload
                UINotification.show('Anda telah berhasil logout.');
                window.location.reload();
            } else {
                UINotification.show('Logout gagal: ' + result.message);
            }
        } catch (error) {
            UINotification.show("Gagal menghubungi server untuk logout:", error);
            // Fallback: tetap hapus local storage dan reload
            localStorage.removeItem('loggedInUser');
            UINotification.show('Anda telah logout (offline mode).');
            window.location.reload();
        }
    },

    // --- FUNGSI BANTUAN ---
    // Fungsi untuk menangani toggle lihat password
    setupPasswordToggle(toggleId, passwordId) {
        const toggle = document.getElementById(toggleId);
        const passwordInput = document.getElementById(passwordId);
        
        if (toggle && passwordInput) {
            toggle.addEventListener('click', function (e) {
                e.preventDefault();
                // Ubah tipe input
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Ubah ikon mata
                if (type === 'password') {
                    toggle.classList.remove('fa-eye-slash');
                    toggle.classList.add('fa-eye');
                } else {
                    toggle.classList.remove('fa-eye');
                    toggle.classList.add('fa-eye-slash');
                }
            });
        }
    },

    // Fungsi untuk menambahkan semua event listener yang dibutuhkan
    addEventListeners() {
        // Event listener untuk tombol logout
        const logoutLink = document.getElementById('logout-link');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
        
        // Event listener untuk form login biasa
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                if (!email || !password) {
                    UINotification.show('Harap isi email/username dan password.');
                    return;
                }

                // Kirim data ke backend login.php
                fetch('../api/auth/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        UINotification.show(data.message);
                        localStorage.setItem('loggedInUser', data.username);
                        if (data.role === 'admin') {
                            window.location.href = './admin-dashboard.html';
                        } else {
                            window.location.href = './home.html';
                        }
                    } else {
                        UINotification.show('Login Gagal: ' + data.message);
                    }
                })
                .catch(error => {
                    UINotification.show('Error:', error);
                    UINotification.show('Terjadi kesalahan saat menghubungi server.');
                });
            });

            // Terapkan toggle password untuk Halaman Login
            this.setupPasswordToggle('togglePassword', 'password');
        }

        // Event listener untuk form sign up
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const username = document.getElementById('username').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                
                // Validasi Sederhana
                if (!username || !email || !password || !confirmPassword) {
                    UINotification.show('Harap isi semua kolom.');
                    return;
                }
                if (password !== confirmPassword) {
                    UINotification.show('Password dan Konfirmasi Password tidak cocok.');
                    return;
                }
                if (password.length < 6) {
                    UINotification.show('Password minimal harus 6 karakter.');
                    return;
                }

                fetch('../api/auth/register.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: username, email: email, password: password })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        UINotification.show('Pendaftaran berhasil! Silakan login.');
                        window.location.href = './login.html';
                    } else {
                        UINotification.show('Pendaftaran gagal: ' + data.message);
                    }
                })
                .catch(error => {
                    UINotification.show('Error:', error);
                    UINotification.show('Terjadi kesalahan saat mendaftar.');
                });
            });

            // Terapkan toggle password untuk Halaman Sign Up
            this.setupPasswordToggle('togglePassword', 'password');
            this.setupPasswordToggle('toggleConfirmPassword', 'confirm-password');
        }
    }
};

// Panggil fungsi inisialisasi Auth setelah halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Load Google API script
function loadGoogleSignIn() {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

// Load Google API ketika halaman dimuat
loadGoogleSignIn();