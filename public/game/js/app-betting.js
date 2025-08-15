// public/game/js/app-betting.js - App principal completo con sistema de apuestas

// Helper function para obtener la URL base de la API
function getApiBaseUrl() {
    return window.location.hostname === 'localhost' ? 
        'http://localhost:3000' : 
        'https://back.pruebatupanel.com';
}

// === INSTANCIAS GLOBALES ===
let authManager, bettingClient;
let socket;

// === VARIABLES GLOBALES COMBINADAS ===
var global = {
    // Keys
    KEY_ESC: 27,
    KEY_ENTER: 13,
    KEY_CHAT: 13,
    KEY_FIREFOOD: 119,
    KEY_SPLIT: 32,
    KEY_LEFT: 37,
    KEY_UP: 38,
    KEY_RIGHT: 39,
    KEY_DOWN: 40,
    
    // Game state
    borderDraw: false,
    mobile: false,
    gameStart: false,
    disconnected: false,
    kicked: false,
    continuity: false,
    startPingTime: 0,
    toggleMassState: 0,
    backgroundColor: '#f2fbff',
    lineColor: '#000000',
    
    // Screen
    screen: {
        width: window.innerWidth,
        height: window.innerHeight
    },
    game: {
        width: 0,
        height: 0
    },
    
    // Player
    playerName: '',
    playerType: '',
    animLoopHandle: null,
    target: { x: 0, y: 0 },
    
    // Betting
    currentBet: 0,
    gameValue: 0,
    socket: null,
    canvas: null,
    chatClient: null,
    foodSides: 10
};

// === VARIABLES DEL JUEGO ===
var playerConfig = {
    border: 6,
    textColor: '#FFFFFF',
    textBorder: '#000000',
    textBorderSize: 3,
    defaultSize: 30
};

var player = {
    id: -1,
    x: global.screen.width / 2,
    y: global.screen.height / 2,
    screenWidth: global.screen.width,
    screenHeight: global.screen.height,
    target: { x: global.screen.width / 2, y: global.screen.height / 2 }
};
global.player = player;

var foods = [];
var viruses = [];
var fireFood = [];
var users = [];
var leaderboard = [];
var target = { x: player.x, y: player.y };
global.target = target;

// Detectar mobile
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
    global.mobile = true;
}

// === INICIALIZACIÓN PRINCIPAL ===
window.onload = async function() {
    console.log('🎮 Initializing Agar.io Betting Platform...');
    
    // Esperar a que las clases estén disponibles
    if (typeof AuthManager === 'undefined' || typeof BettingClient === 'undefined') {
        console.error('❌ AuthManager or BettingClient not loaded');
        return;
    }
    
    // Crear instancias
    authManager = new AuthManager();
    bettingClient = new BettingClient(authManager);
    
    // Hacer accesibles globalmente
    window.authManager = authManager;
    window.bettingClient = bettingClient;
    
    // Inicializar sistema de autenticación
    await authManager.initialize();
    
    // Setup event listeners
    setupEventListeners();
    
    // Si ya está autenticado, cargar balance
    if (authManager.isAuthenticated) {
        await bettingClient.refreshBalance();
    }

    // Inicializar controles del juego
    initializeGameControls();
    
    console.log('✅ Platform initialized');
};

// === EVENT LISTENERS ===
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    const refreshBtn = document.createElement('button');
refreshBtn.textContent = '🔄 Refresh';
refreshBtn.style.position = 'absolute';
refreshBtn.style.top = '10px';
refreshBtn.style.left = '200px';
document.body.appendChild(refreshBtn);
    
    // === AUTH EVENTS ===
    const devLoginBtn = document.getElementById('devLoginBtn');
    if (devLoginBtn) {
        devLoginBtn.onclick = async () => {
            console.log('🔑 Dev login attempt...');
            const success = await authManager.devLogin();
            if (success) {
                console.log('✅ Dev login successful');
                await bettingClient.refreshBalance();
            } else {
                console.log('❌ Dev login failed');
                bettingClient.showError('Login failed');
            }
        };
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            console.log('👋 Logging out...');
            authManager.logout();
            if (socket) {
                socket.disconnect();
            }
        };
    }

    // === BALANCE EVENTS ===
    const addBalanceBtn = document.getElementById('addBalanceBtn');
    console.log('🔍 Checking for addBalanceBtn in app-betting.js:', !!addBalanceBtn);
    if (addBalanceBtn) {
        console.log('✅ Setting up addBalanceBtn onclick handler in app-betting.js');
        addBalanceBtn.onclick = async () => {
            console.log('💳 Add Funds button clicked (app-betting.js handler)');
            
            // Abrir modal de NOWPayments
            const modal = document.getElementById('topUpModal');
            console.log('🔍 Top-up modal found:', !!modal);
            
            if (modal) {
                console.log('✅ Opening top-up modal...');
                modal.style.display = 'block';
                
                console.log('🔄 Loading available currencies...');
                await loadAvailableCurrencies();
                
                console.log('🔄 Setting up modal handlers...');
                setupTopUpModalHandlers();
                
                console.log('✅ Modal setup complete');
            } else {
                console.error('❌ Top-up modal not found in DOM');
            }
        };
    } else {
        console.log('❌ addBalanceBtn not found in app-betting.js');
    }

    // === BET CONTROLS ===
    // Configurar botones de apuesta
    const betButtons = document.querySelectorAll('.bet-btn');
    let currentBetAmount = 1; // Valor por defecto

    betButtons.forEach(button => {
        button.onclick = function() {
            // Remover clase activa de todos los botones
            betButtons.forEach(btn => btn.style.background = '#FFD700');
            
            // Activar el botón seleccionado
            this.style.background = '#FFED4E';
            
            // Obtener el monto del botón
            const betAmount = parseFloat(this.getAttribute('data-bet'));
            currentBetAmount = betAmount;
            
            console.log('💰 Selected bet amount:', betAmount);
            
            // Actualizar el texto del botón JOIN GAME
            const joinGameBtn = document.getElementById('startButton');
            if (joinGameBtn) {
                joinGameBtn.textContent = `▷ JOIN GAME ($${betAmount})`;
            }
        };
    });

    // Activar el primer botón por defecto
    if (betButtons.length > 0) {
        betButtons[0].style.background = '#FFED4E';
    }

    // === GAME EVENTS ===
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.onclick = async () => {
            await handleStartGame();
        };
    }

    const spectateButton = document.getElementById('spectateButton');
    if (spectateButton) {
        spectateButton.onclick = async () => {
            console.log('👁️ Starting spectator mode');
            await startGameWithBetting('spectator', '', null);
        };
    }

    // === CASH OUT EVENTS ===
    const confirmCashOut = document.getElementById('confirmCashOut');
    if (confirmCashOut) {
        confirmCashOut.onclick = async () => {
            document.getElementById('cashOutModal').style.display = 'none';
            console.log('💸 Processing cash out...');
            
            const result = await bettingClient.cashOut();
            if (result) {
                console.log('✅ Cash out successful:', result);
                if (socket) {
                    socket.disconnect();
                }
                returnToMenu();
            }
        };
    }

    const cancelCashOut = document.getElementById('cancelCashOut');
    if (cancelCashOut) {
        cancelCashOut.onclick = () => {
            document.getElementById('cashOutModal').style.display = 'none';
            console.log('❌ Cash out cancelled');
        };
    }

    // === PLAYER NAME INPUT ===
    const playerNameInput = document.getElementById('playerNameInput');
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', function(e) {
            var key = e.which || e.keyCode;
            if (key === global.KEY_ENTER) {
                handleStartGame();
            }
        });
    }

    // === GLOBAL KEYBOARD EVENTS ===
    document.addEventListener('keydown', function(e) {
        // Solo procesar si el juego está activo
        if (global.gameStart && global.playerType === 'player') {
            const key = e.which || e.keyCode;
            
            // Tecla 'C' para Cash Out (67)
            if (key === 67) {
                e.preventDefault();
                console.log('💰 Cash out hotkey pressed');
                console.log('🔍 bettingClient exists:', !!bettingClient);
                console.log('🔍 bettingClient type:', typeof bettingClient);
                if (bettingClient) {
                    console.log('🔍 bettingClient.currentGame:', bettingClient.currentGame);
                    console.log('🔍 bettingClient.currentValue:', bettingClient.currentValue);
                }
                if (bettingClient && bettingClient.currentGame) {
                    console.log('✅ Processing cash out directly...');
                    // Ejecutar cashout directamente sin modal
                    handleDirectCashOut();
                } else {
                    console.log('❌ Cannot process cash out - bettingClient or currentGame not available');
                }
            }
            
            // Tecla 'ESC' para salir del juego (27)
            else if (key === 27) {
                e.preventDefault();
                console.log('🚪 ESC pressed - returning to menu');
                returnToMenu();
            }
        }
    });
}

