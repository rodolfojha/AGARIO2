// public/game/js/app-betting.js - App principal completo con sistema de apuestas

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
refreshBtn.onclick = () => window.location.reload();
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
    if (addBalanceBtn) {
        addBalanceBtn.onclick = async () => {
            console.log('💰 Adding test balance...');
            await bettingClient.addTestBalance(50);
        };
    }

    // === BET CONTROLS ===
    const betSlider = document.getElementById('betSlider');
    const betDisplay = document.getElementById('betDisplay');
    const betButtonAmount = document.getElementById('betButtonAmount');

    if (betSlider && betDisplay && betButtonAmount) {
        betSlider.oninput = function() {
            const amount = parseFloat(this.value);
            betDisplay.textContent = amount.toFixed(2);
            betButtonAmount.textContent = amount.toFixed(2);
        };
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
        spectateButton.onclick = () => {
            console.log('👁️ Starting spectator mode');
            startGameWithBetting('spectator', '', null);
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
}

// === FUNCIÓN PARA MANEJAR INICIO DE JUEGO ===
async function handleStartGame() {
    console.log('🎮 ========== handleStartGame STARTED ==========');
    
    const betSlider = document.getElementById('betSlider');
    const playerNameInput = document.getElementById('playerNameInput');
    
    console.log('🔍 Raw elements:', {
        betSlider,
        playerNameInput,
        betSliderValue: betSlider?.value,
        playerNameInputValue: playerNameInput?.value
    });
    
    if (!betSlider || !playerNameInput) {
        console.error('❌ Missing form elements');
        return;
    }

    const betAmount = parseFloat(betSlider.value);
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

    if (betAmount < 1 || betAmount > 5) {
        console.log('❌ Invalid bet amount');
        bettingClient.showError('La apuesta debe estar entre $1 y $5');
        return;
    }

    console.log('✅ All validations passed! Starting game...');
    
    try {
        const game = await bettingClient.startGame(betAmount);
        console.log('🎲 Game result:', game);
        
        if (game) {
            console.log('🚀 Launching game...');
            startGameWithBetting('player', playerName, game);
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
function startGameWithBetting(type, playerName, gameData) {
    console.log('🚀 Starting game:', { type, playerName, gameData });
    
    // NUEVO: Limpiar juego anterior antes de empezar
    cleanupPreviousGame();
    
    global.playerName = playerName;
    global.playerType = type;
    global.screen.width = window.innerWidth;
    global.screen.height = window.innerHeight;

    // UI transitions
    document.getElementById('startMenuWrapper').style.maxHeight = '0px';
    document.getElementById('gameAreaWrapper').style.opacity = 1;

    // Preparar conexión al servidor de juego
    let query = 'type=' + type;
    if (type === 'player' && gameData && authManager.user) {
        query += '&userId=' + authManager.user.id + '&gameId=' + gameData.id + '&betAmount=' + gameData.bet_amount;
        global.currentBet = gameData.bet_amount;
        global.gameValue = gameData.current_value;
    }

    // Conectar al game server
    const gameServerUrl = window.location.hostname === 'localhost' ? 
        'http://localhost:3001' : 
        window.location.origin;
    
    socket = io(gameServerUrl, { query: query });
    global.socket = socket;
    setupGameSocket(socket);

    // Setup UI para jugador con apuesta
    if (type === 'player' && gameData) {
        document.getElementById('currentValueDisplay').style.display = 'block';
        bettingClient.showCashOutButton();
        bettingClient.updateGameValue(gameData.current_value);
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
        }
        
        // Focus en canvas
        const canvas = document.getElementById('cvs');
        if (canvas) {
            canvas.focus();
        }
        
        global.game.width = gameSizes.width;
        global.game.height = gameSizes.height;
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
        
        setTimeout(function() {
            returnToMenu();
        }, 2500);
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
    
    // UI Updates básicas
    const gameAreaWrapper = document.getElementById('gameAreaWrapper');
    const startMenuWrapper = document.getElementById('startMenuWrapper');
    const currentValueDisplay = document.getElementById('currentValueDisplay');
    
    if (gameAreaWrapper) {
        gameAreaWrapper.style.opacity = 0;
    }
    if (startMenuWrapper) {
        startMenuWrapper.style.maxHeight = '1000px';
    }
    if (currentValueDisplay) {
        currentValueDisplay.style.display = 'none';
    }
    
    // NUEVO: Usar las funciones específicas
    setTimeout(() => {
        resetMenuUI();
        reestablishEventListeners();
        
        // Debug para ver el estado
        debugUIState();
        
        // Refresh balance
        if (authManager && authManager.isAuthenticated) {
            bettingClient.refreshBalance();
        }
        
        console.log('✅ Return to menu complete - UI should be responsive now');
    }, 500); // Delay para asegurar que la UI se actualice

    setTimeout(() => {
    console.log('🔄 Auto-refreshing for clean state...');
    window.location.reload();
}, 2000);
}

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
    
    // 2. Reset del slider de apuesta
    const betSlider = document.getElementById('betSlider');
    const betDisplay = document.getElementById('betDisplay');
    const betButtonAmount = document.getElementById('betButtonAmount');
    
    if (betSlider) {
        betSlider.value = 1;
        betSlider.disabled = false;
        betSlider.style.opacity = '1';
    }
    if (betDisplay) {
        betDisplay.textContent = '1.00';
    }
    if (betButtonAmount) {
        betButtonAmount.textContent = '1.00';
    }
    
    // 3. Reset del botón de jugar
    const startButton = document.getElementById('startButton');
    if (startButton) {
        startButton.disabled = false;
        startButton.style.opacity = '1';
        startButton.style.pointerEvents = 'auto';
        console.log('✅ Start button enabled');
    }
    
    // 4. Limpiar mensajes de error
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }
    
    // 5. Mostrar sección de juego
    const gameSection = document.getElementById('gameSection');
    const loginSection = document.getElementById('loginSection');
    
    if (gameSection) {
        gameSection.style.display = 'block';
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
    const betSlider = document.getElementById('betSlider');
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
    
    if (betSlider) {
        // Crear nuevo slider
        const newBetSlider = betSlider.cloneNode(true);
        betSlider.parentNode.replaceChild(newBetSlider, betSlider);
        
        // Agregar event listener fresco
        newBetSlider.oninput = function() {
            const amount = parseFloat(this.value);
            const betDisplay = document.getElementById('betDisplay');
            const betButtonAmount = document.getElementById('betButtonAmount');
            
            if (betDisplay) betDisplay.textContent = amount.toFixed(2);
            if (betButtonAmount) betButtonAmount.textContent = amount.toFixed(2);
        };
        
        console.log('✅ Bet slider listener re-established');
    }
    
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
        betSlider: document.getElementById('betSlider'),
        gameSection: document.getElementById('gameSection'),
        startMenuWrapper: document.getElementById('startMenuWrapper')
    };
    
    console.log('🔍 UI Debug State:');
    for (const [name, element] of Object.entries(elements)) {
        if (element) {
            console.log(`  ${name}:`, {
                disabled: element.disabled,
                style_display: element.style.display,
                style_opacity: element.style.opacity,
                value: element.value || 'N/A'
            });
        } else {
            console.log(`  ${name}: NOT FOUND`);
        }
    }
}