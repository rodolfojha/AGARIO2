// api/game/start.js - Iniciar juego (SOLO este archivo)

// Base de datos en memoria compartida
if (!global.devDatabase) {
    global.devDatabase = {
        users: new Map(),
        games: new Map()
    };
    
    // Inicializar usuario de prueba
    global.devDatabase.users.set('dev-user-123', {
        id: 'dev-user-123',
        email: 'test@example.com',
        name: 'Test Player',
        balance_available: 100.00,
        balance_locked: 0.00
    });
}

export default async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Auth simple
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer dev-jwt-token')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { betAmount } = req.body;
        const userId = 'dev-user-123';

        // Validar monto
        if (!betAmount || betAmount < 1 || betAmount > 5) {
            return res.status(400).json({ 
                error: 'Bet amount must be between $1 and $5' 
            });
        }

        const user = global.devDatabase.users.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

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
        global.devDatabase.users.set(userId, user);

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
        
        global.devDatabase.games.set(gameId, game);

        console.log('🎮 Game started:', { userId, betAmount, gameId });

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

    } catch (error) {
        console.error('Start game error:', error);
        res.status(500).json({ error: 'Failed to start game' });
    }
};