// === NOWPAYMENTS TOP-UP MODAL HANDLERS ===

// Función para cargar monedas disponibles
async function loadAvailableCurrencies() {
    try {
        console.log('🪙 Loading available currencies...');
        
        const res = await fetch(`${getApiBaseUrl()}/api/payments/currencies`);
        const data = await res.json();
        
        if (data.success && data.currencies) {
            const currencySelect = document.getElementById('topUpCurrency');
            if (currencySelect) {
                // Limpiar opciones existentes
                currencySelect.innerHTML = '';
                
                // Agregar opciones
                data.currencies.forEach(currency => {
                    const option = document.createElement('option');
                    option.value = currency.toLowerCase();
                    option.textContent = currency.toUpperCase();
                    currencySelect.appendChild(option);
                });
                
                console.log('✅ Loaded currencies:', data.currencies);
            }
        } else {
            console.error('❌ Failed to load currencies:', data.error);
        }
    } catch (error) {
        console.error('❌ Error loading currencies:', error);
    }
}

function setupTopUpModalHandlers() {
    const modal = document.getElementById('topUpModal');
    if (!modal) return;
    const closeBtn = document.getElementById('topUpClose');
    const createBtn = document.getElementById('topUpCreateBtn');
    const checkBtn = document.getElementById('topUpCheckBtn');
    const amountInput = document.getElementById('topUpAmount');
    const currencySelect = document.getElementById('topUpCurrency');
    const errorDiv = document.getElementById('topUpError');
    const stepCreate = document.getElementById('topUpStepCreate');
    const stepPay = document.getElementById('topUpStepPay');
    const payAmountEl = document.getElementById('topUpPayAmount');
    const payAddressEl = document.getElementById('topUpPayAddress');
    const qrImg = document.getElementById('topUpQr');
    const expEl = document.getElementById('topUpExpires');

    let currentPaymentId = null;

    const hideError = () => { errorDiv.style.display = 'none'; };
    const showError = (msg) => { errorDiv.textContent = msg; errorDiv.style.display = 'block'; };

    const reset = () => {
        currentPaymentId = null;
        hideError();
        stepCreate.style.display = 'block';
        stepPay.style.display = 'none';
    };

    closeBtn.onclick = () => {
        modal.style.display = 'none';
        reset();
    };

    createBtn.onclick = async () => {
        try {
            console.log('🔄 Create payment button clicked');
            hideError();
            const amount = parseFloat(amountInput.value);
            const currency = currencySelect.value;
            console.log('💰 Payment details:', { amount, currency });
            
            if (!amount || amount < 5) {
                console.log('❌ Amount validation failed:', amount);
                showError('Minimum amount is $5');
                return;
            }
            if (!authManager || !authManager.user) {
                console.log('❌ Authentication check failed:', { authManager: !!authManager, user: authManager?.user });
                showError('Not authenticated');
                return;
            }
            
            console.log('💳 Creating NOWPayments payment:', { amount, currency, userId: authManager.user.id });
            console.log('🌐 API Base URL:', getApiBaseUrl());
            
            const requestBody = {
                action: 'create_payment',
                amount,
                currency,
                userId: authManager.user.id
            };
            console.log('📤 Request body:', requestBody);
            
            const res = await fetch(`${getApiBaseUrl()}/api/payments/nowpayments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authManager ? authManager.getAuthHeaders() : {})
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('📥 Response status:', res.status);
            const data = await res.json();
            console.log('💳 NOWPayments response:', data);
            
            if (!data.success) {
                console.log('❌ Payment creation failed:', data.error);
                throw new Error(data.error || 'Create payment failed');
            }
            
            currentPaymentId = data.payment.id;
            console.log('💾 Payment ID saved:', currentPaymentId);
            
            // Mostrar instrucciones de pago
            console.log('🔄 Updating payment UI elements');
            payAmountEl.textContent = `${data.payment.pay_amount} ${data.payment.pay_currency.toUpperCase()}`;
            payAddressEl.textContent = data.payment.pay_address;
            qrImg.src = data.payment.qr_code_url;
            expEl.textContent = new Date(data.payment.expires_at).toLocaleString();
            
            console.log('🔄 Switching to payment step');
            stepCreate.style.display = 'none';
            stepPay.style.display = 'block';
            
            console.log('✅ Payment created successfully:', data.payment.id);
        } catch (e) {
            console.error('❌ Payment creation error:', e);
            showError(e.message);
        }
    };

    checkBtn.onclick = async () => {
        try {
            hideError();
            if (!currentPaymentId) return;
            
            console.log('🔍 Checking NOWPayments payment status:', currentPaymentId);
            
            const res = await fetch(`${getApiBaseUrl()}/api/payments/nowpayments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authManager ? authManager.getAuthHeaders() : {})
                },
                body: JSON.stringify({
                    action: 'check_payment',
                    paymentId: currentPaymentId
                })
            });
            
            const data = await res.json();
            console.log('🔍 NOWPayments status response:', data);
            
            if (!data.success) throw new Error(data.error || 'Check failed');
            
            if (data.payment.status === 'finished') {
                console.log('✅ Payment finished - updating balance');
                // Refrescar balance y cerrar modal
                await bettingClient.refreshBalance();
                modal.style.display = 'none';
                reset();
            } else if (data.payment.status === 'confirmed') {
                console.log('✅ Payment confirmed - waiting for final confirmation');
                showError(`Payment confirmed! Waiting for final confirmation. Try again in 30-60s.`);
            } else if (data.payment.status === 'waiting') {
                console.log('⏳ Payment waiting - user needs to complete payment');
                showError(`Payment waiting. Please complete the payment and try again.`);
            } else if (data.payment.status === 'expired') {
                console.log('❌ Payment expired');
                showError(`Payment expired. Please create a new payment.`);
                reset();
            } else if (data.payment.status === 'failed') {
                console.log('❌ Payment failed');
                showError(`Payment failed. Please try again.`);
                reset();
            } else {
                console.log('ℹ️ Unknown payment status:', data.payment.status);
                showError(`Status: ${data.payment.status}. Try again in 30-60s.`);
            }
        } catch (e) {
            console.error('❌ Payment check error:', e);
            showError(e.message);
        }
    };
}

