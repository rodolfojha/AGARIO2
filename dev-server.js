// dev-server.js - Servidor completo con todas las APIs

const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config(); // Cargar variables de entorno

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS para todas las rutas
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Base de datos en memoria para desarrollo
const devDatabase = {
    users: new Map(),
    games: new Map()
};

// Inicializar usuario de prueba
devDatabase.users.set('dev-user-123', {
    id: 'dev-user-123',
    email: 'test@example.com',
    name: 'Test Player',
    balance_available: 100.00,
    balance_locked: 0.00
});

console.log('💾 In-memory database initialized');

// === API ROUTES ===

// Configuración de Google
app.get('/api/config/google', (req, res) => {
    console.log('🔧 Google config request');
    
    // Usar Client ID desde variables de entorno
    const clientId = process.env.GOOGLE_CLIENT_ID || "421367768275-jjk740oflbsa4km4sic9eid674fce1fm.apps.googleusercontent.com";
    
    res.json({
        clientId: clientId,
        configured: true,
        source: process.env.NODE_ENV || 'development'
    });
});

// Autenticación de Google
app.post('/api/auth/google', async (req, res) => {
    console.log('🔑 Google auth request:', req.method, req.body);
    
    const { token, googleIdToken } = req.body;
    
    // MODO DESARROLLO
    if (token === 'dev-token') {
        const user = devDatabase.users.get('dev-user-123');
        
        res.json({
            success: true,
            token: 'dev-jwt-token-' + Date.now(),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                balance_available: user.balance_available,
                balance_locked: user.balance_locked
            }
        });
        
        console.log('✅ Dev login successful for:', user.name);
        return;
    }
    
    // MODO PRODUCCIÓN - Google OAuth real
    if (googleIdToken) {
        try {
            console.log('🔐 Processing Google ID token...');
            
            // Importar la librería de Google Auth
            const { OAuth2Client } = require('google-auth-library');
            
            // Validar con Google
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            
            const ticket = await client.verifyIdToken({
                idToken: googleIdToken,
                audience: process.env.GOOGLE_CLIENT_ID
            });

            const payload = ticket.getPayload();
            console.log('✅ Google token verified for:', payload.email);

            // Usar Google ID como user ID
            const userId = 'google-' + payload.sub;
            console.log('🔍 Using user ID:', userId);
            
            let user = devDatabase.users.get(userId);

            if (!user) {
                // Nuevo usuario - crear con balance inicial
                user = {
                    id: userId,
                    google_id: payload.sub,
                    email: payload.email,
                    name: payload.name,
                    avatar: payload.picture,
                    balance_available: 100.00, // Balance inicial
                    balance_locked: 0.00
                };
                devDatabase.users.set(userId, user);
                console.log('🆕 New Google user created:', payload.email);
            } else {
                // Usuario existente - actualizar datos pero mantener balance
                user.name = payload.name;
                user.avatar = payload.picture;
                devDatabase.users.set(userId, user);
                console.log('🔄 Existing Google user updated:', payload.email);
            }

            const jwtToken = 'google-jwt-' + Date.now() + '-' + userId;
            console.log('🎫 Generated token for user ID:', userId);

            res.json({
                success: true,
                token: jwtToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    avatar: user.avatar,
                    balance_available: user.balance_available,
                    balance_locked: user.balance_locked
                }
            });

        } catch (googleError) {
            console.error('❌ Google token verification failed:', googleError);
            res.status(401).json({ 
                success: false, 
                error: 'Invalid Google token' 
            });
        }
        return;
    }

    // Token no reconocido
    res.status(401).json({ 
        success: false, 
        error: 'Valid token required (dev-token or googleIdToken)' 
    });
});

// Balance de usuario
app.get('/api/user/balance', (req, res) => {
    console.log('📊 Balance request');
    
    // Auth mejorada para soportar tokens de Google
    const authHeader = req.headers.authorization;
    if (!authHeader || (!authHeader.startsWith('Bearer dev-jwt-token') && !authHeader.startsWith('Bearer google-jwt-'))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let user;
    if (authHeader.startsWith('Bearer dev-jwt-token')) {
        user = devDatabase.users.get('dev-user-123');
    } else {
        // Extraer user ID del token de Google
        const tokenParts = authHeader.split('-');
        const userId = tokenParts.slice(-2).join('-'); // Últimas dos partes: google-userId
        user = devDatabase.users.get(userId);
    }
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        success: true,
        balance: {
            available: parseFloat(user.balance_available),
            locked: parseFloat(user.balance_locked),
            total: parseFloat(user.balance_available) + parseFloat(user.balance_locked)
        }
    });
    
    console.log('💰 Balance sent for user:', user.name, '- Available:', user.balance_available, 'Locked:', user.balance_locked);
});

