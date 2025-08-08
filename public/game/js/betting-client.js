class BettingClient {
    constructor(authManager) {
        this.auth = authManager;
        this.currentGame = null;
        this.currentValue = 0;
    }

    async refreshBalance() {
        if (!this.auth.isAuthenticated) return;

        try {
            const response = await fetch('/api/user/balance', {
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
            const response = await fetch('/api/game/start', {
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
            console.log('💸 Starting cash out process...');
            const response = await fetch('/api/game/cashout', {
                method: 'POST',
                headers: this.auth.getAuthHeaders(),
                body: JSON.stringify({
                    gameId: this.currentGame.id,
                    currentValue: this.currentValue
                })
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Cash out API call successful:', data);
                
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
                
                // NUEVO: Llamar returnToMenu para salir del juego
                console.log('🚪 Calling returnToMenu to exit game...');
                if (typeof returnToMenu === 'function') {
                    returnToMenu();
                    console.log('✅ returnToMenu called successfully');
                } else {
                    console.error('❌ returnToMenu function not found - trying alternative approach');
                    // Intentar llamar la función si está disponible globalmente
                    if (window.returnToMenu) {
                        window.returnToMenu();
                    } else {
                        console.error('❌ returnToMenu not available globally');
                    }
                }
                
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
        this.currentValue = newValue;
        this.updateValueDisplay();
    }

    showCashOutButton() {
        const cashOutBtn = document.getElementById('cashOutBtn');
        if (cashOutBtn) {
            cashOutBtn.style.display = 'block';
            cashOutBtn.onclick = () => this.showCashOutModalAlternative(); // Usar método alternativo
        }
    }

    hideCashOutButton() {
        const cashOutBtn = document.getElementById('cashOutBtn');
        if (cashOutBtn) {
            cashOutBtn.style.display = 'none';
        }
    }

    showCashOutModal() {
        console.log('💰 showCashOutModal called - currentValue:', this.currentValue);
        
        const fee = this.currentValue * 0.1;
        const netAmount = this.currentValue * 0.9;
        
        const currentValueElement = document.getElementById('currentValue');
        const cashOutAmountElement = document.getElementById('cashOutAmount');
        const feeAmountElement = document.getElementById('feeAmount');
        const cashOutModalElement = document.getElementById('cashOutModal');
        
        console.log('🔍 Modal elements found:', {
            currentValue: !!currentValueElement,
            cashOutAmount: !!cashOutAmountElement,
            feeAmount: !!feeAmountElement,
            cashOutModal: !!cashOutModalElement
        });
        
        if (currentValueElement) {
            currentValueElement.textContent = this.currentValue.toFixed(2);
        }
        if (cashOutAmountElement) {
            cashOutAmountElement.textContent = netAmount.toFixed(2);
        }
        if (feeAmountElement) {
            feeAmountElement.textContent = fee.toFixed(2);
        }
        if (cashOutModalElement) {
            cashOutModalElement.style.display = 'block';
            console.log('✅ Cash out modal displayed');
        } else {
            console.error('❌ Cash out modal element not found');
        }
    }

    // NUEVO MÉTODO ALTERNATIVO - Crear modal dinámicamente
    showCashOutModalAlternative() {
        console.log('🔄 showCashOutModalAlternative called - currentValue:', this.currentValue);
        
        // Remover modal existente si hay uno
        const existingModal = document.getElementById('cashOutModalAlternative');
        if (existingModal) {
            existingModal.remove();
        }
        
        const fee = this.currentValue * 0.1;
        const netAmount = this.currentValue * 0.9;
        
        // Crear modal dinámicamente
        const modalHTML = `
            <div id="cashOutModalAlternative" style="
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background: rgba(0,0,0,0.9); 
                z-index: 9999; 
                display: flex; 
                align-items: center; 
                justify-content: center;
            ">
                <div style="
                    background: #2c3e50; 
                    color: white; 
                    padding: 40px; 
                    border-radius: 20px; 
                    text-align: center; 
                    min-width: 450px; 
                    box-shadow: 0 15px 40px rgba(0,0,0,0.7);
                    border: 2px solid #f39c12;
                ">
                    <h3 style="color: #f39c12; margin-bottom: 25px; font-size: 28px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                        💰 Cash Out
                    </h3>
                    
                    <div style="
                        font-size: 24px; 
                        margin: 25px 0; 
                        padding: 20px; 
                        background: rgba(255,255,255,0.1); 
                        border-radius: 15px;
                        border: 1px solid rgba(255,255,255,0.2);
                    ">
                        Valor actual: <strong style="color: #f39c12; font-size: 28px;">$${this.currentValue.toFixed(2)}</strong>
                    </div>
                    
                    <hr style="border: 2px solid rgba(255,255,255,0.3); margin: 25px 0;">
                    
                    <div style="margin: 20px 0; font-size: 18px;">
                        <p style="margin: 10px 0;">
                            Recibirás: <strong style="color: #2ecc71; font-size: 22px;">$${netAmount.toFixed(2)}</strong> (90%)
                        </p>
                        <p style="margin: 10px 0;">
                            Fee del sistema: <span style="color: #e74c3c; font-size: 20px;">$${fee.toFixed(2)}</span> (10%)
                        </p>
                    </div>
                    
                    <hr style="border: 2px solid rgba(255,255,255,0.3); margin: 25px 0;">
                    
                    <div style="display: flex; gap: 20px; justify-content: center; margin-top: 30px;">
                        <button id="confirmCashOutAlt" style="
                            background: linear-gradient(45deg, #2ecc71, #27ae60); 
                            color: white; 
                            border: none; 
                            padding: 15px 30px; 
                            border-radius: 10px; 
                            cursor: pointer; 
                            font-weight: bold; 
                            font-size: 18px;
                            box-shadow: 0 5px 15px rgba(46, 204, 113, 0.4);
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            ✅ Confirmar Cash Out
                        </button>
                        
                        <button id="cancelCashOutAlt" style="
                            background: linear-gradient(45deg, #e74c3c, #c0392b); 
                            color: white; 
                            border: none; 
                            padding: 15px 30px; 
                            border-radius: 10px; 
                            cursor: pointer; 
                            font-weight: bold; 
                            font-size: 18px;
                            box-shadow: 0 5px 15px rgba(231, 76, 60, 0.4);
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                            ❌ Continuar Jugando
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar modal en el DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Agregar event listeners
        const confirmBtn = document.getElementById('confirmCashOutAlt');
        const cancelBtn = document.getElementById('cancelCashOutAlt');
        
        if (confirmBtn) {
            confirmBtn.onclick = async () => {
                console.log('💸 Processing cash out (alternative method)...');
                console.log('🔍 Current game state:', {
                    currentGame: this.currentGame,
                    currentValue: this.currentValue,
                    authManager: !!this.auth
                });
                
                document.getElementById('cashOutModalAlternative').remove();
                
                const result = await this.cashOut();
                if (result) {
                    console.log('✅ Cash out successful:', result);
                    console.log('🔄 Waiting for returnToMenu to complete...');
                } else {
                    console.error('❌ Cash out failed - no result returned');
                }
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                console.log('❌ Cash out cancelled (alternative method)');
                document.getElementById('cashOutModalAlternative').remove();
            };
        }
        
        console.log('✅ Alternative cash out modal created and displayed');
    }

    updateValueDisplay() {
        const valueDisplay = document.getElementById('currentValueDisplay');
        if (valueDisplay && this.currentGame) {
            const roi = ((this.currentValue / this.currentGame.bet_amount - 1) * 100);
            valueDisplay.innerHTML = `
                <span>Valor: ${this.currentValue.toFixed(2)}</span>
                <span class="${roi >= 0 ? 'profit' : 'loss'}">
                    ROI: ${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%
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
            const response = await fetch('/api/user/balance', {
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