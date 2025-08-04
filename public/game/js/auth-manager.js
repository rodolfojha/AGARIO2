// public/game/js/auth-manager.js - Con debugging mejorado

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
                const response = await fetch('/api/auth/verify', {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    this.user = data.user;
                    this.isAuthenticated = true;
                    this.updateUI();
                    console.log('✅ Token verified, user logged in');
                } else {
                    console.log('❌ Token expired, logging out');
                    this.logout();
                }
            } catch (error) {
                console.error('Auth verification failed:', error);
                this.logout();
            }
        }
    }

    async loginWithGoogle(googleToken) {
        try {
            console.log('🔗 Attempting login with token:', googleToken);
            
            const response = await fetch('/api/auth/google', {
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
        
        if (this.isAuthenticated && this.user) {
            if (loginSection) loginSection.style.display = 'none';
            if (gameSection) gameSection.style.display = 'block';
            if (userName) userName.textContent = this.user.name;
            this.updateBalanceDisplay();
            console.log('🎮 UI updated for authenticated user');
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (gameSection) gameSection.style.display = 'none';
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

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

console.log('✅ AuthManager loaded');