// Agregar balance (para pruebas)
app.post('/api/user/balance', (req, res) => {
    console.log('💳 Add balance request:', req.body);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || (!authHeader.startsWith('Bearer dev-jwt-token') && !authHeader.startsWith('Bearer google-jwt-'))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount } = req.body;
    let user;
    
    if (authHeader.startsWith('Bearer dev-jwt-token')) {
        user = devDatabase.users.get('dev-user-123');
    } else {
        // Extraer user ID del token de Google
        const tokenParts = authHeader.split('-');
        const userId = tokenParts.slice(-2).join('-'); // Últimas dos partes: google-userId
        user = devDatabase.users.get(userId);
    }
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (amount && amount > 0) {
        user.balance_available += parseFloat(amount);
        
        if (authHeader.startsWith('Bearer dev-jwt-token')) {
            devDatabase.users.set('dev-user-123', user);
        } else {
            const tokenParts = authHeader.split('-');
            const userId = tokenParts.slice(-2).join('-');
            devDatabase.users.set(userId, user);
        }
        
        console.log('✅ Added $' + amount + ' for user:', user.name, '- New balance:', user.balance_available);
    }

    res.json({
        success: true,
        balance: {
            available: parseFloat(user.balance_available),
            locked: parseFloat(user.balance_locked),
            total: parseFloat(user.balance_available) + parseFloat(user.balance_locked)
        }
    });
});

// Iniciar juego
app.post('/api/game/start', (req, res) => {
    console.log('🎮 Start game request:', req.body);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || (!authHeader.startsWith('Bearer dev-jwt-token') && !authHeader.startsWith('Bearer google-jwt-'))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { betAmount } = req.body;
    let userId;
    if (authHeader.startsWith('Bearer dev-jwt-token')) {
        userId = 'dev-user-123';
    } else {
        // El token tiene formato: google-jwt-timestamp-google-userId
        const tokenParts = authHeader.split('-');
        // Tomar las últimas dos partes: google-userId
        userId = tokenParts.slice(-2).join('-');
    }

    // Validar monto
    if (!betAmount || betAmount < 1 || betAmount > 5) {
        return res.status(400).json({ 
            error: 'Bet amount must be between $1 and $5',
            received: betAmount
        });
    }

    const user = devDatabase.users.get(userId);

    // Verificar balance suficiente
    if (user.balance_available < betAmount) {
        return res.status(400).json({ 
            error: 'Insufficient balance',
            required: betAmount,
            available: user.balance_available
        });
    }

    // Bloquear fondos
    user.balance_available -= betAmount;
    user.balance_locked += betAmount;
    devDatabase.users.set(userId, user);

    // Crear juego
    const gameId = 'game-' + Date.now();
    const game = {
        id: gameId,
        player_id: userId,
        bet_amount: betAmount,
        current_value: betAmount,
        status: 'active',
        started_at: new Date().toISOString()
    };
    
    devDatabase.games.set(gameId, game);

    console.log('🎯 Game started - ID:', gameId, 'Bet:', betAmount);
    console.log('💰 New balance - Available:', user.balance_available, 'Locked:', user.balance_locked);

    res.json({
        success: true,
        game: {
            id: game.id,
            bet_amount: betAmount,
            current_value: betAmount
        },
        balance: {
            available: user.balance_available,
            locked: user.balance_locked
        }
    });
});

// Pagos (simulado para desarrollo)
app.post('/api/payments/nowpayments', (req, res) => {
    console.log('💳 Payment request:', req.body);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || (!authHeader.startsWith('Bearer dev-jwt-token') && !authHeader.startsWith('Bearer google-jwt-'))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount, currency = 'USD' } = req.body;
    
    if (!amount || amount < 1) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    // Simular respuesta de pago
    const paymentId = 'pay_' + Date.now();
    
    res.json({
        success: true,
        payment: {
            id: paymentId,
            amount: amount,
            currency: currency,
            status: 'pending',
            payment_url: `https://example.com/pay/${paymentId}`,
            created_at: new Date().toISOString()
        }
    });
    
    console.log('💳 Payment created:', paymentId, 'Amount:', amount);
});