// === FUNCIÓN PARA MANEJAR CASHOUT DIRECTO ===
async function handleDirectCashOut() {
    console.log('💸 Processing direct cash out...');
    
    try {
        const result = await bettingClient.cashOut();
        if (result) {
            console.log('✅ Cash out successful:', result);
            if (socket) {
                socket.disconnect();
            }
            returnToMenu();
        } else {
            console.log('❌ Cash out failed');
        }
    } catch (error) {
        console.error('🚨 Cash out error:', error);
    }
}

// === FUNCIÓN PARA MANEJAR INICIO DE JUEGO ===
async function handleStartGame() {
    console.log('🎮 ========== handleStartGame STARTED ==========');
    
    const playerNameInput = document.getElementById('playerNameInput');
    
    // Mejorar la detección del botón activo
    let activeBetButton = document.querySelector('.bet-btn[style*="FFED4E"]');
    if (!activeBetButton) {
        // Buscar por color de fondo específico
        const allBetButtons = document.querySelectorAll('.bet-btn');
        activeBetButton = Array.from(allBetButtons).find(btn => 
            btn.style.background === 'rgb(255, 237, 78)' || 
            btn.style.background === '#FFED4E' ||
            btn.classList.contains('active')
        );
    }
    if (!activeBetButton) {
        // Fallback al primer botón
        activeBetButton = document.querySelector('.bet-btn');
    }
    
    console.log('🔍 Raw elements:', {
        playerNameInput,
        activeBetButton,
        activeBetButtonStyle: activeBetButton?.style.background,
        playerNameInputValue: playerNameInput?.value
    });
    
    if (!playerNameInput) {
        console.error('❌ Missing player name input');
        return;
    }

    // Obtener el monto de apuesta del botón activo
    let betAmount = 1; // Valor por defecto
    if (activeBetButton) {
        betAmount = parseFloat(activeBetButton.getAttribute('data-bet'));
        console.log('💰 Selected bet amount from button:', betAmount);
    }
    
    const playerName = playerNameInput.value.trim();

    console.log('🔍 Parsed values:', { betAmount, playerName });

    // Validaciones
    if (!playerName) {
        console.log('❌ Empty player name');
        bettingClient.showError('Por favor ingresa tu nombre');
        return;
    }

    if (!validNick(playerName)) {
        console.log('❌ Invalid nick format');
        bettingClient.showError('El nombre debe ser alfanumérico');
        return;
    }

    if (betAmount < 1 || betAmount > 20) {
        console.log('❌ Invalid bet amount');
        bettingClient.showError('La apuesta debe estar entre $1 y $20');
        return;
    }

    console.log('✅ All validations passed! Starting game...');
    
    try {
        const game = await bettingClient.startGame(betAmount);
        console.log('🎲 Game result:', game);
        
        if (game) {
            console.log('🚀 Launching game...');
            await startGameWithBetting('player', playerName, game);
        } else {
            console.log('❌ Failed to start game');
        }
    } catch (error) {
        console.error('🚨 Error:', error);
    }
    
    console.log('🎮 ========== handleStartGame FINISHED ==========');
}
// === FUNCIONES DEL JUEGO ===

// Función de validación
function validNick(nickname) {
    var regex = /^\w*$/;
    return regex.exec(nickname) !== null;
}

