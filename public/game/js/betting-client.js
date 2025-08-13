// Helper function para obtener la URL base de la API
function getApiBaseUrl() {
    return window.location.hostname === 'localhost' ? 
        'http://localhost:3000' : 
        'https://back.pruebatupanel.com';
}

class BettingClient {
    constructor(authManager) {
        this.auth = authManager;
        this.currentGame = null;
        this.currentValue = 0;
    }

    async refreshBalance() {
        if (!this.auth.isAuthenticated) return;

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/user/balance`, {
                headers: this.auth.getAuthHeaders()
            });

            const data = await response.json();
            if (data.success) {
                this.auth.user.balance_available = data.balance.available;
                this.auth.user.balance_locked = data.balance.locked;
                this.auth.updateBalanceDisplay();
            }
        } catch (error) {
            console.error('Failed to refresh balance:', error);
        }
    }

    async startGame(betAmount) {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/game/start`, {
                method: 'POST',
                headers: this.auth.getAuthHeaders(),
                body: JSON.stringify({ betAmount })
            });

            const data = await response.json();
            
            if (data.success) {
                this.currentGame = data.game;
                this.currentValue = data.game.current_value;
                
                // Actualizar balance en UI
                this.auth.user.balance_available = data.balance.available;
                this.auth.user.balance_locked = data.balance.locked;
                this.auth.updateBalanceDisplay();
                
                // Mostrar botón de cash out en el juego
                this.showCashOutButton();
                
                return data.game;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Failed to start game:', error);
            this.showError(error.message);
            return null;
        }
    }

    async cashOut() {
        if (!this.currentGame) return;

        try {
            const response = await fetch(`${getApiBaseUrl()}/api/game/cashout`, {
                method: 'POST',
                headers: this.auth.getAuthHeaders(),
                body: JSON.stringify({
                    gameId: this.currentGame.id,
                    currentValue: this.currentValue
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Actualizar balance
                this.auth.user.balance_available = data.balance.available;
                this.auth.user.balance_locked = data.balance.locked;
                this.auth.updateBalanceDisplay();
                
                // Mostrar resultado del cash out
                this.showCashOutResult(data.cashout);
                
                // Limpiar juego actual
                this.currentGame = null;
                this.currentValue = 0;
                this.hideCashOutButton();
                
                return data.cashout;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Cash out failed:', error);
            this.showError(error.message);
            return null;
        }
    }

    updateGameValue(newValue) {
        console.log('💰 Updating game value:', { old: this.currentValue, new: newValue });
        this.currentValue = newValue;
        this.updateValueDisplay();
    }

    showCashOutButton() {
        const cashOutBtn = document.getElementById('cashOutBtn');
        if (cashOutBtn) {
            cashOutBtn.style.display = 'block';
            cashOutBtn.onclick = () => this.showCashOutModal();
        }
    }

    hideCashOutButton() {
        const cashOutBtn = document.getElementById('cashOutBtn');
        if (cashOutBtn) {
            cashOutBtn.style.display = 'none';
        }
    }

    showCashOutModal() {
        console.log('🔍 showCashOutModal called');
        console.log('🔍 currentValue:', this.currentValue);
        
        const fee = this.currentValue * 0.1;
        const netAmount = this.currentValue * 0.9;
        
        const currentValueEl = document.getElementById('currentValue');
        const cashOutAmountEl = document.getElementById('cashOutAmount');
        const feeAmountEl = document.getElementById('feeAmount');
        const modalEl = document.getElementById('cashOutModal');
        
        console.log('🔍 DOM elements found:');
        console.log('  - currentValue:', !!currentValueEl);
        console.log('  - cashOutAmount:', !!cashOutAmountEl);
        console.log('  - feeAmount:', !!feeAmountEl);
        console.log('  - cashOutModal:', !!modalEl);
        
        if (currentValueEl) currentValueEl.textContent = (this.currentValue || 0).toFixed(2);
        if (cashOutAmountEl) cashOutAmountEl.textContent = (netAmount || 0).toFixed(2);
        if (feeAmountEl) feeAmountEl.textContent = (fee || 0).toFixed(2);
        if (modalEl) {
            modalEl.style.display = 'block';
            console.log('✅ Modal should be visible now');
        } else {
            console.error('❌ Modal element not found!');
        }
    }

    updateValueDisplay() {
        const valueDisplay = document.getElementById('currentValueDisplay');
        if (valueDisplay && this.currentGame) {
            const roi = ((this.currentValue / this.currentGame.bet_amount - 1) * 100);
            valueDisplay.innerHTML = `
                <span>Valor: ${(this.currentValue || 0).toFixed(2)}</span>
                <span class="${roi >= 0 ? 'profit' : 'loss'}">
                    ROI: ${roi >= 0 ? '+' : ''}${(roi || 0).toFixed(1)}%
                </span>
            `;
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showCashOutResult(cashout) {
        const resultDiv = document.getElementById('cashOutResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <h3>Cash Out Exitoso!</h3>
                <p>Valor original: ${cashout.original_value}</p>
                <p>Recibido: ${cashout.net_amount}</p>
                <p>ROI: ${cashout.roi}%</p>
            `;
            resultDiv.style.display = 'block';
            setTimeout(() => {
                resultDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Para desarrollo - agregar balance de prueba
    async addTestBalance(amount = 50) {
        try {
            const response = await fetch(`${getApiBaseUrl()}/api/user/balance`, {
                method: 'POST',
                headers: this.auth.getAuthHeaders(),
                body: JSON.stringify({ amount })
            });

            const data = await response.json();
            if (data.success) {
                this.auth.user.balance_available = data.balance.available;
                this.auth.user.balance_locked = data.balance.locked;
                this.auth.updateBalanceDisplay();
                console.log(`Added ${amount} to balance`);
            }
        } catch (error) {
            console.error('Failed to add test balance:', error);
        }
    }
}