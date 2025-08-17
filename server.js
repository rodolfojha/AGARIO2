require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.API_PORT || process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de salas
let currentRoomConfig = {
    currentRoom: 'medium',
    configs: {
        small: {
            name: 'Sala Pequeña',
            width: 1000,
            height: 1000,
            maxPlayers: 20
        },
        medium: {
            name: 'Sala Mediana',
            width: 2000,
            height: 2000,
            maxPlayers: 50
        },
        large: {
            name: 'Sala Grande',
            width: 3000,
            height: 3000,
            maxPlayers: 100
        }
    }
};

// Cargar configuración desde archivo si existe
const configFile = path.join(__dirname, 'room-config.json');
if (fs.existsSync(configFile)) {
    try {
        const savedConfig = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        currentRoomConfig = { ...currentRoomConfig, ...savedConfig };
        console.log('✅ Configuración cargada desde archivo');
    } catch (error) {
        console.error('❌ Error cargando configuración:', error);
    }
}

// Función para guardar configuración
function saveConfig() {
    try {
        fs.writeFileSync(configFile, JSON.stringify(currentRoomConfig, null, 2));
        console.log('💾 Configuración guardada');
    } catch (error) {
        console.error('❌ Error guardando configuración:', error);
    }
}

// Rutas API

// GET /api/hello
app.get('/api/hello', (req, res) => {
    res.json({
        message: 'Hello from VPS server!',
        timestamp: new Date().toISOString(),
        database: {
            users: 5,
            games: 70
        }
    });
});

// GET /api/test
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API test endpoint working!',
        timestamp: new Date().toISOString()
    });
});

// GET /api/admin/room-config
app.get('/api/admin/room-config', (req, res) => {
    console.log('📋 GET /api/admin/room-config');
    res.json({
        success: true,
        config: currentRoomConfig
    });
});

// POST /api/admin/room-config
app.post('/api/admin/room-config', (req, res) => {
    console.log('🔧 POST /api/admin/room-config');
    console.log('📦 Request body:', req.body);
    console.log('📋 Headers:', req.headers);
    
    const { roomType } = req.body;
    
    if (!roomType || !currentRoomConfig.configs[roomType]) {
        console.log('❌ Invalid room type:', roomType);
        return res.status(400).json({
            success: false,
            error: 'Invalid room type'
        });
    }
    
    currentRoomConfig.currentRoom = roomType;
    saveConfig();
    
    console.log('✅ Room config updated to:', roomType);
    res.json({
        success: true,
        config: currentRoomConfig
    });
});

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
    console.log('🔑 POST /api/admin/login');
    
    // Simular login de admin
    res.json({
        success: true,
        token: 'admin-jwt-token-' + Date.now(),
        user: {
            id: 'admin-user',
            email: 'admin@splittaio.com',
            is_admin: true
        }
    });
});

// GET /api/admin/check-status
app.get('/api/admin/check-status', (req, res) => {
    console.log('🔍 GET /api/admin/check-status');
    
    // Verificar token de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer admin-jwt-')) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized'
        });
    }
    
    res.json({
        success: true,
        isAdmin: true,
        user: {
            id: 'admin-user',
            email: 'admin@splittaio.com',
            is_admin: true
        }
    });
});

// GET /api/admin/stats
app.get('/api/admin/stats', (req, res) => {
    console.log('📊 GET /api/admin/stats');
    
    res.json({
        success: true,
        stats: {
            totalUsers: 150,
            activeGames: 3,
            totalGames: 1250,
            currentRoom: currentRoomConfig.currentRoom,
            roomConfig: currentRoomConfig
        }
    });
});

// GET /api/config/google - Configuración de Google OAuth
app.get('/api/config/google', (req, res) => {
    console.log('🔧 GET /api/config/google');
    
    res.json({
        success: true,
        clientId: process.env.GOOGLE_CLIENT_ID || null,
        configured: !!process.env.GOOGLE_CLIENT_ID
    });
});