// Función para iniciar juego con apuestas
async function startGameWithBetting(type, playerName, gameData) {
    console.log('🚀 Starting game:', { type, playerName, gameData });
    
    // NUEVO: Limpiar juego anterior antes de empezar
    cleanupPreviousGame();
    
    // OBTENER CONFIGURACIÓN DEL SERVIDOR
    try {
        console.log('🔧 Obteniendo configuración de sala del servidor...');
        const apiBase = window.location.hostname === 'localhost' ? 'http://localhost:3000' : `https://${window.location.hostname}`;
        
        // Intentar obtener configuración con autenticación si está disponible
        let headers = {
            'Content-Type': 'application/json'
        };
        
        // Agregar token de autenticación si está disponible
        if (authManager && authManager.token) {
            headers['Authorization'] = 'Bearer ' + authManager.token;
        }
        
        const response = await fetch(apiBase + '/api/admin/room-config', {
            method: 'GET',
            headers: headers
        });
        
        if (response.ok) {
            const configData = await response.json();
            console.log('✅ Configuración obtenida del servidor:', configData);
            
            // Aplicar configuración al juego
            if (configData.config && configData.config.currentRoom) {
                const roomType = configData.config.currentRoom;
                const roomSettings = configData.config.configs[roomType];
                
                console.log('🎮 Aplicando configuración de sala:', roomType, roomSettings);
                
                // Actualizar dimensiones del juego
                global.game.width = roomSettings.width;
                global.game.height = roomSettings.height;
                
                // Guardar configuración en localStorage para persistencia
                localStorage.setItem('roomConfig', JSON.stringify(configData.config));
                
                console.log('📐 Dimensiones del juego actualizadas:', {
                    width: global.game.width,
                    height: global.game.height
                });
            }
        } else {
            console.warn('⚠️ No se pudo obtener configuración del servidor, intentando localStorage...');
            
            // Intentar cargar desde localStorage como fallback
            const savedConfig = localStorage.getItem('roomConfig');
            if (savedConfig) {
                try {
                    const config = JSON.parse(savedConfig);
                    const roomType = config.currentRoom;
                    const roomSettings = config.configs[roomType];
                    
                    console.log('📱 Usando configuración de localStorage:', roomType, roomSettings);
                    
                    // Actualizar dimensiones del juego
                    global.game.width = roomSettings.width;
                    global.game.height = roomSettings.height;
                    
                    console.log('📐 Dimensiones del juego actualizadas desde localStorage:', {
                        width: global.game.width,
                        height: global.game.height
                    });
                } catch (e) {
                    console.error('❌ Error parsing localStorage config:', e);
                }
            } else {
                console.warn('⚠️ No hay configuración guardada, usando configuración por defecto');
            }
        }
    } catch (error) {
        console.error('❌ Error obteniendo configuración:', error);
        
        // Intentar cargar desde localStorage como fallback
        const savedConfig = localStorage.getItem('roomConfig');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                const roomType = config.currentRoom;
                const roomSettings = config.configs[roomType];
                
                console.log('📱 Usando configuración de localStorage (fallback):', roomType, roomSettings);
                
                // Actualizar dimensiones del juego
                global.game.width = roomSettings.width;
                global.game.height = roomSettings.height;
                
                console.log('📐 Dimensiones del juego actualizadas desde localStorage:', {
                    width: global.game.width,
                    height: global.game.height
                });
            } catch (e) {
                console.error('❌ Error parsing localStorage config:', e);
            }
        }
    }
    
    global.playerName = playerName;
    global.playerType = type;
    global.screen.width = window.innerWidth;
    global.screen.height = window.innerHeight;

    // UI transitions - Ocultar dashboard y mostrar solo el área de juego
    const loginSection = document.getElementById('loginSection');
    const gameSection = document.getElementById('gameSection');
    const gameAreaWrapper = document.getElementById('gameAreaWrapper');
    
    // Ocultar sección de login
    if (loginSection) loginSection.style.display = 'none';
    
    // Mostrar área de juego pero ocultar elementos del dashboard
    if (gameSection) {
        gameSection.style.display = 'block';
        
        // Ocultar todos los elementos del dashboard
        const dashboardElements = gameSection.querySelectorAll('.top-bar, .logo-section, .main-container, .discord-btn');
        dashboardElements.forEach(element => {
            element.style.display = 'none';
        });
    }
    
    // Mostrar solo el área de juego
    if (gameAreaWrapper) {
        gameAreaWrapper.style.opacity = 1;
        gameAreaWrapper.style.display = 'block';
    }

    // Preparar conexión al servidor de juego
    let query = 'type=' + type;
    if (type === 'player' && gameData && authManager.user) {
        query += '&userId=' + authManager.user.id + '&gameId=' + gameData.id + '&betAmount=' + gameData.bet_amount;
        
        // Inicializar variables globales de manera robusta
        global.currentBet = gameData.bet_amount || 0;
        global.gameValue = gameData.current_value || gameData.bet_amount || 0; // Usar bet_amount como valor inicial si current_value no está definido
        global.playerType = 'player';
        
        console.log('🎯 Global variables initialized:', {
            currentBet: global.currentBet,
            gameValue: global.gameValue,
            playerType: global.playerType
        });
    }

            // Conectar al game server
        const gameServerUrl = window.location.hostname === 'localhost' ? 
            'http://localhost:3001' : 
            'https://back.pruebatupanel.com';
    
    socket = io(gameServerUrl, { query: query });
    global.socket = socket;
    setupGameSocket(socket);

    // Setup UI para jugador con apuesta
    if (type === 'player' && gameData) {
        const currentValueDisplay = document.getElementById('currentValueDisplay');
        const cashOutBtn = document.getElementById('cashOutBtn');
        const controlsIndicator = document.getElementById('controlsIndicator');
        
        if (currentValueDisplay) {
            currentValueDisplay.style.display = 'block';
        }
        
                                               if (cashOutBtn) {
                    cashOutBtn.style.display = 'block';
                    cashOutBtn.onclick = () => {
                        console.log('💰 Cash out button clicked');
                        console.log('🔍 bettingClient exists:', !!bettingClient);
                        console.log('🔍 currentGame exists:', !!(bettingClient && bettingClient.currentGame));
                        if (bettingClient && bettingClient.currentGame) {
                            handleDirectCashOut(); // Ejecutar cashout directamente
                        } else {
                            console.log('❌ Cannot process cash out - bettingClient or currentGame not available');
                        }
                    };
                }
        
        if (controlsIndicator) {
            controlsIndicator.style.display = 'block';
        }
        
        if (bettingClient) {
            bettingClient.showCashOutButton();
            // Usar bet_amount como valor inicial si current_value no está definido
            const initialValue = gameData.current_value || gameData.bet_amount || 0;
            bettingClient.updateGameValue(initialValue);
            bettingClient.currentValue = initialValue;
            
            console.log('💰 BettingClient initialized with value:', initialValue);
        }
    }

    // NUEVO: Crear canvas y chat NUEVOS (no reutilizar)
    if (typeof Canvas !== 'undefined') {
        global.canvas = new Canvas();
    }
    if (typeof ChatClient !== 'undefined') {
        global.chatClient = new ChatClient();
        global.chatClient.socket = socket;
        global.chatClient.registerFunctions();
    }

    // Iniciar animation loop
    if (!global.animLoopHandle) {
        animloop();
    }
    
    socket.emit('respawn');
    
    console.log('🎮 Game started successfully');
}