// Cash out
app.post('/api/game/cashout', (req, res) => {
    console.log('💰 Cash out request:', req.body);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || (!authHeader.startsWith('Bearer dev-jwt-token') && !authHeader.startsWith('Bearer google-jwt-'))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { gameId, currentValue } = req.body;
    let userId;
    if (authHeader.startsWith('Bearer dev-jwt-token')) {
        userId = 'dev-user-123';
    } else {
        // El token tiene formato: google-jwt-timestamp-google-userId
        const tokenParts = authHeader.split('-');
        // Tomar las últimas dos partes: google-userId
        userId = tokenParts.slice(-2).join('-');
    }

    if (!gameId || currentValue === undefined) {
        return res.status(400).json({ error: 'Missing gameId or currentValue' });
    }

    // Calcular cash out (90% al usuario, 10% fee)
    const fee = currentValue * 0.1;
    const netAmount = currentValue * 0.9;

    const user = devDatabase.users.get(userId);
    const game = devDatabase.games.get(gameId);

    // Actualizar balances
    user.balance_available += netAmount;
    user.balance_locked = Math.max(0, user.balance_locked - currentValue);
    devDatabase.users.set(userId, user);

    // Finalizar juego
    if (game) {
        game.status = 'cashed_out';
        game.ended_at = new Date().toISOString();
        game.final_value = currentValue;
        devDatabase.games.set(gameId, game);
    }

    console.log('💸 Cash out processed:');
    console.log('  - Original value:', currentValue);
    console.log('  - Net amount:', netAmount);
    console.log('  - Fee:', fee);
    console.log('  - New balance:', user.balance_available);

    res.json({
        success: true,
        cashout: {
            original_value: currentValue,
            net_amount: netAmount,
            fee: fee,
            roi: game ? ((currentValue / game.bet_amount - 1) * 100).toFixed(2) : '0.00'
        },
        balance: {
            available: user.balance_available,
            locked: user.balance_locked
        }
    });
});

// === NOWPayments proxy routes (use real handlers in /api) ===
app.all('/api/payments/nowpayments', async (req, res) => {
    try {
        const mod = await import(path.join(process.cwd(), 'api', 'payments', 'nowpayments.js'));
        return mod.default(req, res);
    } catch (err) {
        console.error('NOWPayments route error:', err);
        res.status(500).json({ success: false, error: 'NOWPayments route error' });
    }
});

app.all('/api/payments/nowpayments-webhook', async (req, res) => {
    try {
        const mod = await import(path.join(process.cwd(), 'api', 'payments', 'nowpayments-webhook.js'));
        return mod.default(req, res);
    } catch (err) {
        console.error('NOWPayments webhook route error:', err);
        res.status(500).json({ success: false, error: 'NOWPayments webhook route error' });
    }
});

// Configuración de Google OAuth
app.get('/api/config/google', (req, res) => {
    console.log('🔧 Google config request');
    
    res.json({
        clientId: 'dev-google-client-id',
        apiKey: 'dev-google-api-key',
        scope: 'email profile',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/oauth2/v2/rest']
    });
});

// === SOCKET.IO HANDLING ===
io.on('connection', (socket) => {
    console.log('🔌 Socket.IO client connected:', socket.id);
    
    const type = socket.handshake.query.type;
    const userId = socket.handshake.query.userId;
    const gameId = socket.handshake.query.gameId;
    const betAmount = socket.handshake.query.betAmount;
    
    console.log('🎮 Game connection:', { type, userId, gameId, betAmount });
    
    // Manejar conexiones de jugadores
    if (type === 'player') {
        socket.on('gotit', (clientPlayerData) => {
            console.log('🎯 Player data received:', clientPlayerData);
            // Simular respuesta del servidor de juego
            socket.emit('welcome', {
                id: socket.id,
                name: clientPlayerData.name,
                x: Math.random() * 5000,
                y: Math.random() * 5000,
                mass: 10
            }, {
                width: 5000,
                height: 5000
            });
        });
        
        socket.on('pingcheck', () => {
            socket.emit('pongcheck');
        });
        
        socket.on('respawn', () => {
            console.log('🔄 Player respawn requested');
            socket.emit('welcome', {
                id: socket.id,
                name: 'Player',
                x: Math.random() * 5000,
                y: Math.random() * 5000,
                mass: 10
            }, {
                width: 5000,
                height: 5000
            });
        });
    }
    
    // Manejar conexiones de espectadores
    if (type === 'spectator') {
        console.log('👁️ Spectator connected');
    }
    
    socket.on('disconnect', () => {
        console.log('🔌 Socket.IO client disconnected:', socket.id);
    });
});

// === STATIC ROUTES ===

// Servir index.html para la raíz
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de prueba
app.get('/api/hello', (req, res) => {
    res.json({ 
        message: 'Hello from dev server!', 
        timestamp: new Date().toISOString(),
        database: {
            users: devDatabase.users.size,
            games: devDatabase.games.size
        }
    });
});

// === START SERVER ===

const PORT = 3000;
server.listen(PORT, () => {
    console.log('🌐 Dev server running at http://localhost:' + PORT);
    console.log('✅ APIs available:');
    console.log('  - POST /api/auth/google');
    console.log('  - GET  /api/config/google');
    console.log('  - GET  /api/user/balance');
    console.log('  - POST /api/user/balance');
    console.log('  - POST /api/game/start');
    console.log('  - POST /api/game/cashout');
    console.log('  - GET  /api/hello');
    console.log('');
    console.log('🎮 Socket.IO ready for game connections!');
    console.log('📊 Test user has $100.00 available');
});