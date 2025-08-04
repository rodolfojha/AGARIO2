// api/game/cashout.js - Cash out (ARCHIVO SEPARADO)

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
        const { gameId, currentValue } = req.body;
        const userId = 'dev-user-123';

        if (!gameId || currentValue === undefined) {
            return res.status(400).json({ error: 'Missing gameId or currentValue' });
        }

        // Verificar que la base de datos global existe
        if (!global.devDatabase) {
            return res.status(500).json({ error: 'Database not initialized' });
        }

        // Calcular cash out (90% al usuario, 10% fee)
        const fee = currentValue * 0.1;
        const netAmount = currentValue * 0.9;

        // Obtener usuario
        let user = global.devDatabase.users.get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Actualizar balances
        user.balance_available += netAmount;
        user.balance_locked = Math.max(0, user.balance_locked - currentValue);
        global.devDatabase.users.set(userId, user);

        // Finalizar juego
        const game = global.devDatabase.games.get(gameId);
        if (game) {
            game.status = 'cashed_out';
            game.ended_at = new Date().toISOString();
            game.final_value = currentValue;
            global.devDatabase.games.set(gameId, game);
        }

        console.log('💰 Cash out processed:', { 
            gameId, 
            originalValue: currentValue, 
            netAmount, 
            fee 
        });

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

    } catch (error) {
        console.error('Cash out error:', error);
        res.status(500).json({ error: 'Failed to process cash out' });
    }
};