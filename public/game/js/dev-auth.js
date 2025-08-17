// dev-auth.js - Sistema de autenticación simple para desarrollo

class DevAuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.token = null;
        this.init();
    }

    init() {
        console.log('🛠️ DevAuthManager initialized');
        this.setupDevLogin();
        this.checkExistingSession();
        this.setupAutoBalanceReload();
    }

    setupDevLogin() {
        // Crear botón de login dev si no existe
        const existingButton = document.getElementById('devLoginBtn');
        if (!existingButton) {
            const loginContainer = document.querySelector('.login-buttons') || document.getElementById('loginButtons');
            if (loginContainer) {
                const devButton = document.createElement('button');
                devButton.id = 'devLoginBtn';
                devButton.className = 'dev-login-btn';
                devButton.innerHTML = '🛠️ DEV LOGIN';
                devButton.style.cssText = `
                    background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    margin: 10px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    transition: all 0.3s ease;
                `;
                
                devButton.onmouseover = () => {
                    devButton.style.transform = 'translateY(-2px)';
                    devButton.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                };
                
                devButton.onmouseout = () => {
                    devButton.style.transform = 'translateY(0)';
                    devButton.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                };
                
                devButton.onclick = () => this.devLogin();
                loginContainer.appendChild(devButton);
                console.log('✅ Dev login button created');
            }
        }
    }

    setupAutoBalanceReload() {
        // Recargar balance cuando la página se enfoque (usuario regresa a la pestaña)
        window.addEventListener('focus', () => {
            if (this.isAuthenticated && this.user) {
                console.log('🔄 Page focused, reloading balance...');
                this.reloadBalance();
            }
        });
        
        // Recargar balance cuando la página se vuelve visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAuthenticated && this.user) {
                console.log('🔄 Page visible, reloading balance...');
                this.reloadBalance();
            }
        });
        
        // Recargar balance cada 30 segundos si está autenticado
        setInterval(() => {
            if (this.isAuthenticated && this.user) {
                console.log('🔄 Auto-reloading balance...');
                this.reloadBalance();
            }
        }, 30000); // 30 segundos
    }

    async devLogin() {
        try {
            console.log('🛠️ Dev login initiated...');
            
            // Cargar balance real desde el servidor
            let balanceAvailable = 450; // Balance por defecto
            let balanceLocked = 0;
            
            try {
                const response = await fetch('/api/user/balance', {
                    headers: {
                        'Authorization': 'Bearer dev-token',
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.balance) {
                        balanceAvailable = data.balance.available;
                        balanceLocked = data.balance.locked;
                        console.log('💰 Balance loaded from server:', data.balance);
                    }
                }
            } catch (error) {
                console.log('⚠️ Could not load balance from server, using default:', error);
            }
            
            // Crear usuario dev con balance real del servidor
            const devUser = {
                id: 'dev-user-123',
                name: 'Dev User',
                email: 'dev@example.com',
                balance_available: balanceAvailable,
                balance_locked: balanceLocked,
                avatar: 'https://placeholder.com/50/FF6B6B/FFFFFF?text=D',
                is_dev: true,
                is_admin: true
            };

            // Simular token de autenticación
            const devToken = 'dev-jwt-token-' + Date.now();
            
            // Guardar en localStorage
            localStorage.setItem('dev_auth_token', devToken);
            localStorage.setItem('dev_user_data', JSON.stringify(devUser));
            
            // Actualizar estado
            this.token = devToken;
            this.user = devUser;
            this.isAuthenticated = true;
            
            console.log('✅ Dev login successful:', devUser);
            
            // Actualizar UI
            this.updateUI();
            
            // IMPORTANTE: Sincronizar con el sistema de apuestas
            this.syncWithBettingSystem();
            
            // Mostrar mensaje de éxito
            this.showMessage('🛠️ Dev login successful! Balance: $' + devUser.balance_available, 'success');
            
            // Crear botón de logout específico para dev si no existe
            this.createDevLogoutButton();
            
            // Crear botón para recargar balance
            this.createReloadBalanceButton();
            
            return true;
            
        } catch (error) {
            console.error('❌ Dev login failed:', error);
            this.showMessage('❌ Dev login failed: ' + error.message, 'error');
            return false;
        }
    }

    checkExistingSession() {
        const token = localStorage.getItem('dev_auth_token');
        const userData = localStorage.getItem('dev_user_data');
        
        if (token && userData) {
            try {
                this.token = token;
                this.user = JSON.parse(userData);
                this.isAuthenticated = true;
                
                // IMPORTANTE: Recargar balance del servidor al restaurar sesión
                this.reloadBalance().then(() => {
                    this.updateUI();
                    // Sincronizar con el sistema de apuestas
                    this.syncWithBettingSystem();
                    console.log('✅ Existing dev session restored with updated balance');
                });
                
            } catch (error) {
                console.error('❌ Error restoring dev session:', error);
                this.logout();
            }
        }
    }

    updateUI() {
        if (this.isAuthenticated && this.user) {
            // Ocultar botones de login
            const loginButtons = document.querySelector('.login-buttons');
            if (loginButtons) {
                loginButtons.style.display = 'none';
            }
            
            // Mostrar información del usuario
            this.updateUserInfo();
            this.updateBalanceDisplay();
            
            // Mostrar botón de logout
            this.showLogoutButton();
            
            // Crear botón para recargar balance
            this.createReloadBalanceButton();
            
            // Crear botón de debug
            this.createDebugButton();
            
            console.log('🎮 Dev UI updated for authenticated user');
        } else {
            // Mostrar botones de login
            const loginButtons = document.querySelector('.login-buttons');
            if (loginButtons) {
                loginButtons.style.display = 'flex';
            }
            
            // Limpiar información del usuario
            this.clearUserInfo();
            
            // Ocultar botón de logout
            this.hideLogoutButton();
            
            console.log('🔒 Dev UI updated for guest user');
        }
    }

    updateUserInfo() {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userName) userName.textContent = this.user.name;
        if (userEmail) userEmail.textContent = this.user.email;
        if (userAvatar) {
            userAvatar.src = this.user.avatar;
            userAvatar.style.display = 'block';
        }
    }

    updateBalanceDisplay() {
        const availableBalance = document.getElementById('availableBalance');
        const lockedBalance = document.getElementById('lockedBalance');
        
        if (availableBalance) {
            availableBalance.textContent = (this.user.balance_available || 0).toFixed(2);
        }
        if (lockedBalance) {
            lockedBalance.textContent = (this.user.balance_locked || 0).toFixed(2);
        }
        
        console.log('💰 Dev balance updated:', {
            available: this.user.balance_available || 0,
            locked: this.user.balance_locked || 0
        });
    }

    clearUserInfo() {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');
        const availableBalance = document.getElementById('availableBalance');
        const lockedBalance = document.getElementById('lockedBalance');
        
        if (userName) userName.textContent = 'Invitado';
        if (userEmail) userEmail.textContent = '';
        if (userAvatar) userAvatar.style.display = 'none';
        if (availableBalance) availableBalance.textContent = '0.00';
        if (lockedBalance) lockedBalance.textContent = '0.00';
    }

    logout() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        
        localStorage.removeItem('dev_auth_token');
        localStorage.removeItem('dev_user_data');
        
        // Ocultar botón de logout dev
        const devLogoutBtn = document.getElementById('devLogoutBtn');
        if (devLogoutBtn) {
            devLogoutBtn.remove();
        }
        
        // Ocultar botón de recargar balance
        const reloadBalanceBtn = document.getElementById('reloadBalanceBtn');
        if (reloadBalanceBtn) {
            reloadBalanceBtn.remove();
        }
        
        // Ocultar botón de debug
        const debugBtn = document.getElementById('debugDevAuthBtn');
        if (debugBtn) {
            debugBtn.remove();
        }
        
        this.updateUI();
        console.log('👋 Dev user logged out');
    }

    showMessage(message, type = 'info') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        if (type === 'success') {
            notification.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(45deg, #f44336, #da190b)';
        } else {
            notification.style.background = 'linear-gradient(45deg, #2196F3, #0b7dda)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Método para recargar balance
    async reloadBalance() {
        if (!this.isAuthenticated || !this.user) {
            console.log('⚠️ Not authenticated, skipping balance reload');
            return;
        }
        
        try {
            console.log('🔄 Reloading balance from server...');
            const response = await fetch('/api/user/balance', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.balance) {
                    // Actualizar balance en memoria
                    this.user.balance_available = data.balance.available;
                    this.user.balance_locked = data.balance.locked;
                    
                    // IMPORTANTE: Actualizar también el localStorage
                    localStorage.setItem('dev_user_data', JSON.stringify(this.user));
                    
                    this.updateBalanceDisplay();
                    console.log('💰 Balance reloaded from server:', data.balance);
                    
                    // Solo mostrar mensaje si se llama manualmente
                    if (arguments.length > 0 && arguments[0] === true) {
                        this.showMessage('💰 Balance updated!', 'success');
                    }
                }
            }
        } catch (error) {
            console.log('⚠️ Could not reload balance from server:', error);
            // Si no hay conexión al servidor, usar balance local
            this.updateBalanceDisplay();
        }
    }

    createDevLogoutButton() {
        // Crear botón de logout específico para dev si no existe
        let devLogoutBtn = document.getElementById('devLogoutBtn');
        if (!devLogoutBtn) {
            devLogoutBtn = document.createElement('button');
            devLogoutBtn.id = 'devLogoutBtn';
            devLogoutBtn.className = 'dev-logout-btn';
            devLogoutBtn.innerHTML = '🚪 DEV LOGOUT';
            devLogoutBtn.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #FF6B6B, #FF8E53);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-weight: bold;
                cursor: pointer;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                transition: all 0.3s ease;
            `;
            
            devLogoutBtn.onmouseover = () => {
                devLogoutBtn.style.transform = 'scale(1.05)';
                devLogoutBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
            };
            
            devLogoutBtn.onmouseout = () => {
                devLogoutBtn.style.transform = 'scale(1)';
                devLogoutBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            };
            
            devLogoutBtn.onclick = () => this.logout();
            document.body.appendChild(devLogoutBtn);
            console.log('✅ Dev logout button created');
        }
    }
    
    createReloadBalanceButton() {
        // Remover botón existente si existe
        const existingBtn = document.getElementById('reloadBalanceBtn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const reloadBtn = document.createElement('button');
        reloadBtn.id = 'reloadBalanceBtn';
        reloadBtn.innerHTML = '🔄 Recargar Balance';
        reloadBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 200px;
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        reloadBtn.onmouseover = () => {
            reloadBtn.style.transform = 'scale(1.05)';
            reloadBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
        };
        
        reloadBtn.onmouseout = () => {
            reloadBtn.style.transform = 'scale(1)';
            reloadBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        };
        
        reloadBtn.onclick = () => this.reloadBalance(true);
        document.body.appendChild(reloadBtn);
        console.log('✅ Reload balance button created');
    }
    
    createDebugButton() {
        // Remover botón existente si existe
        const existingBtn = document.getElementById('debugDevAuthBtn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debugDevAuthBtn';
        debugBtn.innerHTML = '🐛 Debug DevAuth';
        debugBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 350px;
            background: linear-gradient(45deg, #9b59b6, #8e44ad);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        debugBtn.onclick = () => {
            console.log('🐛 Debug button clicked');
            console.log('🔍 Window.devAuthManager:', window.devAuthManager);
            console.log('🔍 DevAuthManager class:', typeof DevAuthManager);
            console.log('🔍 Document readyState:', document.readyState);
            console.log('🔍 All window properties:', Object.keys(window).filter(key => key.includes('Auth')));
            
            if (window.devAuthManager) {
                console.log('✅ DevAuthManager exists and has methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.devAuthManager)));
            } else {
                console.log('❌ DevAuthManager does not exist');
                console.log('🔄 Attempting to create DevAuthManager...');
                try {
                    window.devAuthManager = new DevAuthManager();
                    console.log('✅ DevAuthManager created manually!');
                } catch (error) {
                    console.error('❌ Failed to create DevAuthManager manually:', error);
                }
            }
        };
        
        document.body.appendChild(debugBtn);
        console.log('✅ Debug button created');
    }

    showLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.display = 'block';
            // Configurar logout para nuestro sistema
            logoutBtn.onclick = () => this.logout();
        }
    }

    hideLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.style.display = 'none';
        }
    }

    syncWithBettingSystem() {
        console.log('🔄 Syncing with betting system...');
        console.log('🔑 Dev auth state:', {
            isAuthenticated: this.isAuthenticated,
            token: this.token,
            user: this.user
        });
        
        // Crear un authManager compatible para el betting-client
        const compatibleAuthManager = {
            isAuthenticated: this.isAuthenticated,
            user: this.user,
            token: this.token,
            getAuthHeaders: () => this.getAuthHeaders(),
            updateBalanceDisplay: () => this.updateBalanceDisplay()
        };
        
        console.log('🔧 Compatible authManager created:', compatibleAuthManager);
        
        // Asignar al bettingClient si existe
        if (window.bettingClient) {
            window.bettingClient.auth = compatibleAuthManager;
            console.log('✅ BettingClient auth updated');
        }
        
        // Asignar al authManager global si existe
        if (window.authManager) {
            window.authManager.isAuthenticated = this.isAuthenticated;
            window.authManager.user = this.user;
            window.authManager.token = this.token;
            console.log('✅ Global authManager updated');
        }
        
        // Crear bettingClient si no existe
        if (!window.bettingClient && typeof BettingClient !== 'undefined') {
            window.bettingClient = new BettingClient(compatibleAuthManager);
            console.log('✅ New BettingClient created');
        }
        
        console.log('🔄 Betting system sync complete');
    }

    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }
}

// Inicializar cuando el DOM esté listo
function initializeDevAuthManager() {
    console.log('🚀 initializeDevAuthManager called');
    console.log('🔍 DevAuthManager class available:', typeof DevAuthManager);
    console.log('🔍 Window object available:', typeof window);
    
    try {
        if (typeof DevAuthManager === 'undefined') {
            console.error('❌ DevAuthManager class is not defined!');
            return;
        }
        
        window.devAuthManager = new DevAuthManager();
        console.log('✅ DevAuthManager initialized successfully');
        
        // Verificar que se haya creado correctamente
        if (window.devAuthManager) {
            console.log('🔍 DevAuthManager instance:', window.devAuthManager);
            console.log('🔍 Instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(window.devAuthManager)));
        } else {
            console.error('❌ DevAuthManager instance not created');
        }
    } catch (error) {
        console.error('❌ Error initializing DevAuthManager:', error);
        console.error('❌ Error stack:', error.stack);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDevAuthManager);
} else {
    // Si el DOM ya está listo, inicializar inmediatamente
    initializeDevAuthManager();
}

// También intentar inicializar después de un pequeño delay como respaldo
setTimeout(() => {
    console.log('⏰ Backup initialization timeout triggered');
    console.log('🔍 Current devAuthManager state:', window.devAuthManager);
    
    if (!window.devAuthManager) {
        console.log('🔄 Retrying DevAuthManager initialization...');
        initializeDevAuthManager();
    } else {
        console.log('✅ DevAuthManager already exists, no need to retry');
    }
}, 1000);

console.log('✅ DevAuthManager script loaded');
console.log('🔍 Document readyState:', document.readyState);
console.log('🔍 Window object exists:', typeof window !== 'undefined');
console.log('🔍 DevAuthManager class defined:', typeof DevAuthManager !== 'undefined');
