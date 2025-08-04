// dev-server.js - Servidor completo con todas las APIs

const express = require('express');
const path = require('path');
const app = express();

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

// Autenticación
app.post('/api/auth/google', (req, res) => {
    console.log('🔑 Auth request:', req.method, req.body);
    
    const { token } = req.body;
    
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
        
        console.log('✅ Login successful for:', user.name);
    } else {
        res.status(401).json({ 
            success: false, 
            error: 'Invalid token' 
        });
    }
});

// Balance de usuario
app.get('/api/user/balance', (req, res) => {
    console.log('📊 Balance request');
    
    // Auth simple
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer dev-jwt-token')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = devDatabase.users.get('dev-user-123');
    
    res.json({
        success: true,
        balance: {
            available: parseFloat(user.balance_available),
            locked: parseFloat(user.balance_locked),
            total: parseFloat(user.balance_available) + parseFloat(user.balance_locked)
        }
    });
    
    console.log('💰 Balance sent:', user.balance_available, 'available,', user.balance_locked, 'locked');
});

// Agregar balance (para pruebas)
app.post('/api/user/balance', (req, res) => {
    console.log('💳 Add balance request:', req.body);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer dev-jwt-token')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { amount } = req.body;
    const user = devDatabase.users.get('dev-user-123');
    
    if (amount && amount > 0) {
        user.balance_available += parseFloat(amount);
        devDatabase.users.set('dev-user-123', user);
        
        console.log('✅ Added $' + amount + ', new balance:', user.balance_available);
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
    if (!authHeader || !authHeader.startsWith('Bearer dev-jwt-token')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { betAmount } = req.body;
    const userId = 'dev-user-123';

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

// Cash out
app.post('/api/game/cashout', (req, res) => {
    console.log('💰 Cash out request:', req.body);
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer dev-jwt-token')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { gameId, currentValue } = req.body;
    const userId = 'dev-user-123';

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
app.listen(PORT, () => {
    console.log('🌐 Dev server running at http://localhost:' + PORT);
    console.log('✅ APIs available:');
    console.log('  - POST /api/auth/google');
    console.log('  - GET  /api/user/balance');
    console.log('  - POST /api/user/balance');
    console.log('  - POST /api/game/start');
    console.log('  - POST /api/game/cashout');
    console.log('  - GET  /api/hello');
    console.log('');
    console.log('🎮 Ready for testing!');
    console.log('📊 Test user has $100.00 available');
});