// GET /api/user/profile - Perfil del usuario
app.get('/api/user/profile', (req, res) => {
    console.log('👤 GET /api/user/profile');
    
    // Verificar token de autorización
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Token de autorización requerido'
        });
    }
    
    // Simular datos del usuario
    res.json({
        success: true,
        user: {
            id: 'user-123',
            email: 'usuario@example.com',
            name: 'Usuario Demo',
            balance: 100.50,
            gamesPlayed: 25,
            winRate: 0.68
        }
    });
});

// Endpoint duplicado eliminado - se usa el de abajo

// POST /api/game/start
app.post('/api/game/start', (req, res) => {
    console.log('🎮 POST /api/game/start');
    
    const { betAmount, playerName } = req.body;
    
    // Validar monto
    if (!betAmount || betAmount < 1 || betAmount > 5) {
        return res.status(400).json({ 
            success: false,
            error: 'Bet amount must be between $1 and $5',
            received: betAmount
        });
    }
    
    try {
        // Cargar balance actual del usuario dev
        const fs = require('fs');
        const balanceFile = './dev-user-balance.json';
        
        let userBalance = 450; // Balance por defecto
        let lockedBalance = 0;
        
        if (fs.existsSync(balanceFile)) {
            const balanceData = JSON.parse(fs.readFileSync(balanceFile, 'utf8'));
            userBalance = balanceData.balance_available || 450;
            lockedBalance = balanceData.balance_locked || 0;
        }
        
        // Verificar balance suficiente
        if (userBalance < betAmount) {
            return res.status(400).json({ 
                success: false,
                error: 'Insufficient balance',
                required: betAmount,
                available: userBalance
            });
        }
        
        // Descontar apuesta del balance disponible
        userBalance -= betAmount;
        lockedBalance += betAmount;
        
        // Guardar balance actualizado
        const newBalanceData = {
            user_id: 'dev-user-123',
            balance_available: userBalance,
            balance_locked: lockedBalance,
            last_updated: new Date().toISOString()
        };
        
        fs.writeFileSync(balanceFile, JSON.stringify(newBalanceData, null, 2));
        
        // Crear juego con ID único
        const gameId = 'game-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        console.log('🎯 Game started:');
        console.log('  - Bet amount:', betAmount);
        console.log('  - Previous balance:', userBalance + betAmount);
        console.log('  - New balance available:', userBalance);
        console.log('  - New balance locked:', lockedBalance);
        
        res.json({
            success: true,
            game: {
                id: gameId,
                bet_amount: betAmount,
                current_value: betAmount,
                player_name: playerName || 'Player',
                roomConfig: currentRoomConfig
            },
            balance: {
                available: userBalance,
                locked: lockedBalance
            }
        });
    } catch (error) {
        console.error('❌ Error starting game:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /api/game/cashout
app.post('/api/game/cashout', (req, res) => {
    console.log('💰 POST /api/game/cashout');
    
    const { gameId, currentValue } = req.body;
    
    if (!gameId || currentValue === undefined) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing gameId or currentValue' 
        });
    }
    
    // Validar que el valor sea positivo
    if (currentValue <= 0) {
        return res.status(400).json({ 
            success: false, 
            error: 'Current value must be positive' 
        });
    }
    
    try {
        // Cargar balance actual del usuario dev
        const fs = require('fs');
        const balanceFile = './dev-user-balance.json';
        
        let userBalance = 450; // Balance por defecto
        let lockedBalance = 0;
        
        if (fs.existsSync(balanceFile)) {
            const balanceData = JSON.parse(fs.readFileSync(balanceFile, 'utf8'));
            userBalance = balanceData.balance_available || 450;
            lockedBalance = balanceData.balance_locked || 0;
        }
        
        // Calcular cash out (90% al usuario, 10% fee)
        const fee = currentValue * 0.1;
        const netAmount = currentValue * 0.9;
        
        // Liberar balance bloqueado y agregar ganancia
        userBalance += netAmount;
        lockedBalance = 0;
        
        // Guardar balance actualizado
        const newBalanceData = {
            user_id: 'dev-user-123',
            balance_available: userBalance,
            balance_locked: lockedBalance,
            last_updated: new Date().toISOString()
        };
        
        fs.writeFileSync(balanceFile, JSON.stringify(newBalanceData, null, 2));
        
        console.log('💸 Cash out processed:');
        console.log('  - Game ID:', gameId);
        console.log('  - Original value:', currentValue);
        console.log('  - Net amount:', netAmount);
        console.log('  - Fee:', fee);
        console.log('  - Previous balance:', userBalance - netAmount);
        console.log('  - New balance available:', userBalance);
        console.log('  - New balance locked:', lockedBalance);
        
        res.json({
            success: true,
            cashout: {
                game_id: gameId,
                original_value: currentValue,
                net_amount: netAmount,
                fee: fee,
                roi: 0 // ROI se calcula en el frontend
            },
            balance: {
                available: userBalance,
                locked: lockedBalance
            }
        });
    } catch (error) {
        console.error('❌ Error processing cash out:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /api/auth/login - Login de usuario
app.post('/api/auth/login', (req, res) => {
    console.log('🔑 POST /api/auth/login');
    
    const { email, password, provider } = req.body;
    
    // Simular login exitoso
    res.json({
        success: true,
        token: 'jwt-token-' + Date.now(),
        user: {
            id: 'user-' + Date.now(),
            email: email || 'demo@example.com',
            name: 'Usuario Demo',
            balance: 100.00,
            avatar: null,
            provider: provider || 'local'
        }
    });
});

// POST /api/auth/google - Login con Google
app.post('/api/auth/google', (req, res) => {
    console.log('🔐 POST /api/auth/google');
    
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({
            success: false,
            error: 'Token de Google requerido'
        });
    }
    
    // Simular login con Google exitoso
    res.json({
        success: true,
        token: 'jwt-google-token-' + Date.now(),
        user: {
            id: 'google-user-' + Date.now(),
            email: 'usuario@gmail.com',
            name: 'Usuario Google',
            balance: 100.00,
            avatar: 'https://lh3.googleusercontent.com/a/default-user',
            provider: 'google'
        }
    });
});

// GET /api/auth/verify - Verificar token
app.get('/api/auth/verify', (req, res) => {
    console.log('🔍 GET /api/auth/verify');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Token no válido'
        });
    }
    
    res.json({
        success: true,
        user: {
            id: 'user-123',
            email: 'usuario@example.com',
            name: 'Usuario Demo',
            balance: 100.50
        }
    });
});

// GET /api/user/balance - Obtener balance del usuario
app.get('/api/user/balance', (req, res) => {
    console.log('💰 GET /api/user/balance');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Token no válido'
        });
    }
    
    try {
        // Cargar balance actual del usuario dev desde archivo
        const fs = require('fs');
        const balanceFile = './dev-user-balance.json';
        
        let userBalance = 450.00; // Balance por defecto
        let lockedBalance = 0.00;
        
        if (fs.existsSync(balanceFile)) {
            const balanceData = JSON.parse(fs.readFileSync(balanceFile, 'utf8'));
            userBalance = balanceData.balance_available || 450.00;
            lockedBalance = balanceData.balance_locked || 0.00;
        }
        
        console.log('💰 Balance loaded from file:', { available: userBalance, locked: lockedBalance });
        
        res.json({
            success: true,
            balance: {
                available: userBalance,
                locked: lockedBalance,
                total: userBalance + lockedBalance
            }
        });
    } catch (error) {
        console.error('❌ Error loading balance:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// POST /api/user/balance - Agregar balance (para pruebas)
app.post('/api/user/balance', (req, res) => {
    console.log('💰 POST /api/user/balance');
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            error: 'Token no válido'
        });
    }
    
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
        return res.status(400).json({
            success: false,
            error: 'Amount must be positive'
        });
    }
    
    // Simular balance actualizado
    const newBalance = 450 + amount;
    
    res.json({
        success: true,
        balance: {
            available: newBalance,
            locked: 0.00,
            total: newBalance
        }
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor API corriendo en puerto ${PORT}`);
    console.log(`📁 Archivos estáticos servidos desde: ${path.join(__dirname, 'public')}`);
    console.log(`🏟️ Configuración actual: ${currentRoomConfig.currentRoom}`);
});

// Manejo de errores
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