function verifyGameReadiness() {
    const checks = {
        authManager: !!authManager,
        bettingClient: !!bettingClient,
        isAuthenticated: authManager ? authManager.isAuthenticated : false,
        hasBalance: authManager && authManager.user ? authManager.user.balance_available > 0 : false
    };
    
    console.log('🔍 Game readiness check:', checks);
    
    const allReady = Object.values(checks).every(check => check === true);
    if (!allReady) {
        console.warn('⚠️ Game not ready:', checks);
    }
    
    return allReady;
}

// === SETUP DEL SOCKET ===
function setupGameSocket(socket) {
    console.log('🔌 Setting up game socket...');

    // === EVENTOS BÁSICOS ===
    socket.on('pongcheck', function () {
        var latency = Date.now() - global.startPingTime;
        console.log('🏓 Latency: ' + latency + 'ms');
        if (global.chatClient) {
            global.chatClient.addSystemLine('Ping: ' + latency + 'ms');
        }
    });

    socket.on('connect_error', handleDisconnect);
    socket.on('disconnect', handleDisconnect);

    // === CONEXIÓN EXITOSA ===
    socket.on('welcome', function (playerSettings, gameSizes) {
        console.log('🎉 Connected to game server');
        
        player = playerSettings;
        player.name = global.playerName;
        player.screenWidth = global.screen.width;
        player.screenHeight = global.screen.height;
        player.target = global.target;
        global.player = player;
        
        socket.emit('gotit', player);
        global.gameStart = true;
        
        if (global.chatClient) {
            global.chatClient.addSystemLine('Connected to the game!');
            global.chatClient.addSystemLine('Type <b>-help</b> for commands.');
            
            // Mostrar controles de teclado para jugadores con apuesta
            if (global.playerType === 'player' && global.currentBet > 0) {
                global.chatClient.addSystemLine('🎮 <b>Controls:</b> C = Cash Out, ESC = Exit Game');
            }
            
            // Mostrar información de la sala actual
            if (window.RoomConfig) {
                const roomInfo = window.RoomConfig.getRoomInfo();
                global.chatClient.addSystemLine(`🏟️ <b>Room:</b> ${roomInfo.name} (${roomInfo.dimensions})`);
            }
        }
        
        // Focus en canvas
        const canvas = document.getElementById('cvs');
        if (canvas) {
            canvas.focus();
        }
        
        // Usar configuración de sala si está disponible, sino usar la del servidor
        if (window.RoomConfig) {
            const dimensions = window.RoomConfig.getGameDimensions();
            global.game.width = dimensions.width;
            global.game.height = dimensions.height;
            console.log('🎮 Using room config dimensions:', dimensions);
        } else {
            global.game.width = gameSizes.width;
            global.game.height = gameSizes.height;
            console.log('🎮 Using server dimensions:', gameSizes);
        }
        
        resize();
    });

    // === EVENTOS DE JUGADORES ===
    socket.on('playerDied', function(data) {
        console.log('💀 Player died:', data);
        if (global.chatClient) {
            const playerName = data.playerEatenName || data.name || 'An unnamed cell';
            global.chatClient.addSystemLine('{GAME} - <b>' + playerName + '</b> was eaten');
        }
    });

    socket.on('playerDisconnect', function(data) {
        console.log('👋 Player disconnected:', data.name);
        if (global.chatClient) {
            const playerName = data.name || 'An unnamed cell';
            global.chatClient.addSystemLine('{GAME} - <b>' + playerName + '</b> disconnected.');
        }
    });

    socket.on('playerJoin', function(data) {
        console.log('👤 Player joined:', data.name);
        if (global.chatClient) {
            const playerName = data.name || 'An unnamed cell';
            global.chatClient.addSystemLine('{GAME} - <b>' + playerName + '</b> joined.');
        }
    });

    // Escuchar actualizaciones dinámicas del mapa
    socket.on('mapUpdate', function (mapSizes) {
        console.log('🗺️ Map size updated:', mapSizes);
        global.game.width = mapSizes.width;
        global.game.height = mapSizes.height;
        
        if (global.chatClient) {
            global.chatClient.addSystemLine('{SYSTEM} - Map size updated to ' + mapSizes.width + 'x' + mapSizes.height);
        }
        
        resize();
    });

    // === LEADERBOARD ===
    socket.on('leaderboard', function(data) {
        leaderboard = data.leaderboard;
        updateLeaderboardDisplay();
    });

    // === MOVEMENT DATA ===
    socket.on('serverTellPlayerMove', function(playerData, userData, foodsList, massList, virusList) {
        if (global.playerType == 'player') {
            player.x = playerData.x;
            player.y = playerData.y;
            player.hue = playerData.hue;
            player.massTotal = playerData.massTotal;
            player.cells = playerData.cells;
        }
        users = userData;
        foods = foodsList;
        viruses = virusList;
        fireFood = massList;
    });

    // === CHAT ===
    socket.on('serverSendPlayerChat', function(data) {
        if (global.chatClient) {
            global.chatClient.addChatLine(data.sender, data.message, false);
        }
    });

    socket.on('serverMSG', function(data) {
        if (global.chatClient) {
            global.chatClient.addSystemLine(data);
        }
    });

    // === EVENTOS DE APUESTAS ===
    socket.on('valueUpdate', function(data) {
        console.log('💰 Value update:', data.currentValue);
        if (bettingClient && bettingClient.currentGame) {
            bettingClient.updateGameValue(data.currentValue);
            global.gameValue = data.currentValue;
        }
    });

    socket.on('RIP', function() {
        console.log('💀 Game over - Player died');
        global.gameStart = false;
        
        if (bettingClient && bettingClient.currentGame) {
            bettingClient.currentValue = 0;
            bettingClient.currentGame = null;
            bettingClient.hideCashOutButton();
            
            showGameOverMessage('💀 ¡Moriste! Perdiste $' + global.currentBet.toFixed(2));
        } else {
            showGameOverMessage('You died!');
        }
        
    });

    socket.on('kick', function(reason) {
        global.gameStart = false;
        global.kicked = true;
        const message = reason ? 'You were kicked for: ' + reason : 'You were kicked!';
        showGameOverMessage(message);
        socket.close();
    });
}

