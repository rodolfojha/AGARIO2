// api/user/balance.js - Balance usando base de datos global

export default async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verificar autenticación simple
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer dev-jwt-token')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Asegurar que la base de datos global existe
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

    const userId = 'dev-user-123';
    let user = global.devDatabase.users.get(userId);

    if (!user) {
        // Crear usuario si no existe
        user = {
            id: userId,
            email: 'test@example.com',
            name: 'Test Player',
            balance_available: 100.00,
            balance_locked: 0.00
        };
        global.devDatabase.users.set(userId, user);
    }

    if (req.method === 'GET') {
        // Obtener balance actual
        console.log('📊 Getting balance for user:', userId);
        
        res.json({
            success: true,
            balance: {
                available: parseFloat(user.balance_available),
                locked: parseFloat(user.balance_locked),
                total: parseFloat(user.balance_available) + parseFloat(user.balance_locked)
            }
        });

    } else if (req.method === 'POST') {
        // Agregar balance (para pruebas)
        try {
            const { amount } = req.body;
            
            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }

            user.balance_available += parseFloat(amount);
            global.devDatabase.users.set(userId, user);
            
            console.log('💰 Added balance:', amount, 'New total:', user.balance_available);

            res.json({
                success: true,
                balance: {
                    available: parseFloat(user.balance_available),
                    locked: parseFloat(user.balance_locked),
                    total: parseFloat(user.balance_available) + parseFloat(user.balance_locked)
                }
            });

        } catch (error) {
            console.error('Add balance error:', error);
            res.status(500).json({ error: 'Failed to add balance' });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};