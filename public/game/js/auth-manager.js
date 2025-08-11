// public/game/js/auth-manager.js - Con debugging mejorado y Google Sign-In

// Helper function para obtener la URL base de la API
function getApiBaseUrl() {
    return window.location.hostname === 'localhost' ? 
        'http://localhost:3000' : 
        'https://back.pruebatupanel.com';
}

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.user = null;
        this.isAuthenticated = false;
    }

    async initialize() {
        if (this.token) {
            try {
                // Verificar token existente
                console.log('🔍 Verifying existing token...');
                const response = await fetch(`${getApiBaseUrl()}/api/auth/verify`, {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.user = data.user;
                    this.isAuthenticated = true;
                    this.updateUI();
                    this.updateUserDisplay(); // NUEVO: Mostrar avatar/email
                    console.log('✅ Token verified, user logged in');
                } else {
                    console.log('❌ Token expired, logging out');
                    this.logout();
                }
            } catch (error) {
                console.error('Auth verification failed:', error);
                this.logout();
            }
        } else {
            // No token found, ensure UI shows login state
            this.updateUI();
        }
    }

    async loginWithGoogle(googleToken) {
        try {
            console.log('🔗 Attempting login with token:', googleToken);
            
            const response = await fetch(`${getApiBaseUrl()}/api/auth/google`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ token: googleToken })
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                console.error('❌ Response not OK:', response.status, response.statusText);
                
                // Intentar leer el texto de la respuesta para debug
                const responseText = await response.text();
                console.error('📄 Response text:', responseText.substring(0, 200));
                
                return false;
            }

            const data = await response.json();
            console.log('📦 Response data:', data);

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                this.isAuthenticated = true;
                
                localStorage.setItem('auth_token', this.token);
                this.updateUI();
                this.updateUserDisplay(); // NUEVO: Mostrar avatar/email
                console.log('✅ Login successful:', this.user.name);
                return true;
            } else {
                console.error('❌ Login failed:', data.error);
                return false;
            }
        } catch (error) {
            console.error('🚨 Login error:', error);
            return false;
        }
    }

    // NUEVO: Método para manejar tokens de Google reales
    async loginWithGoogleToken(googleIdToken) {
        try {
            console.log('🔐 Processing Google ID token...');
            
            const response = await fetch(`${getApiBaseUrl()}/api/auth/google`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ googleIdToken: googleIdToken })
            });

            console.log('📡 Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Google login failed:', errorText);
                return false;
            }

            const data = await response.json();
            console.log('📦 Google login response:', data);

            if (data.success) {
                this.token = data.token;
                this.user = data.user;
                this.isAuthenticated = true;
                
                localStorage.setItem('auth_token', this.token);
                this.updateUI();
                
                // Mostrar avatar y email si están disponibles
                this.updateUserDisplay();
                
                console.log('✅ Google login successful:', this.user.name, this.user.email);
                return true;
            } else {
                console.error('❌ Google login failed:', data.error);
                return false;
            }
        } catch (error) {
            console.error('🚨 Google login error:', error);
            return false;
        }
    }

    // Para desarrollo - login rápido
    async devLogin() {
        console.log('🛠️ Development login...');
        return await this.loginWithGoogle('dev-token');
    }

    logout() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        localStorage.removeItem('auth_token');
        this.updateUI();
        console.log('👋 Logged out');
    }

    updateUI() {
        const loginSection = document.getElementById('loginSection');
        const gameSection = document.getElementById('gameSection');
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        const devLoginBtn = document.getElementById('devLoginBtn');
        
        if (this.isAuthenticated && this.user) {
            if (loginSection) loginSection.style.display = 'none';
            if (gameSection) gameSection.style.display = 'block';
            if (userName) userName.textContent = this.user.name;
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (googleLoginBtn) googleLoginBtn.style.display = 'none';
            if (devLoginBtn) devLoginBtn.style.display = 'none';
            this.updateBalanceDisplay();
            this.updateUserDisplay();
            console.log('🎮 UI updated for authenticated user');
        } else {
            // Siempre mostrar el dashboard, pero con datos básicos
            if (loginSection) loginSection.style.display = 'none';
            if (gameSection) gameSection.style.display = 'block';
            if (userName) userName.textContent = 'Usuario';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (googleLoginBtn) googleLoginBtn.style.display = 'block';
            if (devLoginBtn) devLoginBtn.style.display = 'block';
            this.showBasicUserData();
            console.log('🔒 UI updated for guest user');
        }
    }

    updateBalanceDisplay() {
        if (this.user) {
            const availableBalance = document.getElementById('availableBalance');
            const lockedBalance = document.getElementById('lockedBalance');
            
            if (availableBalance) {
                availableBalance.textContent = this.user.balance_available.toFixed(2);
            }
            if (lockedBalance) {
                lockedBalance.textContent = this.user.balance_locked.toFixed(2);
            }
            
            console.log('💰 Balance updated:', {
                available: this.user.balance_available,
                locked: this.user.balance_locked
            });
        }
    }

    // NUEVO: Método para actualizar el display del usuario (avatar y email)
    updateUserDisplay() {
        if (this.user) {
            // Actualizar avatar
            const userAvatar = document.getElementById('userAvatar');
            const userEmail = document.getElementById('userEmail');
            
            if (userAvatar && this.user.avatar) {
                userAvatar.src = this.user.avatar;
                userAvatar.style.display = 'block';
                console.log('🖼️ User avatar updated:', this.user.avatar);
            }
            
            if (userEmail && this.user.email) {
                userEmail.textContent = this.user.email;
                console.log('📧 User email updated:', this.user.email);
            }
        }
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    // Método para mostrar datos básicos cuando no hay sesión
    showBasicUserData() {
        const availableBalance = document.getElementById('availableBalance');
        const userAvatar = document.getElementById('userAvatar');
        
        // Mostrar balance básico
        if (availableBalance) {
            availableBalance.textContent = '0.00';
        }
        
        // Ocultar avatar
        if (userAvatar) {
            userAvatar.style.display = 'none';
        }
        
        console.log('👤 Showing basic user data for guest user');
    }
}

console.log('✅ AuthManager loaded');