// === FUNCIONES DE UI ===

function updateLeaderboardDisplay() {
    var status = '<span class="title">Leaderboard</span>';
    for (var i = 0; i < leaderboard.length; i++) {
        status += '<br />';
        if (leaderboard[i].id == player.id) {
            if (leaderboard[i].name.length !== 0) {
                status += '<span class="me">' + (i + 1) + '. ' + leaderboard[i].name + '</span>';
            } else {
                status += '<span class="me">' + (i + 1) + '. An unnamed cell</span>';
            }
        } else {
            if (leaderboard[i].name.length !== 0) {
                status += (i + 1) + '. ' + leaderboard[i].name;
            } else {
                status += (i + 1) + '. An unnamed cell';
            }
        }
    }
    
    // Agregar info de apuesta
    if (global.playerType === 'player' && global.gameValue > 0) {
        status += '<br/><br/>';
        status += '<span style="color: #f39c12;">Valor: $' + global.gameValue.toFixed(2) + '</span>';
        
        if (global.currentBet > 0) {
            const roi = ((global.gameValue / global.currentBet - 1) * 100);
            const roiColor = roi >= 0 ? '#2ecc71' : '#e74c3c';
            status += '<br/>';
            status += '<span style="color: ' + roiColor + ';">ROI: ' + (roi >= 0 ? '+' : '') + roi.toFixed(1) + '%</span>';
        }
    }
    
    const statusEl = document.getElementById('status');
    if (statusEl) {
        statusEl.innerHTML = status;
    }
}

function showGameOverMessage(message) {
    const canvas = document.getElementById('cvs');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }
}

function returnToMenu() {
    console.log('🏠 Returning to menu...');
    
    // Todo el código de cleanup existente...
    if (socket) {
        socket.disconnect();
        socket = null;
        global.socket = null;
    }
    
    if (global.animLoopHandle) {
        window.cancelAnimationFrame(global.animLoopHandle);
        global.animLoopHandle = undefined;
    }
    
    // Reset de variables
    global.gameStart = false;
    global.currentBet = 0;
    global.gameValue = 0;
    
    // Limpiar arrays
    foods = [];
    viruses = [];
    fireFood = [];
    users = [];
    leaderboard = [];
    
    // UI Updates básicas - Ocultar área de juego y mostrar dashboard completo
    const gameAreaWrapper = document.getElementById('gameAreaWrapper');
    const loginSection = document.getElementById('loginSection');
    const gameSection = document.getElementById('gameSection');
    const currentValueDisplay = document.getElementById('currentValueDisplay');
    const cashOutBtn = document.getElementById('cashOutBtn');
    
    // Ocultar área de juego
    if (gameAreaWrapper) {
        gameAreaWrapper.style.opacity = 0;
        gameAreaWrapper.style.display = 'none';
    }
    
    // Mostrar sección de login
    if (loginSection) {
        loginSection.style.display = 'flex';
    }
    
    // Ocultar sección de juego
    if (gameSection) {
        gameSection.style.display = 'none';
    }
    
    // Ocultar elementos del juego
    if (currentValueDisplay) {
        currentValueDisplay.style.display = 'none';
    }
    if (cashOutBtn) {
        cashOutBtn.style.display = 'none';
        cashOutBtn.onclick = null; // Limpiar event listener
    }
    
    // Ocultar indicador de controles
    const controlsIndicator = document.getElementById('controlsIndicator');
    if (controlsIndicator) {
        controlsIndicator.style.display = 'none';
    }
    
    // Ocultar modales de cash out
    const cashOutModal = document.getElementById('cashOutModal');
    const cashOutResult = document.getElementById('cashOutResult');
    const cashOutModalAlternative = document.getElementById('cashOutModalAlternative');
    
    if (cashOutModal) {
        cashOutModal.style.display = 'none';
    }
    if (cashOutResult) {
        cashOutResult.style.display = 'none';
    }
    if (cashOutModalAlternative) {
        cashOutModalAlternative.remove();
    }
    
    // NUEVO: En lugar de recargar, limpiar y resetear
    setTimeout(() => {
        resetMenuUI();
        reestablishEventListeners();
        
        // Refresh balance desde el servidor SIN recargar página
        if (authManager && authManager.isAuthenticated) {
            authManager.initialize(); // Re-verificar token y actualizar balance
        }
        
        console.log('✅ Return to menu complete - UI reset without page reload');
    }, 500);
}

// Hacer returnToMenu disponible globalmente
window.returnToMenu = returnToMenu;

// NUEVO: Función para limpiar completamente el juego anterior
function cleanupPreviousGame() {
    // Limpiar todas las referencias globales
    if (global.canvas) {
        global.canvas = null;
    }
    if (global.chatClient) {
        global.chatClient = null;
    }
    
    // Reset completo de estado
    global.playerName = '';
    global.playerType = '';
    
    console.log('🧹 Previous game cleaned up');
}
function handleDisconnect() {
    if (socket) {
        socket.close();
    }
    if (!global.kicked) {
        console.log('🔌 Disconnected from server');
        showGameOverMessage('Disconnected!');
    }
}

