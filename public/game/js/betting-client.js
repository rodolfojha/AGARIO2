// Helper function para obtener la URL base de la API
function getApiBaseUrl() {
    return window.location.hostname === 'localhost' ? 
        'http://localhost:3000' : 
        `http://${window.location.hostname}`;
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
            console.log('🎮 Starting game with bet amount:', betAmount);
            console.log('🔑 Auth headers:', this.auth.getAuthHeaders());
            
            const response = await fetch(`${getApiBaseUrl()}/api/game/start`, {
                method: 'POST',
                headers: this.auth.getAuthHeaders(),
                body: JSON.stringify({ betAmount })
            });

            console.log('📡 Response status:', response.status);
            const data = await response.json();
            console.log('📦 Response data:', data);
            
            if (data.success) {
                this.currentGame = data.game;
                this.currentValue = data.game.current_value;
                
                // Actualizar balance en UI de forma segura
                if (data.balance && typeof data.balance.available !== 'undefined') {
                    // Verificar que this.auth.user existe antes de actualizar
                    if (this.auth && this.auth.user) {
                        this.auth.user.balance_available = data.balance.available;
                        this.auth.user.balance_locked = data.balance.locked || 0;
                        console.log('💰 Balance updated from server:', data.balance);
                        this.auth.updateBalanceDisplay();
                    } else {
                        console.log('⚠️ Auth user not available, updating global balance');
                        // Actualizar balance global si no hay auth
                        if (typeof window !== 'undefined' && window.devAuthManager) {
                            window.devAuthManager.user.balance_available = data.balance.available;
                            window.devAuthManager.user.balance_locked = data.balance.locked || 0;
                            window.devAuthManager.updateBalanceDisplay();
                        }
                    }
                } else {
                    console.log('ℹ️ No balance data in response, keeping current balance');
                }
                
                // Mostrar botón de cash out en el juego
                this.showCashOutButton();
                
                console.log('✅ Game started successfully:', data.game);
                return data.game;
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Failed to start game:', error);
            this.showError(error.message);
            return null;
        }
    }

    async cashOut() {
        console.log('💰 Cash out called with:', {
            currentGame: this.currentGame,
            currentValue: this.currentValue,
            globalGameValue: typeof global !== 'undefined' ? global.gameValue : 'undefined'
        });
        
        if (!this.currentGame) {
            console.error('❌ No current game');
            return null;
        }

        // Usar global.gameValue si currentValue no está disponible
        const valueToUse = this.currentValue || (typeof global !== 'undefined' ? global.gameValue : 0);
        
        if (!valueToUse || valueToUse <= 0) {
            console.error('❌ No valid current value');
            return null;
        }

        try {
            const requestData = {
                gameId: this.currentGame.id,
                currentValue: valueToUse
            };
            
            console.log('📤 Sending cash out request:', requestData);
            
            const response = await fetch(`${getApiBaseUrl()}/api/game/cashout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.auth.getAuthHeaders()
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();
            
            if (data.success) {
                // Actualizar balance de forma segura
                if (data.balance && typeof data.balance.available !== 'undefined') {
                    // Verificar que this.auth.user existe antes de actualizar
                    if (this.auth && this.auth.user) {
                        this.auth.user.balance_available = data.balance.available;
                        this.auth.user.balance_locked = data.balance.locked || 0;
                        console.log('💰 Balance updated from cash out:', data.balance);
                        this.auth.updateBalanceDisplay();
                    } else {
                        console.log('⚠️ Auth user not available, updating global balance');
                        // Actualizar balance global si no hay auth
                        if (typeof window !== 'undefined' && window.devAuthManager) {
                            window.devAuthManager.user.balance_available = data.balance.available;
                            window.devAuthManager.user.balance_locked = data.balance.locked || 0;
                            window.devAuthManager.updateBalanceDisplay();
                        }
                    }
                } else {
                    console.log('ℹ️ No balance data in cash out response');
                }
                
                // Mostrar resultado del cash out
                this.showCashOutResult(data.cashout);
                
                // Limpiar juego actual
                this.currentGame = null;
                this.currentValue = 0;
                this.hideCashOutButton();
                
                console.log('✅ Cash out successful:', data.cashout);
                return data.cashout;
            } else {
                throw new Error(data.error || 'Unknown cash out error');
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
        
        // También actualizar global.gameValue para mantener sincronización
        if (typeof global !== 'undefined') {
            global.gameValue = newValue;
        }
        
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
        
        // Crear modal dinámicamente si no existe
        let modalEl = document.getElementById('cashOutModal');
        if (!modalEl) {
            modalEl = this.createCashOutModal();
        }
        
        // Actualizar valores en el modal
        const currentValueEl = modalEl.querySelector('.current-value');
        const cashOutAmountEl = modalEl.querySelector('.cash-out-amount');
        const feeAmountEl = modalEl.querySelector('.fee-amount');
        
        if (currentValueEl) currentValueEl.textContent = '$' + (this.currentValue || 0).toFixed(2);
        if (cashOutAmountEl) cashOutAmountEl.textContent = '$' + (netAmount || 0).toFixed(2);
        if (feeAmountEl) feeAmountEl.textContent = '$' + (fee || 0).toFixed(2);
        
        // Mostrar modal
        modalEl.style.display = 'block';
        console.log('✅ Cash out modal displayed');
    }

    createCashOutModal() {
        const modal = document.createElement('div');
        modal.id = 'cashOutModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        modal.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #1a1a1a;
                color: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                min-width: 400px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            ">
                <h2 style="color: #FFD700; margin-bottom: 20px;">💰 Cash Out</h2>
                
                <div style="margin: 20px 0; font-size: 18px;">
                    <p><strong>Valor Actual:</strong> <span class="current-value" style="color: #FFD700;">$0.00</span></p>
                    <p><strong>Recibirás:</strong> <span class="cash-out-amount" style="color: #2ecc71;">$0.00</span></p>
                    <p><strong>Fee (10%):</strong> <span class="fee-amount" style="color: #e74c3c;">$0.00</span></p>
                </div>
                
                <div style="margin: 30px 0;">
                    <div id="countdownDisplay" style="
                        font-size: 24px;
                        color: #FFD700;
                        margin-bottom: 20px;
                        font-weight: bold;
                    ">⏰ Esperando 5 segundos...</div>
                    
                    <button id="confirmCashOut" style="
                        background: linear-gradient(45deg, #2ecc71, #27ae60);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-right: 10px;
                        display: none;
                    ">✅ Confirmar Cash Out</button>
                    
                    <button id="cancelCashOut" style="
                        background: linear-gradient(45deg, #e74c3c, #c0392b);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                    ">❌ Cancelar</button>
                </div>
            </div>
        `;
        
        // Agregar event listeners
        const confirmBtn = modal.querySelector('#confirmCashOut');
        const cancelBtn = modal.querySelector('#cancelCashOut');
        const countdownDisplay = modal.querySelector('#countdownDisplay');
        
        // Iniciar conteo de 5 segundos
        let countdown = 5;
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownDisplay.textContent = `⏰ Esperando ${countdown} segundos...`;
            } else {
                countdownDisplay.textContent = '✅ ¡Listo para Cash Out!';
                confirmBtn.style.display = 'inline-block';
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        confirmBtn.onclick = async () => {
            console.log('💰 Confirm cash out clicked');
            modal.style.display = 'none';
            const result = await this.cashOut();
            if (result) {
                this.showSuccessMessage('✅ Cash out exitoso! Recibiste $' + result.net_amount);
            }
        };
        
        cancelBtn.onclick = () => {
            console.log('❌ Cancel cash out clicked');
            clearInterval(countdownInterval);
            modal.style.display = 'none';
        };
        
        // Cerrar modal al hacer clic fuera
        modal.onclick = (e) => {
            if (e.target === modal) {
                clearInterval(countdownInterval);
                modal.style.display = 'none';
            }
        };
        
        // Cerrar modal al hacer clic fuera
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
        
        document.body.appendChild(modal);
        console.log('✅ Cash out modal created');
        return modal;
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
        this.showMessage(message, 'error');
    }

    showSuccessMessage(message) {
        this.showMessage(message, 'success');
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
            z-index: 10001;
            max-width: 400px;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        
        if (type === 'success') {
            notification.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
        } else if (type === 'error') {
            notification.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
        } else {
            notification.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    showCashOutResult(cashout) {
        // Mostrar resultado como notificación
        const message = `💰 Cash Out Exitoso!\nValor: $${cashout.original_value}\nRecibido: $${cashout.net_amount}\nROI: ${cashout.roi}%`;
        this.showSuccessMessage(message);
        
        // También mostrar en consola para debug
        console.log('🎉 Cash out result:', cashout);
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