// NUEVO: Botón de debug (temporal)
function addDebugButton() {
    const debugBtn = document.createElement('button');
    debugBtn.textContent = '🔍 Debug UI';
    debugBtn.style.position = 'absolute';
    debugBtn.style.top = '10px';
    debugBtn.style.left = '300px';
    debugBtn.style.zIndex = '1000';
    debugBtn.onclick = () => {
        debugUIState();
        console.log('🔧 Attempting manual reset...');
        resetMenuUI();
        reestablishEventListeners();
    };
    document.body.appendChild(debugBtn);
}

function resetMenuCompletely() {
    const gameSection = document.getElementById('gameSection');
    const originalHTML = gameSection.innerHTML;
    gameSection.innerHTML = originalHTML;
    
    // Re-setup todo
    setupEventListeners();
    if (authManager.isAuthenticated) {
        authManager.updateUI();
    }
}

// === CONTROLES DEL JUEGO ===
function initializeGameControls() {
    console.log('🎮 Initializing game controls...');
    
    // Mobile controls
    const splitBtn = document.getElementById('split');
    const feedBtn = document.getElementById('feed');
    
    if (splitBtn) {
        splitBtn.onclick = function() {
            if (socket && global.gameStart) {
                socket.emit('2');
                console.log('✂️ Split (mobile)');
            }
        };
    }
    
    if (feedBtn) {
        feedBtn.onclick = function() {
            if (socket && global.gameStart) {
                socket.emit('1');
                console.log('🔥 Feed (mobile)');
            }
        };
    }
}

// === GAME LOOP Y ANIMACIÓN ===

window.requestAnimFrame = (function() {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

function animloop() {
    global.animLoopHandle = window.requestAnimFrame(animloop);
    gameLoop();
}

function gameLoop() {
    if (global.gameStart) {
        const canvas = document.getElementById('cvs');
        if (!canvas) return;
        
        const graph = canvas.getContext('2d');
        
        // Clear canvas
        graph.fillStyle = global.backgroundColor;
        graph.fillRect(0, 0, global.screen.width, global.screen.height);

        // Verificar que las funciones de render estén disponibles
        if (typeof drawGrid === 'function') {
            drawGrid(global, player, global.screen, graph);
        }
        
        // Dibujar comida
        if (typeof drawFood === 'function') {
            foods.forEach(function(food) {
                let position = getPosition(food, player, global.screen);
                drawFood(position, food, graph);
            });
        }
        
        // Dibujar fire food
        if (typeof drawFireFood === 'function') {
            fireFood.forEach(function(mass) {
                let position = getPosition(mass, player, global.screen);
                drawFireFood(position, mass, playerConfig, graph);
            });
        }
        
        // Dibujar virus
        if (typeof drawVirus === 'function') {
            viruses.forEach(function(virus) {
                let position = getPosition(virus, player, global.screen);
                drawVirus(position, virus, graph);
            });
        }

        // Calcular bordes
        let borders = {
            left: global.screen.width / 2 - player.x,
            right: global.screen.width / 2 + global.game.width - player.x,
            top: global.screen.height / 2 - player.y,
            bottom: global.screen.height / 2 + global.game.height - player.y
        };
        
        if (global.borderDraw && typeof drawBorder === 'function') {
            drawBorder(borders, graph);
        }

        // Dibujar células
        var cellsToDraw = [];
        for (var i = 0; i < users.length; i++) {
            let color = 'hsl(' + users[i].hue + ', 100%, 50%)';
            let borderColor = 'hsl(' + users[i].hue + ', 100%, 45%)';
            for (var j = 0; j < users[i].cells.length; j++) {
                cellsToDraw.push({
                    id: users[i].id,
                    color: color,
                    borderColor: borderColor,
                    mass: users[i].cells[j].mass,
                    name: users[i].name,
                    radius: users[i].cells[j].radius,
                    x: users[i].cells[j].x - player.x + global.screen.width / 2,
                    y: users[i].cells[j].y - player.y + global.screen.height / 2
                });
            }
        }
        
        cellsToDraw.sort(function(obj1, obj2) {
            return obj1.mass - obj2.mass;
        });
        
        if (typeof drawCells === 'function') {
            drawCells(cellsToDraw, playerConfig, global.toggleMassState, borders, graph);
        }

        // Dibujar HUD de apuestas
        if (global.playerType === 'player' && global.gameValue > 0 && typeof drawBettingHUD === 'function') {
            drawBettingHUD(graph, global.screen);
        }

        // Enviar heartbeat
        if (socket) {
            socket.emit('0', global.target);
        }
    }
}

// === RESIZE HANDLER ===
window.addEventListener('resize', resize);

function resize() {
    if (!socket) return;

    global.screen.width = window.innerWidth;
    global.screen.height = window.innerHeight;
    
    const canvas = document.getElementById('cvs');
    if (canvas) {
        canvas.width = global.screen.width;
        canvas.height = global.screen.height;
    }

    player.screenWidth = global.screen.width;
    player.screenHeight = global.screen.height;

    if (global.playerType == 'spectator') {
        player.x = global.game.width / 2;
        player.y = global.game.height / 2;
    }

    if (socket) {
        socket.emit('windowResized', { 
            screenWidth: global.screen.width, 
            screenHeight: global.screen.height 
        });
    }
}

// === UTILIDADES ===
function debug(args) {
    if (console && console.log) {
        console.log('[GAME]', args);
    }
}

// Helper para posición relativa (si no está en render.js)
/* function getPosition(entity, player, screen) {
    return {
        x: entity.x - player.x + screen.width / 2,
        y: entity.y - player.y + screen.height / 2
    };
}*/

// Variables globales necesarias para compatibilidad
window.settings = {
    toggleBorder: function() {
        if (global.chatClient) {
            global.chatClient.toggleBorder();
        }
    },
    toggleMass: function() {
        if (global.chatClient) {
            global.chatClient.toggleMass();
        }
    },
    toggleContinuity: function() {
        global.continuity = !global.continuity;
    },
    toggleRoundFood: function() {
        global.foodSides = global.foodSides === 10 ? 5 : 10;
    }
};

console.log('✅ App-betting.js loaded');
console.log('📱 Mobile detected:', global.mobile);

// NUEVA función: Reset completo de la UI del menú
function resetMenuUI() {
    console.log('🔄 Resetting menu UI...');
    
    // 1. Reset del input del nombre
    const playerNameInput = document.getElementById('playerNameInput');
    if (playerNameInput) {
        playerNameInput.value = '';
        playerNameInput.disabled = false;
        playerNameInput.style.opacity = '1';
        playerNameInput.style.pointerEvents = 'auto';
        playerNameInput.focus(); // Forzar focus
        console.log('✅ Player name input reset');
    }
    
    // 2. Reset de los botones de apuesta
    const betButtons = document.querySelectorAll('.bet-btn');
    betButtons.forEach((button, index) => {
        if (index === 0) {
            button.style.background = '#FFED4E'; // Activar primer botón
        } else {
            button.style.background = '#FFD700'; // Resetear otros botones
        }
    });
    
    // Reset del texto del botón JOIN GAME
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.textContent = '▷ JOIN GAME ($1)';
    }
    
    // 3. Reset del botón de jugar
    const startButtonElement = document.getElementById('startButton');
    if (startButtonElement) {
        startButtonElement.disabled = false;
        startButtonElement.style.opacity = '1';
        startButtonElement.style.pointerEvents = 'auto';
        console.log('✅ Start button enabled');
    }
    
    // 4. Limpiar mensajes de error
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }
    
    // 5. Mostrar sección de juego con todos los elementos del dashboard
    const gameSection = document.getElementById('gameSection');
    const loginSection = document.getElementById('loginSection');
    
    if (gameSection) {
        gameSection.style.display = 'block';
        
        // Mostrar todos los elementos del dashboard
        const dashboardElements = gameSection.querySelectorAll('.top-bar, .logo-section, .main-container, .discord-btn');
        dashboardElements.forEach(element => {
            element.style.display = '';
        });
    }
    if (loginSection) {
        loginSection.style.display = 'none';
    }
    
    console.log('✅ Menu UI reset complete');
}

// NUEVA función: Re-establecer TODOS los event listeners
function reestablishEventListeners() {
    console.log('🔗 Re-establishing event listeners...');
    
    // Remover event listeners anteriores (si existen)
    const startButton = document.getElementById('startButton');
    const playerNameInput = document.getElementById('playerNameInput');
    
    if (startButton) {
        // Crear un nuevo botón para evitar event listeners duplicados
        const newStartButton = startButton.cloneNode(true);
        startButton.parentNode.replaceChild(newStartButton, startButton);
        
        // Agregar event listener fresco
        newStartButton.onclick = async function() {
            console.log('🎯 Start button clicked (fresh listener)');
            await handleStartGame();
        };
        
        console.log('✅ Start button listener re-established');
    }
    
    // Re-establecer event listeners para botones de apuesta
    const betButtons = document.querySelectorAll('.bet-btn');
    let activeButtonIndex = 0; // Por defecto el primer botón
    
    // Encontrar cuál botón estaba activo antes de clonar
    betButtons.forEach((button, index) => {
        if (button.style.background === 'rgb(255, 237, 78)' || button.style.background === '#FFED4E') {
            activeButtonIndex = index;
        }
    });
    
    betButtons.forEach((button, index) => {
        // Remover event listeners anteriores
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Restaurar el estado visual del botón activo
        if (index === activeButtonIndex) {
            newButton.style.background = '#FFED4E';
        } else {
            newButton.style.background = '#FFD700';
        }
        
        // Agregar event listener fresco
        newButton.onclick = function() {
            // Remover clase activa de todos los botones
            betButtons.forEach(btn => btn.style.background = '#FFD700');
            
            // Activar el botón seleccionado
            this.style.background = '#FFED4E';
            
            // Obtener el monto del botón
            const betAmount = parseFloat(this.getAttribute('data-bet'));
            
            console.log('💰 Selected bet amount:', betAmount);
            
            // Actualizar el texto del botón JOIN GAME
            const joinGameBtn = document.getElementById('startButton');
            if (joinGameBtn) {
                joinGameBtn.textContent = `▷ JOIN GAME ($${betAmount})`;
            }
        };
    });
    
    // Actualizar el texto del botón JOIN GAME con el monto del botón activo
    const activeButton = betButtons[activeButtonIndex];
    if (activeButton) {
        const betAmount = parseFloat(activeButton.getAttribute('data-bet'));
        const joinGameBtn = document.getElementById('startButton');
        if (joinGameBtn) {
            joinGameBtn.textContent = `▷ JOIN GAME ($${betAmount})`;
        }
    }
    
    console.log('✅ Bet buttons listeners re-established');
    
    if (playerNameInput) {
        // Crear nuevo input
        const newPlayerNameInput = playerNameInput.cloneNode(true);
        playerNameInput.parentNode.replaceChild(newPlayerNameInput, playerNameInput);
        
        // Agregar event listener fresco
        newPlayerNameInput.addEventListener('keypress', function(e) {
            var key = e.which || e.keyCode;
            if (key === global.KEY_ENTER || key === 13) {
                console.log('🎯 Enter pressed in name input');
                handleStartGame();
            }
        });
        
        // Focus en el nuevo input
        setTimeout(() => {
            newPlayerNameInput.focus();
        }, 100);
        
        console.log('✅ Player name input listener re-established');
    }
    
    console.log('✅ All event listeners re-established');
}

// NUEVA función: Debug del estado de la UI
function debugUIState() {
    const elements = {
        playerNameInput: document.getElementById('playerNameInput'),
        startButton: document.getElementById('startButton'),
        betButtons: document.querySelectorAll('.bet-btn'),
        gameSection: document.getElementById('gameSection'),
        loginSection: document.getElementById('loginSection')
    };
    
    console.log('🔍 UI Debug State:');
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            if (name === 'betButtons') {
                console.log(`  ${name}:`, {
                    count: element.length,
                    activeButton: Array.from(element).findIndex(btn => btn.style.background === 'rgb(255, 237, 78)')
                });
            } else {
                console.log(`  ${name}:`, {
                    disabled: element.disabled,
                    style_display: element.style.display,
                    style_opacity: element.style.opacity,
                    value: element.value || 'N/A'
                });
            }
        } else {
            console.log(`  ${name}: NOT FOUND`);
        }
    }
}